export interface Player {
  username: string | null;
  id: string | null;
  color: string;
  dirX: number;
  dirY: number;
  speed: number;
  segments: Segment[];
  pendingGrowth: number;
  alive: boolean;
  respawnTime: number;
  score: number;
  highScore: number;
  powerups: {
    speed_boost: {
      active: boolean;
      endTime: number;
      duration: number;
      multiplier: number;
    };
  };
}

export interface Segment {
  x: number;
  y: number;
}

export interface Food {
  x: number;
  y: number;
  type: string;
  color: string;
}

export interface FoodType {
  points: number;
  growth: number;
  color: string;
  chance: number;
  effect?: string;
}

export interface GameConfig {
  ARENA_WIDTH: number;
  ARENA_HEIGHT: number;
  FOOD_COUNT: number;
  MAX_FOOD_COUNT: number;
  BASE_SPEED: number;
  MIN_SPEED: number;
  RESPAWN_DELAY: number;
  UPDATE_RATE: number;
  BROADCAST_RATE: number;
  VISIBLE_RADIUS: number;
  POWERUP_DURATION: number;
  MAX_USERNAME_LENGTH: number;
  FOOD_TYPES: {
    [key: string]: FoodType;
  };
  PLAYER_COLORS: string[];
}
