const gameConfig = require('../config/gameConfig');

class Game {
    constructor() {
        this.players = {};
        this.food = [];
        this.initFood();
    }

    initFood() {
        this.food = Array(gameConfig.FOOD_COUNT).fill().map(() => this.createFood());
    }

    createFood() {
        const type = this.getRandomFoodType();
        return {
            x: Math.random() * gameConfig.ARENA_WIDTH,
            y: Math.random() * gameConfig.ARENA_HEIGHT,
            type: type,
            color: gameConfig.FOOD_TYPES[type].color
        };
    }

    getRandomFoodType() {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [foodType, props] of Object.entries(gameConfig.FOOD_TYPES)) {
            cumulative += props.chance;
            if (rand <= cumulative) return foodType;
        }
        return 'NORMAL';
    }

    getRandomColor() {
        return gameConfig.PLAYER_COLORS[Math.floor(Math.random() * gameConfig.PLAYER_COLORS.length)];
    }

    createPlayer() {
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
                speed_boost: { active: false, endTime: 0 }
            }
        };
    }

    calculateSpeed(length) {
        const speedReduction = Math.log10(length + 1) / 4;
        const baseReduction = length / 200;
        return Math.max(gameConfig.MIN_SPEED, gameConfig.BASE_SPEED - speedReduction - baseReduction);
    }

    moveSnake(player) {
        const head = player.segments[0];
        const newHead = {
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

    checkFoodCollision(player) {
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
                    player.powerups.speed_boost.endTime = now + gameConfig.POWERUP_DURATION;
                    player.speed = gameConfig.BASE_SPEED * 1.5;
                }

                this.food[i] = this.createFood();
                return true;
            }
        }
        return false;
    }

    checkCollisions(player) {
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

    createFoodAtPosition(x, y, points = 10) {
        return {
            x: x,
            y: y,
            type: 'NORMAL',
            color: gameConfig.FOOD_TYPES['NORMAL'].color
        };
    }

    dropSnakeSegmentsAsFood(player) {
        player.segments.forEach(segment => {
            if (this.food.length < gameConfig.MAX_FOOD_COUNT) {
                this.food.push(this.createFoodAtPosition(segment.x, segment.y));
            }
        });
    }

    update() {
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
                    player.powerups.speed_boost = { active: false, endTime: 0 };
                }
                continue;
            }

            if (player.segments.length === 0) continue;

            player.speed = player.powerups.speed_boost.active ? 
                gameConfig.BASE_SPEED * 1.5 : 
                this.calculateSpeed(player.segments.length);

            this.moveSnake(player);
            this.checkFoodCollision(player);

            if (this.checkCollisions(player)) {
                this.dropSnakeSegmentsAsFood(player);
                player.alive = false;
                player.respawnTime = Date.now() + gameConfig.RESPAWN_DELAY;
            }
        }
    }
}

module.exports = Game;