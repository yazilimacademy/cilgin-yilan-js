class MyScene extends Phaser.Scene {
    constructor() {
      super('MyScene');
    }
  
    create() {
      // Start with a placeholder text
      this.infoText = this.add.text(100, 100, 'Waiting to join...', { color: '#00ff00', fontSize: '32px' });
  
      this.players = {};
      this.food = [];
  
      this.snakeGraphics = this.add.graphics();
      this.foodGraphics = this.add.graphics();
  
      this.clientId = null;
  
      this.cameras.main.setBounds(0, 0, 10000, 10000);
      this.cameraTarget = this.add.rectangle(0, 0, 10, 10, 0x000000, 0);
      this.cameras.main.startFollow(this.cameraTarget, true, 0.1, 0.1);
    }
  
    setupSocket(username) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys({ 
        w: Phaser.Input.Keyboard.KeyCodes.W,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        s: Phaser.Input.Keyboard.KeyCodes.S,
        d: Phaser.Input.Keyboard.KeyCodes.D
      });

      this.socket = io();
      this.socket.emit('join', username);
  
      this.socket.on('welcome', (msg) => {
        console.log('Received from server:', msg);
        this.infoText.setText(msg);
      });
  
      this.socket.on('yourId', (id) => {
        this.clientId = id;
        console.log('My client ID:', id);
      });
  
      this.socket.on('stateUpdate', (data) => {
        this.players = data.players;
        this.food = data.food;
      });
    }
  
    update() {
      if (!this.clientId) return; // Wait until we have an ID
  
      this.handleInput();
      this.drawFood();
      this.drawPlayers();
      this.updateCameraTarget();
    }
  
    drawFood() {
      this.foodGraphics.clear();
      this.foodGraphics.fillStyle(0xff0000, 1);
  
      const camX = this.cameras.main.scrollX;
      const camY = this.cameras.main.scrollY;
      const camW = this.game.scale.width;
      const camH = this.game.scale.height;
  
      for (const f of this.food) {
        if (f.x > camX && f.x < camX + camW &&
            f.y > camY && f.y < camY + camH) {
          this.foodGraphics.fillCircle(f.x, f.y, 5);
        }
      }
    }
  
    drawPlayers() {
      this.snakeGraphics.clear();
      for (const id in this.players) {
        const p = this.players[id];
        if (!p.alive || p.segments.length === 0) continue;
  
        const color = Phaser.Display.Color.HexStringToColor(p.color).color;
        this.snakeGraphics.fillStyle(color, 1);
  
        // Draw snake segments
        for (const seg of p.segments) {
          this.snakeGraphics.fillRect(seg.x, seg.y, 20, 20);
        }
  
        // Draw username above head
        const head = p.segments[0];
        if (p.username) {
          // Use a simple text style
          this.snakeGraphics.save();
          this.snakeGraphics.fillStyle(0xffffff, 1);
  
          // We'll draw the username using a separate text object since graphics can't do text:
          // Instead of adding text each frame, let's do a dynamic text object approach:
          // Actually, we can do this with a BitmapText or a dedicated text object per player,
          // but that might get complicated. For simplicity, let's just store a reference to text objects.
        }
      }
  
      // Drawing text for usernames:
      // Since we don't want to create new text objects every frame,
      // let's instead create or reuse text objects. We'll do that below after we handle all players.
  
      // Remove old texts
      if (!this.playerNameTexts) this.playerNameTexts = {};
      for (const id in this.playerNameTexts) {
        this.playerNameTexts[id].setVisible(false);
      }
  
      for (const id in this.players) {
        const p = this.players[id];
        if (!p.alive || p.segments.length === 0 || !p.username) continue;
  
        const head = p.segments[0];
  
        // Create a text object if it doesn't exist
        if (!this.playerNameTexts[id]) {
          this.playerNameTexts[id] = this.add.text(head.x, head.y - 30, p.username, {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 4, y: 2 }
          }).setOrigin(0.5);
        }
  
        const nameText = this.playerNameTexts[id];
        nameText.setPosition(head.x, head.y - 30);
        nameText.setText(p.username);
        nameText.setDepth(10);
        nameText.setVisible(true);
      }
    }
  
    updateCameraTarget() {
      if (!this.clientId || !this.players[this.clientId]) return;
      const player = this.players[this.clientId];
      if (!player.alive || player.segments.length === 0) return;
  
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
  }
  
  const config = {
    type: Phaser.AUTO,
    parent: 'gameContainer',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#222',
    scene: [MyScene]
  };
  
  const game = new Phaser.Game(config);
  
  window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
  });
  
  // Handle username input
  document.getElementById('joinBtn').onclick = () => {
    const username = document.getElementById('usernameInput').value.trim() || 'Player';
    document.getElementById('overlay').style.display = 'none';
    
    // Access the scene and call setupSocket with the username
    const scene = game.scene.keys.MyScene;
    scene.setupSocket(username);
  };
  