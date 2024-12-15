import { Scene } from 'phaser';
import { config } from '@/config/gameConfig';
import { Player } from '@/types/game';

export class UI {
  private scene: Scene;
  private scoreboardTitle: Phaser.GameObjects.Text | null = null;
  private scoreboardTexts: Phaser.GameObjects.Text[] = [];
  private scoreText: Phaser.GameObjects.Text | null = null;
  private highScoreText: Phaser.GameObjects.Text | null = null;
  private powerupText: Phaser.GameObjects.Text | null = null;
  private minimapContainer: Phaser.GameObjects.Container | null = null;
  private minimapBg: Phaser.GameObjects.Rectangle | null = null;
  private minimapBorder: Phaser.GameObjects.Rectangle | null = null;
  private minimapGraphics: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    this.setupScoreboard();
    this.setupMinimap();
    this.setupStatusTexts();
  }

  private setupScoreboard(): void {
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

    this.scoreboardTexts = Array(config.SCOREBOARD.TOP_PLAYERS).fill(null).map((_, i) => 
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

  private setupStatusTexts(): void {
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

  private setupMinimap(): void {
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

  updateScoreboard(players: { [key: string]: Partial<Player> }, clientId: string): void {
    if (!players || !clientId) return;

    const sortedPlayers = Object.values(players)
      .filter(player => player?.alive && player?.username)
      .sort((a, b) => ((b.score || 0) - (a.score || 0)))
      .slice(0, config.SCOREBOARD.TOP_PLAYERS);

    sortedPlayers.forEach((player, index) => {
      const isCurrentPlayer = player.id === clientId;
      const color = isCurrentPlayer ? config.COLORS.CURRENT_PLAYER : config.COLORS.TEXT;
      const text = `${index + 1}. ${player.username}`;
      const score = `${player.score || 0}`;
      const dots = '.'.repeat(Math.max(0, 20 - text.length - score.length));
      if (this.scoreboardTexts[index]) {
        this.scoreboardTexts[index].setText(`${text}${dots}${score}`);
        this.scoreboardTexts[index].setColor(color);
      }
    });

    for (let i = sortedPlayers.length; i < config.SCOREBOARD.TOP_PLAYERS; i++) {
      if (this.scoreboardTexts[i]) {
        this.scoreboardTexts[i].setText('');
      }
    }
  }

  updateMinimap(players: { [key: string]: Player }, clientId: string, arenaWidth: number, arenaHeight: number, visibleRadius: number): void {
    if (this.minimapGraphics) {
      this.minimapGraphics.clear();
    }

    const containerX = this.scene.game.scale.width - config.MINIMAP.SIZE - config.MINIMAP.PADDING;
    const containerY = this.scene.game.scale.height - config.MINIMAP.SIZE - config.MINIMAP.PADDING;

    Object.values(players).forEach(player => {
      if (!player.alive || player.segments.length === 0) return;

      const isCurrentPlayer = player.id === clientId;
      const head = player.segments[0];

      const minimapX = containerX + (head.x / arenaWidth * config.MINIMAP.SIZE);
      const minimapY = containerY + (head.y / arenaHeight * config.MINIMAP.SIZE);

      if (this.minimapGraphics) {
        this.minimapGraphics.fillStyle(isCurrentPlayer ? 0x00ff00 : 0xff0000, 1);
        this.minimapGraphics.fillCircle(minimapX, minimapY, isCurrentPlayer ? 4 : 3);

        if (isCurrentPlayer) {
          this.minimapGraphics.lineStyle(1, 0x00ff00, 0.3);
          const viewRadius = (visibleRadius / arenaWidth) * config.MINIMAP.SIZE;
          this.minimapGraphics.strokeCircle(minimapX, minimapY, viewRadius);
        }
      }
    });
  }

  updateStatusTexts(player?: Player): void {
    if (!player) {
      if (this.scoreText) {
        this.scoreText.setText('Score: 0');
      }
      if (this.highScoreText) {
        this.highScoreText.setText('High Score: 0');
      }
      if (this.powerupText) {
        this.powerupText.setVisible(false);
      }
      return;
    }
    
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${player.score || 0}`);
    }
    if (this.highScoreText) {
      this.highScoreText.setText(`High Score: ${player.highScore || 0}`);
    }
    
    if (player.powerups?.speed_boost?.active) {
      const timeLeft = Math.max(0, Math.ceil((player.powerups.speed_boost.endTime - Date.now()) / 1000));
      if (timeLeft <= config.POWERUP_DURATION) {  
        if (this.powerupText) {
          this.powerupText.setText(`Speed Boost: ${timeLeft}s`).setVisible(true);
        }
      } else {
        if (this.powerupText) {
          this.powerupText.setVisible(false);
        }
      }
    } else {
      if (this.powerupText) {
        this.powerupText.setVisible(false);
      }
    }
  }

  handleResize(): void {
    const newMinimapX = this.scene.game.scale.width - config.MINIMAP.SIZE - config.MINIMAP.PADDING;
    const newMinimapY = this.scene.game.scale.height - config.MINIMAP.SIZE - config.MINIMAP.PADDING;
    if (this.minimapContainer) {
      this.minimapContainer.setPosition(newMinimapX, newMinimapY);
    }

    const newScoreboardX = this.scene.game.scale.width - 220;
    if (this.scoreboardTitle) {
      this.scoreboardTitle.setPosition(newScoreboardX, 20);
    }
    
    if (this.scoreboardTexts) {
      this.scoreboardTexts.forEach((text, index) => {
        if (text) {
          text.setPosition(newScoreboardX, 60 + (index * 30));
        }
      });
    }
  }
}
