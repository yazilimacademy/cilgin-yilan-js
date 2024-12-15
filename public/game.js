import config from './config.js';
import { UI } from './ui.js';

class MyScene extends Phaser.Scene {
  constructor() {
    super('MyScene');
    this.ARENA_WIDTH = 5000;
    this.ARENA_HEIGHT = 5000;
    this.VISIBLE_RADIUS = 2000;
  }

  create() {
    this.infoText = this.add.text(100, 100, 'Waiting to join...', { color: config.COLORS.POWERUP, fontSize: '32px' });
    this.ui = new UI(this);
    this.players = {};
    this.food = [];
    this.snakeGraphics = this.add.graphics().setDepth(1);
    this.foodGraphics = this.add.graphics().setDepth(1);
    this.clientId = null;
    this.lastRenderTime = 0;
    this.setupCamera();
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, 10000, 10000);
    this.cameraTarget = this.add.rectangle(0, 0, 10, 10, 0x000000, 0);
    this.cameras.main.startFollow(this.cameraTarget, true, 0.1, 0.1);
  }

  setupSocket(username) {
    this.setupControls();
    this.socket = io();
    this.handleJoin(username);
    this.setupSocketListeners();
  }

  setupControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({ 
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D
    });
  }

  handleJoin(username) {
    if (!username) return;
    if (username.length > gameConfig.MAX_USERNAME_LENGTH) {
      username = username.substring(0, gameConfig.MAX_USERNAME_LENGTH);
    }
    this.socket.emit('join', username);
  }

  setupSocketListeners() {
    this.socket.on('welcome', msg => {
      this.infoText.setText(msg);
    });

    this.socket.on('yourId', id => {
      this.clientId = id;
    });

    this.socket.on('gameConfig', config => {
      this.ARENA_WIDTH = config.arenaWidth;
      this.ARENA_HEIGHT = config.arenaHeight;
      this.VISIBLE_RADIUS = config.visibleRadius;
    });

    this.socket.on('stateUpdate', data => {
      this.players = data.players;
      this.food = data.food;
    });
  }

  update() {
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
    this.drawPlayers(camX, camY, camW, camH);
    this.updateCameraTarget();
    this.ui.updateScoreboard(this.players, this.clientId);
    this.ui.updateMinimap(this.players, this.clientId, this.ARENA_WIDTH, this.ARENA_HEIGHT, this.VISIBLE_RADIUS);
    this.ui.updateStatusTexts(this.players[this.clientId]);
  }

  drawFood(camX, camY, camW, camH) {
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

  drawPlayers(camX, camY, camW, camH) {
    this.snakeGraphics.clear();
    if (!this.playerNameTexts) this.playerNameTexts = {};
    
    Object.keys(this.playerNameTexts).forEach(id => {
      this.playerNameTexts[id].setVisible(false);
    });

    const padding = 100;
    Object.entries(this.players).forEach(([id, p]) => {
      if (!p.alive || p.segments.length === 0) return;

      const head = p.segments[0];

      if (head.x < camX - padding || head.x > camX + camW + padding || 
          head.y < camY - padding || head.y > camY + camH + padding) {
        return;
      }

      const baseColor = Phaser.Display.Color.HexStringToColor(p.color);
      const darkerColor = Phaser.Display.Color.ValueToColor(baseColor.color).darken(30);
      
      this.snakeGraphics.lineStyle(6, baseColor.color, 0.3);
      this.snakeGraphics.strokeRoundedRect(head.x - 3, head.y - 3, 26, 26, 8);

      p.segments.forEach((seg, index) => {
        this.snakeGraphics.fillStyle(baseColor.color, 1);
        if (index === 0) {
          this.snakeGraphics.fillRoundedRect(seg.x, seg.y, 20, 20, 8);
          this.snakeGraphics.fillStyle(0xFFFFFF, 1);
          const eyeSize = 4;
          this.snakeGraphics.fillCircle(seg.x + 6, seg.y + 6, eyeSize);
          this.snakeGraphics.fillCircle(seg.x + 14, seg.y + 6, eyeSize);
          this.snakeGraphics.fillStyle(0x000000, 1);
          this.snakeGraphics.fillCircle(seg.x + 6, seg.y + 6, eyeSize/2);
          this.snakeGraphics.fillCircle(seg.x + 14, seg.y + 6, eyeSize/2);
        } else {
          this.snakeGraphics.fillRoundedRect(seg.x, seg.y, 20, 20, 6);
          this.snakeGraphics.fillStyle(darkerColor.color, 0.5);
          this.snakeGraphics.fillRoundedRect(seg.x + 4, seg.y + 4, 12, 12, 4);
        }
      });

      if (p.username) {
        if (!this.playerNameTexts[id]) {
          this.playerNameTexts[id] = this.add.text(p.segments[0].x + 10, p.segments[0].y - 30, p.username, {
            fontSize: '16px',
            color: config.COLORS.TEXT,
            fontStyle: 'bold',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 6, y: 3 },
            shadow: { blur: 2, color: 'rgba(0,0,0,0.5)', fill: true }
          }).setOrigin(0.5);
        }

        const nameText = this.playerNameTexts[id];
        nameText.setPosition(p.segments[0].x + 10, p.segments[0].y - 30);
        nameText.setText(p.username);
        nameText.setDepth(10);
        nameText.setVisible(true);
      }
    });
  }

  updateCameraTarget() {
    const player = this.players[this.clientId];
    if (!player?.alive || player.segments.length === 0) return;
    
    const head = player.segments[0];
    this.cameraTarget.x = head.x;
    this.cameraTarget.y = head.y;
  }

  handleInput() {
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

  handleResize() {
    this.ui.handleResize();
  }
}

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'gameContainer',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: config.COLORS.BACKGROUND,
  scene: [MyScene],
  MAX_USERNAME_LENGTH: 11
};

const game = new Phaser.Game(gameConfig);

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
  game.scene.keys.MyScene.handleResize();
});

document.getElementById('joinBtn').onclick = () => {
  const username = document.getElementById('usernameInput').value.trim() || 'Player';
  document.getElementById('overlay').style.display = 'none';
  game.scene.keys.MyScene.setupSocket(username);
};