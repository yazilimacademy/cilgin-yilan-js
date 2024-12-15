const gameConfig = {
    ARENA_WIDTH: 5000,
    ARENA_HEIGHT: 5000,
    FOOD_COUNT: 1000,
    MAX_FOOD_COUNT: 1500,
    BASE_SPEED: 3,
    MIN_SPEED: 1,
    RESPAWN_DELAY: 3000,
    UPDATE_RATE: 60,
    BROADCAST_RATE: 40,
    VISIBLE_RADIUS: 2000,
    POWERUP_DURATION: 3000,

    FOOD_TYPES: {
        NORMAL: { points: 10, growth: 1, color: '#ff0000', chance: 0.7 },
        SUPER: { points: 25, growth: 2, color: '#ffff00', chance: 0.2 },
        SPEED: { points: 15, growth: 1, color: '#00ff00', chance: 0.1, effect: 'speed_boost' }
    },

    PLAYER_COLORS: [
        '#e6194b', '#3cb44b', '#ffe119', '#0082c8',
        '#f58231', '#911eb4', '#46f0f0', '#f032e6',
        '#d2f53c', '#fabebe', '#008080', '#e6beff',
        '#aa6e28', '#fffac8', '#800000', '#aaffc3',
        '#808000', '#ffd8b1', '#000080', '#808080'
    ]
};

module.exports = gameConfig;