import config from './config.js';
import { UI } from './ui.js';

class MyScene extends Phaser.Scene {
  constructor() {
    super('MyScene');
    this.segmentPool = [];
    this.maxPoolSize = config.MAX_POOL_SIZE;
  }

  create() {
    this.infoText = this.add.text(this.game.scale.width / 2, this.game.scale.height / 2, 'Waiting to join...', { 
        color: config.COLORS.POWERUP, 
        fontSize: '32px' 
    }).setOrigin(0.5);
    
    this.ui = new UI(this);
    this.players = {};
    this.allPlayers = {};
    this.food = [];
    this.snakeGraphics = this.add.graphics().setDepth(1);
    this.foodGraphics = this.add.graphics().setDepth(1);
    this.clientId = null;
    this.lastRenderTime = 0;
    this.setupCamera();
    this.initializeSegmentPool();
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, 10000, 10000);
    this.cameraTarget = this.add.rectangle(0, 0, 10, 10, 0x000000, 0);
    this.cameras.main.startFollow(this.cameraTarget, true, 0.1, 0.1);
  }

  initializeSegmentPool() {
    for (let i = 0; i < this.maxPoolSize; i++) {
      this.segmentPool.push({
        x: 0,
        y: 0,
        active: false
      });
    }
  }

  getSegmentFromPool() {
    let segment = this.segmentPool.find(s => !s.active);
    if (!segment) {
      segment = { x: 0, y: 0, active: false };
      this.segmentPool.push(segment);
    }
    segment.active = true;
    return segment;
  }

  returnSegmentToPool(segment) {
    segment.active = false;
  }

  setupSocket(username) {
    this.setupControls();
    this.socket = io();
    
    this.socket.on('connect_error', (error) => {
      console.error('Connection Error:', error);
      this.infoText.setText('Connection Error! Please refresh the page.');
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.handleJoin(username);
    });

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
      console.log('Welcome message:', msg);
      this.infoText.setText(msg);
    });

    this.socket.on('yourId', id => {
      console.log('Received ID:', id);
      this.clientId = id;
    });

    this.socket.on('gameConfig', config => {
      console.log('Received game config:', config);
      this.ARENA_WIDTH = config.arenaWidth;
      this.ARENA_HEIGHT = config.arenaHeight;
      this.VISIBLE_RADIUS = config.visibleRadius;
      this.cameras.main.setBounds(0, 0, this.ARENA_WIDTH, this.ARENA_HEIGHT);
    });

    this.socket.on('stateUpdate', data => {
      if (!this.clientId) return;
      
      Object.values(this.players).forEach(player => {
        if (player.segments) {
          player.segments.forEach(segment => {
            this.returnSegmentToPool(segment);
          });
        }
      });

      this.players = data.players || {};
      this.allPlayers = data.allPlayers || {};
      
      Object.values(this.players).forEach(player => {
        if (player.segments) {
          player.segments = player.segments.map(segmentData => {
            const segment = this.getSegmentFromPool();
            segment.x = segmentData.x;
            segment.y = segmentData.y;
            return segment;
          });
        }
      });

      this.food = data.food || [];
      
      if (this.players[this.clientId]) {
        this.infoText.setVisible(false);
      }
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
    this.batchRenderSnakes();
    this.updateCameraTarget();
    this.ui.updateScoreboard(this.allPlayers, this.clientId);
    this.ui.updateMinimap(this.players, this.clientId, this.ARENA_WIDTH, this.ARENA_HEIGHT, this.VISIBLE_RADIUS);
    this.ui.updateStatusTexts(this.players[this.clientId]);
  }

  batchRenderSnakes() {
    this.snakeGraphics.clear();

    if (this.playerNameTexts) {
      Object.keys(this.playerNameTexts).forEach(playerId => {
        if (!this.players[playerId] || !this.players[playerId].alive) {
          this.playerNameTexts[playerId].destroy();
          delete this.playerNameTexts[playerId];
        }
      });
    }

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
        
        if (!this.playerNameTexts) this.playerNameTexts = {};
        
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
    if (this.infoText) {
      this.infoText.setPosition(this.game.scale.width / 2, this.game.scale.height / 2);
    }
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