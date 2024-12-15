import config from './config.js';

export class UI {
  constructor(scene) {
    this.scene = scene;
    this.setupScoreboard();
    this.setupMinimap();
    this.setupStatusTexts();
  }

  setupScoreboard() {
    this.scoreboardTitle = this.scene.add.text(
      this.scene.game.scale.width - 220, 20,
      'TOP 5 PLAYERS',
      { 
        fontFamily: 'Courier',
        fontSize: '20px',
        color: config.COLORS.TEXT,
        align: 'left'
      }
    ).setScrollFactor(0).setDepth(2);

    this.scoreboardTexts = Array(config.SCOREBOARD.TOP_PLAYERS).fill().map((_, i) => 
      this.scene.add.text(
        this.scene.game.scale.width - 220, 60 + (i * 30),
        '',
        { 
          fontFamily: 'Courier',
          fontSize: '16px',
          color: config.COLORS.TEXT,
          fixedWidth: config.SCOREBOARD.WIDTH,
          align: 'left'
        }
      ).setScrollFactor(0).setDepth(2)
    );
  }

  setupStatusTexts() {
    this.scoreText = this.scene.add.text(
      config.SCOREBOARD.PADDING, 
      config.SCOREBOARD.PADDING, 
      'Score: 0', 
      { 
        fontSize: '24px',
        color: config.COLORS.TEXT,
        fontStyle: 'bold',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 10, y: 5 }
      }
    ).setScrollFactor(0);

    this.highScoreText = this.scene.add.text(
      config.SCOREBOARD.PADDING, 
      config.SCOREBOARD.PADDING + 40, 
      'High Score: 0', 
      { 
        fontSize: '24px',
        color: config.COLORS.CURRENT_PLAYER,
        fontStyle: 'bold',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 10, y: 5 }
      }
    ).setScrollFactor(0);

    this.powerupText = this.scene.add.text(
      config.SCOREBOARD.PADDING, 
      config.SCOREBOARD.PADDING + 80, 
      '', 
      {
        fontSize: '24px',
        color: config.COLORS.POWERUP,
        fontStyle: 'bold',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 10, y: 5 }
      }
    ).setScrollFactor(0);
  }

  setupMinimap() {
    this.minimapContainer = this.scene.add.container(
      this.scene.game.scale.width - config.MINIMAP.SIZE - config.MINIMAP.PADDING,
      this.scene.game.scale.height - config.MINIMAP.SIZE - config.MINIMAP.PADDING
    ).setScrollFactor(0).setDepth(10);

    this.minimapBg = this.scene.add.rectangle(
      config.MINIMAP.SIZE/2, 
      config.MINIMAP.SIZE/2, 
      config.MINIMAP.SIZE, 
      config.MINIMAP.SIZE,
      parseInt(config.COLORS.MINIMAP_BG.replace('#', '0x')), 
      1
    );

    this.minimapBorder = this.scene.add.rectangle(
      config.MINIMAP.SIZE/2, 
      config.MINIMAP.SIZE/2, 
      config.MINIMAP.SIZE, 
      config.MINIMAP.SIZE,
      parseInt(config.COLORS.MINIMAP_BG.replace('#', '0x')), 
      1
    );
    this.minimapBorder.setStrokeStyle(2, parseInt(config.COLORS.MINIMAP_BORDER.replace('#', '0x')));

    this.minimapGraphics = this.scene.add.graphics().setScrollFactor(0).setDepth(10);
    this.minimapContainer.add([this.minimapBg, this.minimapBorder]);
  }

  updateScoreboard(players, clientId) {
    const sortedPlayers = Object.values(players)
      .filter(player => player.alive && player.username)
      .sort((a, b) => b.score - a.score)
      .slice(0, config.SCOREBOARD.TOP_PLAYERS);

    sortedPlayers.forEach((player, index) => {
      const isCurrentPlayer = player.id === clientId;
      const color = isCurrentPlayer ? config.COLORS.CURRENT_PLAYER : config.COLORS.TEXT;
      const text = `${index + 1}. ${player.username}`;
      const score = `${player.score}`;
      const dots = '.'.repeat(Math.max(0, 20 - text.length - score.length));
      this.scoreboardTexts[index].setText(`${text}${dots}${score}`);
      this.scoreboardTexts[index].setColor(color);
    });

    for (let i = sortedPlayers.length; i < config.SCOREBOARD.TOP_PLAYERS; i++) {
      this.scoreboardTexts[i].setText('');
    }
  }

  updateMinimap(players, clientId, arenaWidth, arenaHeight, visibleRadius) {
    this.minimapGraphics.clear();

    const containerX = this.scene.game.scale.width - config.MINIMAP.SIZE - config.MINIMAP.PADDING;
    const containerY = this.scene.game.scale.height - config.MINIMAP.SIZE - config.MINIMAP.PADDING;

    Object.values(players).forEach(player => {
      if (!player.alive || player.segments.length === 0) return;

      const isCurrentPlayer = player.id === clientId;
      const head = player.segments[0];

      const minimapX = containerX + (head.x / arenaWidth * config.MINIMAP.SIZE);
      const minimapY = containerY + (head.y / arenaHeight * config.MINIMAP.SIZE);

      this.minimapGraphics.fillStyle(isCurrentPlayer ? 0x00ff00 : 0xff0000, 1);
      this.minimapGraphics.fillCircle(minimapX, minimapY, isCurrentPlayer ? 4 : 3);

      if (isCurrentPlayer) {
        this.minimapGraphics.lineStyle(1, 0x00ff00, 0.3);
        const viewRadius = (visibleRadius / arenaWidth) * config.MINIMAP.SIZE;
        this.minimapGraphics.strokeCircle(minimapX, minimapY, viewRadius);
      }
    });
  }

  updateStatusTexts(player) {
    if (!player) return;
    
    this.scoreText.setText(`Score: ${player.score}`);
    this.highScoreText.setText(`High Score: ${player.highScore}`);
    
    if (player.powerups.speed_boost.active) {
      const timeLeft = Math.max(0, Math.ceil((player.powerups.speed_boost.endTime - Date.now()) / 1000));
      this.powerupText.setText(`Speed Boost: ${timeLeft}s`).setVisible(true);
    } else {
      this.powerupText.setVisible(false);
    }
  }

  handleResize() {
    const newMinimapX = this.scene.game.scale.width - config.MINIMAP.SIZE - config.MINIMAP.PADDING;
    const newMinimapY = this.scene.game.scale.height - config.MINIMAP.SIZE - config.MINIMAP.PADDING;
    this.minimapContainer.setPosition(newMinimapX, newMinimapY);

    const newScoreboardX = this.scene.game.scale.width - 220;
    this.scoreboardTitle.setPosition(newScoreboardX, 20);
    
    this.scoreboardTexts.forEach((text, index) => {
      text.setPosition(newScoreboardX, 60 + (index * 30));
    });
  }
}