import { GameConfig } from '../types';

const gameConfig: GameConfig = {
  ARENA_WIDTH: 5000,
  ARENA_HEIGHT: 5000,
  FOOD_COUNT: 500,
  MAX_FOOD_COUNT: 500,
  BASE_SPEED: 4,
  MIN_SPEED: 2,
  RESPAWN_DELAY: 3000,
  UPDATE_RATE: 30,
  BROADCAST_RATE: 45,
  VISIBLE_RADIUS: 1500,
  POWERUP_DURATION: 3000,
  MAX_USERNAME_LENGTH: 11,

  FOOD_TYPES: {
    NORMAL: { points: 10, growth: 1, color: '#ff0000', chance: 0.8 },
    SUPER: { points: 25, growth: 2, color: '#ffff00', chance: 0.15 },
    SPEED: { points: 15, growth: 1, color: '#00ff00', chance: 0.05, effect: 'speed_boost' }
  },

  PLAYER_COLORS: [
    '#e6194b', '#3cb44b', '#ffe119', '#0082c8',
    '#f58231', '#911eb4', '#46f0f0', '#f032e6',
    '#d2f53c', '#fabebe', '#008080', '#e6beff',
    '#aa6e28', '#fffac8', '#800000', '#aaffc3',
    '#808000', '#ffd8b1', '#000080', '#808080'
  ]
};

export default gameConfig;
