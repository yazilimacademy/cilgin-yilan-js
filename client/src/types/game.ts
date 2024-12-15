export interface Segment {
  x: number;
  y: number;
}

export interface Powerup {
  active: boolean;
  endTime: number;
  duration: number;
  multiplier: number;
}

export interface Player {
  id: string;
  username: string;
  color: string;
  segments: Segment[];
  score: number;
  highScore: number;
  alive: boolean;
  powerups: {
    speed_boost: Powerup;
  };
}

export interface Food {
  x: number;
  y: number;
  type: 'NORMAL' | 'SUPER' | 'SPEED';
  color: string;
}

export interface GameState {
  players: { [key: string]: Player };
  allPlayers: { [key: string]: Omit<Player, 'segments' | 'powerups' | 'color'> };
  food: Food[];
}

export interface GameConfig {
  arenaWidth: number;
  arenaHeight: number;
  visibleRadius: number;
}
