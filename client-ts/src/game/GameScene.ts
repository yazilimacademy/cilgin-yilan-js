import { Scene } from 'phaser';
import { Socket } from 'socket.io-client';
import { UI } from './UI';
import { config } from '@/config/gameConfig';
import { GameConfig, GameState, Player } from '@/types/game';

export class GameScene extends Scene {
  private socket?: Socket;
  private ui!: UI;
  private players: { [key: string]: Player } = {};
  private allPlayers: GameState['allPlayers'] = {};
  private food: GameState['food'] = [];
  private snakeGraphics!: Phaser.GameObjects.Graphics;
  private foodGraphics!: Phaser.GameObjects.Graphics;
  private clientId: string | null = null;
  private lastRenderTime = 0;
  private cameraTarget!: Phaser.GameObjects.Rectangle;
  private playerNameTexts: { [key: string]: Phaser.GameObjects.Text } = {};
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: { [key: string]: Phaser.Input.Keyboard.Key };
  private infoText!: Phaser.GameObjects.Text;
  private ARENA_WIDTH = 0;
  private ARENA_HEIGHT = 0;
  private VISIBLE_RADIUS = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.infoText = this.add.text(
      this.game.scale.width / 2,
      this.game.scale.height / 2,
      'Waiting to join...',
      {
        color: config.COLORS.POWERUP,
        fontSize: '32px'
      }
    ).setOrigin(0.5);

    this.ui = new UI(this);
    this.snakeGraphics = this.add.graphics().setDepth(1);
    this.foodGraphics = this.add.graphics().setDepth(1);
    this.setupCamera();
    this.setupControls();
  }

  setupSocket(socket: Socket): void {
    this.socket = socket;
    this.setupSocketListeners();
  }

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, 10000, 10000);
    this.cameraTarget = this.add.rectangle(0, 0, 10, 10, 0x000000, 0);
    this.cameras.main.startFollow(this.cameraTarget, true, 0.1, 0.1);
  }

  private setupControls(): void {
    if (!this.input || !this.input.keyboard) return;
    
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D
    }) as { [key: string]: Phaser.Input.Keyboard.Key };
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('welcome', (msg: string) => {
      console.log('Welcome message:', msg);
      if (this.infoText) {
        this.infoText.setText(msg);
      }
    });

    this.socket.on('yourId', (id: string) => {
      console.log('Received ID:', id);
      this.clientId = id;
    });

    this.socket.on('gameConfig', (config: GameConfig) => {
      console.log('Received game config:', config);
      this.ARENA_WIDTH = config.arenaWidth;
      this.ARENA_HEIGHT = config.arenaHeight;
      this.VISIBLE_RADIUS = config.visibleRadius;
      if (this.cameras && this.cameras.main) {
        this.cameras.main.setBounds(0, 0, this.ARENA_WIDTH, this.ARENA_HEIGHT);
      }
    });

    this.socket.on('stateUpdate', (data: GameState) => {
      if (!this.clientId) return;

      Object.values(this.players).forEach(player => {
        if (player.segments) {
          player.segments.forEach(segment => {
            (segment as any).active = false;
          });
        }
      });

      this.players = data.players || {};
      this.allPlayers = data.allPlayers || {};
      this.food = data.food || [];

      if (this.players[this.clientId] && this.infoText) {
        this.infoText.setVisible(false);
      }
    });
  }

  update(): void {
    if (!this.clientId) return;

    const now = performance.now();
    const elapsed = now - this.lastRenderTime;
    
    if (elapsed < 16.67) return;
    
    this.lastRenderTime = now;
    this.handleInput();

    const camX = this.cameras.main.scrollX;
    const camY = this.cameras.main.scrollY;
    const camW = this.game.scale.width;
    const camH = this.game.scale.height;

    this.drawFood(camX, camY, camW, camH);
    this.batchRenderSnakes();
    this.updateCameraTarget();
    this.ui.updateScoreboard(this.allPlayers, this.clientId);
    this.ui.updateMinimap(this.players, this.clientId, this.ARENA_WIDTH, this.ARENA_HEIGHT, this.VISIBLE_RADIUS);
    this.ui.updateStatusTexts(this.players[this.clientId]);
  }

  private handleInput(): void {
    if (!this.socket) return;

    let dx = 0;
    let dy = 0;

    if (this.cursors.up.isDown || this.keys.w.isDown) dy = -1;
    if (this.cursors.down.isDown || this.keys.s.isDown) dy = 1;
    if (this.cursors.left.isDown || this.keys.a.isDown) dx = -1;
    if (this.cursors.right.isDown || this.keys.d.isDown) dx = 1;

    if (dx !== 0 || dy !== 0) {
      this.socket.emit('changeDirection', { dx, dy });
    }
  }

  private drawFood(camX: number, camY: number, camW: number, camH: number): void {
    this.foodGraphics.clear();

    const padding = 100;
    this.food.forEach(f => {
      if (f.x > camX - padding && f.x < camX + camW + padding && 
          f.y > camY - padding && f.y < camY + camH + padding) {
        const color = Phaser.Display.Color.HexStringToColor(f.color);
        const size = f.type === 'SUPER' ? 12 : 8;
        
        this.foodGraphics.lineStyle(4, color.color, 0.3);
        this.foodGraphics.strokeCircle(f.x, f.y, size + 4);
        
        this.foodGraphics.fillStyle(color.color, 1);
        this.foodGraphics.fillCircle(f.x, f.y, size);
        
        this.foodGraphics.fillStyle(0xffffff, 0.5);
        this.foodGraphics.fillCircle(f.x - size/3, f.y - size/3, size/3);
      }
    });
  }

  private batchRenderSnakes(): void {
    this.snakeGraphics.clear();

    Object.keys(this.playerNameTexts).forEach(playerId => {
      if (!this.players[playerId] || !this.players[playerId].alive) {
        this.playerNameTexts[playerId].destroy();
        delete this.playerNameTexts[playerId];
      }
    });

    Object.values(this.players).forEach(player => {
      if (!player.segments || !player.alive) return;

      const baseColor = Phaser.Display.Color.HexStringToColor(player.color);
      const darkerColor = Phaser.Display.Color.ValueToColor(baseColor.color).darken(30);

      player.segments.forEach((segment, index) => {
        if (index === 0) {
          this.snakeGraphics.fillStyle(baseColor.color, 1);
          this.snakeGraphics.fillRoundedRect(segment.x, segment.y, 20, 20, 8);
          
          this.snakeGraphics.fillStyle(0xFFFFFF, 1);
          const eyeSize = 4;
          this.snakeGraphics.fillCircle(segment.x + 6, segment.y + 6, eyeSize);
          this.snakeGraphics.fillCircle(segment.x + 14, segment.y + 6, eyeSize);
          
          this.snakeGraphics.fillStyle(0x000000, 1);
          this.snakeGraphics.fillCircle(segment.x + 6, segment.y + 6, eyeSize/2);
          this.snakeGraphics.fillCircle(segment.x + 14, segment.y + 6, eyeSize/2);

          this.snakeGraphics.lineStyle(6, baseColor.color, 0.3);
          this.snakeGraphics.strokeRoundedRect(segment.x - 3, segment.y - 3, 26, 26, 8);
        } else {
          this.snakeGraphics.fillStyle(baseColor.color, 1);
          this.snakeGraphics.fillRoundedRect(segment.x, segment.y, 20, 20, 6);
          
          this.snakeGraphics.fillStyle(darkerColor.color, 0.5);
          this.snakeGraphics.fillRoundedRect(segment.x + 4, segment.y + 4, 12, 12, 4);
        }
      });

      if (player.username) {
        const head = player.segments[0];
        const style = {
          fontSize: '16px',
          color: '#ffffff',
          fontStyle: 'bold',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: { x: 6, y: 3 },
          shadow: { blur: 2, color: 'rgba(0,0,0,0.5)', fill: true }
        };
        
        if (!this.playerNameTexts[player.id]) {
          this.playerNameTexts[player.id] = this.add.text(head.x + 10, head.y - 30, player.username, style).setOrigin(0.5);
        }
        
        const nameText = this.playerNameTexts[player.id];
        nameText.setPosition(head.x + 10, head.y - 30);
        nameText.setText(player.username);
        nameText.setDepth(10);
        nameText.setVisible(true);
      }
    });
  }

  private updateCameraTarget(): void {
    if (!this.clientId || !this.players[this.clientId]?.alive || !this.players[this.clientId]?.segments?.length) return;
    
    const head = this.players[this.clientId].segments[0];
    this.cameraTarget.x = head.x;
    this.cameraTarget.y = head.y;
  }

  handleResize(): void {
    if (this.infoText) {
      this.infoText.setPosition(this.game.scale.width / 2, this.game.scale.height / 2);
    }
    this.ui.handleResize();
  }
}
