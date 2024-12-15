const gameConfig = require('../config/gameConfig');

class SocketHandler {
    constructor(io, game) {
        this.io = io;
        this.game = game;
        this.setupSocketHandlers();
        this.setupGameLoop();
        console.log('SocketHandler initialized');
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('New client connected:', socket.id);
            
            this.game.players[socket.id] = this.game.createPlayer();
            this.game.players[socket.id].id = socket.id;

            socket.on('join', (username) => {
                console.log('Join request from:', socket.id, 'username:', username);
                this.handleJoin(socket, username);
            });
            
            socket.on('changeDirection', (dir) => {
                this.handleDirectionChange(socket, dir);
            });
            
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                this.handleDisconnect(socket);
            });
        });
    }

    handleJoin(socket, username) {
        console.log('Processing join for:', socket.id);
        
        const player = this.game.players[socket.id];
        if (player) {
            player.username = username || 'Player';
            player.id = socket.id;
            player.highScore = 0;
            
            console.log('Sending initial data to:', socket.id);
            
            socket.emit('yourId', socket.id);
            socket.emit('welcome', `Hello ${username}, welcome to the Snake arena!`);
            socket.emit('gameConfig', {
                arenaWidth: gameConfig.ARENA_WIDTH,
                arenaHeight: gameConfig.ARENA_HEIGHT,
                visibleRadius: gameConfig.VISIBLE_RADIUS
            });
            
            const visibleFood = this.game.food.filter(f =>
                Math.abs(f.x - player.segments[0].x) < gameConfig.VISIBLE_RADIUS &&
                Math.abs(f.y - player.segments[0].y) < gameConfig.VISIBLE_RADIUS
            );

            socket.emit('stateUpdate', {
                players: {
                    [socket.id]: {
                        id: socket.id,
                        username: player.username,
                        color: player.color,
                        segments: player.segments,
                        score: player.score,
                        highScore: player.highScore,
                        powerups: player.powerups,
                        alive: player.alive
                    }
                },
                allPlayers: Object.fromEntries(
                    Object.entries(this.game.players)
                        .filter(([_, p]) => p?.alive)
                        .map(([id, p]) => [id, {
                            id: p.id,
                            username: p.username,
                            score: p.score,
                            highScore: p.highScore,
                            alive: p.alive
                        }])
                ),
                food: visibleFood
            });
        } else {
            console.error('Player not found for socket:', socket.id);
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
        console.log('Setting up game loop');
        
        setInterval(() => {
            this.game.update();
        }, 1000 / gameConfig.UPDATE_RATE);

        setInterval(() => {
            this.broadcastGameState();
        }, 1000 / gameConfig.BROADCAST_RATE);
    }

    broadcastGameState() {
        Object.entries(this.game.players).forEach(([socketId, player]) => {
            if (!player?.alive) return;
            
            const socket = this.io.sockets.sockets.get(socketId);
            if (!socket) {
                console.log('Socket not found for player:', socketId);
                return;
            }

            const visibleFood = this.game.food.filter(f =>
                Math.abs(f.x - player.segments[0].x) < gameConfig.VISIBLE_RADIUS &&
                Math.abs(f.y - player.segments[0].y) < gameConfig.VISIBLE_RADIUS
            );

            const visiblePlayers = {};
            Object.entries(this.game.players).forEach(([id, otherPlayer]) => {
                if (!otherPlayer?.alive || !otherPlayer.segments.length) return;
                
                const distance = Math.sqrt(
                    Math.pow(otherPlayer.segments[0].x - player.segments[0].x, 2) +
                    Math.pow(otherPlayer.segments[0].y - player.segments[0].y, 2)
                );

                if (distance < gameConfig.VISIBLE_RADIUS) {
                    visiblePlayers[id] = {
                        id: otherPlayer.id,
                        username: otherPlayer.username,
                        color: otherPlayer.color,
                        segments: otherPlayer.segments.map(seg => ({
                            x: Math.round(seg.x),
                            y: Math.round(seg.y)
                        })),
                        score: otherPlayer.score,
                        highScore: otherPlayer.highScore,
                        powerups: otherPlayer.powerups,
                        alive: otherPlayer.alive
                    };
                }
            });

            socket.emit('stateUpdate', {
                players: visiblePlayers,
                allPlayers: Object.fromEntries(
                    Object.entries(this.game.players)
                        .filter(([_, p]) => p?.alive)
                        .map(([id, p]) => [id, {
                            id: p.id,
                            username: p.username,
                            score: p.score,
                            highScore: p.highScore,
                            alive: p.alive
                        }])
                ),
                food: visibleFood.map(f => ({
                    x: Math.round(f.x),
                    y: Math.round(f.y),
                    color: f.color,
                    type: f.type
                }))
            });
        });
    }
}

module.exports = SocketHandler;