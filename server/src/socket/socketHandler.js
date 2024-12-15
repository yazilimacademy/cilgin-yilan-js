const gameConfig = require('../config/gameConfig');

class SocketHandler {
    constructor(io, game) {
        this.io = io;
        this.game = game;
        this.setupSocketHandlers();
        this.setupGameLoop();
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            this.game.players[socket.id] = this.game.createPlayer();
            this.game.players[socket.id].id = socket.id;

            socket.on('join', (username) => this.handleJoin(socket, username));
            socket.on('changeDirection', (dir) => this.handleDirectionChange(socket, dir));
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    handleJoin(socket, username) {
        const player = this.game.players[socket.id];
        if (player) {
            player.username = username || 'Player';
            socket.emit('yourId', socket.id);
            socket.emit('welcome', `Hello ${username}, welcome to the Snake arena!`);
            socket.emit('gameConfig', {
                arenaWidth: gameConfig.ARENA_WIDTH,
                arenaHeight: gameConfig.ARENA_HEIGHT,
                visibleRadius: gameConfig.VISIBLE_RADIUS
            });
        }
    }

    handleDirectionChange(socket, dir) {
        const player = this.game.players[socket.id];
        if (player && player.alive && player.segments.length > 0) {
            player.dirX = dir.dx;
            player.dirY = dir.dy;
        }
    }

    handleDisconnect(socket) {
        delete this.game.players[socket.id];
    }

    setupGameLoop() {
        setInterval(() => {
            this.game.update();
        }, 1000 / gameConfig.UPDATE_RATE);

        setInterval(() => {
            this.broadcastGameState();
        }, 1000 / gameConfig.BROADCAST_RATE);
    }

    broadcastGameState() {
        for (const [id, player] of Object.entries(this.game.players)) {
            if (!player.alive || player.segments.length === 0) {
                this.io.to(id).emit('stateUpdate', { players: this.game.players, food: [] });
                continue;
            }

            const playerHead = player.segments[0];
            const visibleFood = this.game.food.filter(f =>
                Math.abs(f.x - playerHead.x) < gameConfig.VISIBLE_RADIUS &&
                Math.abs(f.y - playerHead.y) < gameConfig.VISIBLE_RADIUS
            );

            this.io.to(id).emit('stateUpdate', { players: this.game.players, food: visibleFood });
        }
    }
}

module.exports = SocketHandler;