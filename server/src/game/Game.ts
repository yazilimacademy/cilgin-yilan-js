import gameConfig from '../config/gameConfig';
import { Player, Food, Segment } from '../types';

export default class Game {
  private players: { [key: string]: Player };
  private food: Food[];

  constructor() {
    this.players = {};
    this.food = [];
    this.initFood();
  }

  private initFood(): void {
    this.food = Array(gameConfig.FOOD_COUNT).fill(null).map(() => this.createFood());
  }

  private createFood(): Food {
    const type = this.getRandomFoodType();
    return {
      x: Math.random() * gameConfig.ARENA_WIDTH,
      y: Math.random() * gameConfig.ARENA_HEIGHT,
      type,
      color: gameConfig.FOOD_TYPES[type].color
    };
  }

  private getRandomFoodType(): string {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [foodType, props] of Object.entries(gameConfig.FOOD_TYPES)) {
      cumulative += props.chance;
      if (rand <= cumulative) return foodType;
    }
    return 'NORMAL';
  }

  private getRandomColor(): string {
    return gameConfig.PLAYER_COLORS[Math.floor(Math.random() * gameConfig.PLAYER_COLORS.length)];
  }

  public createPlayer(): Player {
    return {
      username: null,
      id: null,
      color: this.getRandomColor(),
      dirX: 1,
      dirY: 0,
      speed: gameConfig.BASE_SPEED,
      segments: [{
        x: Math.random() * gameConfig.ARENA_WIDTH,
        y: Math.random() * gameConfig.ARENA_HEIGHT
      }],
      pendingGrowth: 0,
      alive: true,
      respawnTime: 0,
      score: 0,
      highScore: 0,
      powerups: {
        speed_boost: {
          active: false,
          endTime: 0,
          duration: gameConfig.POWERUP_DURATION,
          multiplier: 1.5
        }
      }
    };
  }

  private calculateSpeed(length: number): number {
    const speedReduction = Math.log10(length + 1) / 4;
    const baseReduction = length / 200;
    return Math.max(gameConfig.MIN_SPEED, gameConfig.BASE_SPEED - speedReduction - baseReduction);
  }

  private moveSnake(player: Player): void {
    const head = player.segments[0];
    const newHead: Segment = {
      x: (head.x + player.dirX * player.speed + gameConfig.ARENA_WIDTH) % gameConfig.ARENA_WIDTH,
      y: (head.y + player.dirY * player.speed + gameConfig.ARENA_HEIGHT) % gameConfig.ARENA_HEIGHT
    };

    player.segments.unshift(newHead);
    if (player.pendingGrowth > 0) {
      player.pendingGrowth--;
    } else {
      player.segments.pop();
    }
  }

  public checkFoodCollision(player: Player): boolean {
    const head = player.segments[0];
    const now = Date.now();
    
    if (player.powerups.speed_boost.active && now > player.powerups.speed_boost.endTime) {
      player.powerups.speed_boost.active = false;
      player.speed = this.calculateSpeed(player.segments.length);
    }

    for (let i = this.food.length - 1; i >= 0; i--) {
      const f = this.food[i];
      const dx = f.x - head.x;
      const dy = f.y - head.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 20) {
        const foodProps = gameConfig.FOOD_TYPES[f.type];
        player.pendingGrowth += foodProps.growth;
        player.score += foodProps.points;
        if (player.score > player.highScore) {
          player.highScore = player.score;
        }

        if (f.type === 'SPEED') {
          player.powerups.speed_boost.active = true;
          player.powerups.speed_boost.endTime = now + player.powerups.speed_boost.duration;
          player.speed = gameConfig.BASE_SPEED * player.powerups.speed_boost.multiplier;
        }

        this.food[i] = this.createFood();
        return true;
      }
    }
    return false;
  }

  public checkCollisions(player: Player): boolean {
    const head = player.segments[0];

    for (const otherId in this.players) {
      const other = this.players[otherId];
      if (other === player || !other.alive) continue;

      for (const segment of other.segments) {
        const dx = head.x - segment.x;
        const dy = head.y - segment.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
          return true;
        }
      }
    }

    return false;
  }

  private createFoodAtPosition(x: number, y: number): Food {
    return {
      x,
      y,
      type: 'NORMAL',
      color: gameConfig.FOOD_TYPES['NORMAL'].color
    };
  }

  private dropSnakeSegmentsAsFood(player: Player): void {
    player.segments.forEach(segment => {
      if (this.food.length < gameConfig.MAX_FOOD_COUNT) {
        this.food.push(this.createFoodAtPosition(segment.x, segment.y));
      }
    });
  }

  public handlePlayerDeath(player: Player): void {
    if (!player?.alive) return;
    
    player.alive = false;
    if (player.score > player.highScore) {
      player.highScore = player.score;
    }

    player.segments.forEach(segment => {
      const foodType = Math.random() < 0.1 ? 'SUPER' : 'NORMAL';
      this.food.push({
        x: segment.x + Math.random() * 20 - 10,
        y: segment.y + Math.random() * 20 - 10,
        color: player.color,
        type: foodType
      });
    });

    player.segments = [];
    player.score = 0;
    player.powerups = {
      speed_boost: { active: false, endTime: 0, duration: gameConfig.POWERUP_DURATION, multiplier: 1.5 }
    };
  }

  public update(): void {
    for (const playerId in this.players) {
      const player = this.players[playerId];
      
      if (!player.alive) {
        if (Date.now() >= player.respawnTime) {
          player.alive = true;
          player.segments = [{
            x: Math.random() * gameConfig.ARENA_WIDTH,
            y: Math.random() * gameConfig.ARENA_HEIGHT
          }];
          player.score = 0;
          player.pendingGrowth = 0;
          player.speed = gameConfig.BASE_SPEED;
          player.powerups.speed_boost = {
            active: false,
            endTime: 0,
            duration: gameConfig.POWERUP_DURATION,
            multiplier: 1.5
          };
        }
        continue;
      }

      this.moveSnake(player);
      
      if (this.checkCollisions(player)) {
        this.handlePlayerDeath(player);
        player.respawnTime = Date.now() + gameConfig.RESPAWN_DELAY;
        continue;
      }

      this.checkFoodCollision(player);
    }
  }

  public getPlayers(): { [key: string]: Player } {
    return this.players;
  }

  public getFood(): Food[] {
    return this.food;
  }

  public addPlayer(id: string): void {
    this.players[id] = this.createPlayer();
    this.players[id].id = id;
  }

  public removePlayer(id: string): void {
    delete this.players[id];
  }
}
