import { Server, Socket } from 'socket.io';
import Game from '../game/Game';
import gameConfig from '../config/gameConfig';

export default class SocketHandler {
  private io: Server;
  private game: Game;

  constructor(io: Server, game: Game) {
    this.io = io;
    this.game = game;
    this.setupSocketHandlers();
    this.setupGameLoop();
    console.log('SocketHandler initialized');
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('New client connected:', socket.id);
      
      this.game.addPlayer(socket.id);

      socket.on('join', (username: string) => {
        console.log('Join request from:', socket.id, 'username:', username);
        this.handleJoin(socket, username);
      });
      
      socket.on('changeDirection', (dir: { dx: number; dy: number }) => {
        this.handleDirectionChange(socket, dir);
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoin(socket: Socket, username: string): void {
    console.log('Processing join for:', socket.id);
    
    const players = this.game.getPlayers();
    const player = players[socket.id];
    if (player) {
      player.username = username || 'Player';
      
      console.log('Sending initial data to:', socket.id);
      
      socket.emit('yourId', socket.id);
      socket.emit('welcome', `Hello ${username}, welcome to the Snake arena!`);
      socket.emit('gameConfig', {
        arenaWidth: gameConfig.ARENA_WIDTH,
        arenaHeight: gameConfig.ARENA_HEIGHT,
        visibleRadius: gameConfig.VISIBLE_RADIUS
      });

      const head = player.segments[0];
      const visibleFood = this.game.getFood().filter(f =>
        Math.abs(f.x - head.x) < gameConfig.VISIBLE_RADIUS &&
        Math.abs(f.y - head.y) < gameConfig.VISIBLE_RADIUS
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
          Object.entries(players)
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

  private handleDirectionChange(socket: Socket, dir: { dx: number; dy: number }): void {
    const players = this.game.getPlayers();
    const player = players[socket.id];
    if (player && player.alive && player.segments.length > 0) {
      player.dirX = dir.dx;
      player.dirY = dir.dy;
    }
  }

  private handleDisconnect(socket: Socket): void {
    this.game.removePlayer(socket.id);
  }

  private setupGameLoop(): void {
    console.log('Setting up game loop');
    
    setInterval(() => {
      this.game.update();
    }, 1000 / gameConfig.UPDATE_RATE);

    setInterval(() => {
      this.broadcastGameState();
    }, 1000 / gameConfig.BROADCAST_RATE);
  }

  private broadcastGameState(): void {
    const players = this.game.getPlayers();
    const food = this.game.getFood();

    Object.entries(players).forEach(([socketId, player]) => {
      if (!player?.alive) return;
      
      const socket = this.io.sockets.sockets.get(socketId);
      if (!socket) {
        console.log('Socket not found for player:', socketId);
        return;
      }

      const head = player.segments[0];
      const visibleFood = food.filter(f =>
        Math.abs(f.x - head.x) < gameConfig.VISIBLE_RADIUS &&
        Math.abs(f.y - head.y) < gameConfig.VISIBLE_RADIUS
      );

      const visiblePlayers: { [key: string]: any } = {};
      Object.entries(players).forEach(([id, otherPlayer]) => {
        if (!otherPlayer?.alive || !otherPlayer.segments.length) return;
        
        const distance = Math.sqrt(
          Math.pow(otherPlayer.segments[0].x - head.x, 2) +
          Math.pow(otherPlayer.segments[0].y - head.y, 2)
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
          Object.entries(players)
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
