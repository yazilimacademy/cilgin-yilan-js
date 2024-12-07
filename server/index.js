const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 3001;

app.use(express.static(path.join(__dirname, '..', 'public')));

const server = http.createServer(app);
const io = new Server(server);

// Constants
const ARENA_WIDTH = 5000;
const ARENA_HEIGHT = 5000;
const FOOD_COUNT = 1000;
const SNAKE_SPEED = 2;
const RESPAWN_DELAY = 3000; 
const UPDATE_RATE = 60; 
const BROADCAST_RATE = 40; 
const VISIBLE_RADIUS = 2000; 

const PLAYER_COLORS = [
  '#e6194b', '#3cb44b', '#ffe119', '#0082c8',
  '#f58231', '#911eb4', '#46f0f0', '#f032e6',
  '#d2f53c', '#fabebe', '#008080', '#e6beff',
  '#aa6e28', '#fffac8', '#800000', '#aaffc3',
  '#808000', '#ffd8b1', '#000080', '#808080'
];

function getRandomColor() {
  return PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
}

// Game state
const players = {};
let food = [];

function initFood() {
  food = [];
  for (let i = 0; i < FOOD_COUNT; i++) {
    food.push({
      x: Math.random() * ARENA_WIDTH,
      y: Math.random() * ARENA_HEIGHT
    });
  }
}
initFood();

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Initially, create a player record without username until 'join' is received
  players[socket.id] = createNewPlayer();

  // Wait for the client to send their username
  socket.on('join', (username) => {
    const player = players[socket.id];
    if (player) {
      player.username = username || 'Player';
      socket.emit('yourId', socket.id);
      socket.emit('welcome', `Hello ${username}, welcome to the Snake arena!`);
    }
  });

  socket.on('changeDirection', (dir) => {
    const player = players[socket.id];
    if (player && player.alive && player.segments.length > 0) {
      player.dirX = dir.dx;
      player.dirY = dir.dy;
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    delete players[socket.id];
  });
});

function createNewPlayer() {
  return {
    username: null, // Will be set when 'join' event is received
    color: getRandomColor(),
    dirX: 1,
    dirY: 0,
    speed: SNAKE_SPEED,
    segments: [{
      x: 5000,
      y: 5000
    }],
    pendingGrowth: 0,
    alive: true,
    respawnTime: 0
  };
}

// Update game state at 60 ticks/sec
setInterval(() => {
  updateGameState();
}, 1000 / UPDATE_RATE);

// Broadcast to clients at 20 times/sec, with per-client culling
setInterval(() => {
  for (const [id, player] of Object.entries(players)) {
    if (!player.alive || player.segments.length === 0) {
      io.to(id).emit('stateUpdate', { players, food: [] });
      continue;
    }

    const playerHead = player.segments[0];
    const visibleFood = food.filter(f =>
      Math.abs(f.x - playerHead.x) < VISIBLE_RADIUS &&
      Math.abs(f.y - playerHead.y) < VISIBLE_RADIUS
    );

    io.to(id).emit('stateUpdate', { players, food: visibleFood });
  }
}, 1000 / BROADCAST_RATE);

function updateGameState() {
  const now = Date.now();
  for (const id in players) {
    const player = players[id];
    if (!player.alive && now > player.respawnTime) {
      respawnPlayer(player);
    }
    if (player.alive && player.segments.length > 0) {
      moveSnake(player);
      checkFoodCollision(player);
    }
  }
  checkCollisions();
}

function moveSnake(player) {
  const head = player.segments[0];
  const newHead = {
    x: (head.x + player.dirX * player.speed + ARENA_WIDTH) % ARENA_WIDTH,
    y: (head.y + player.dirY * player.speed + ARENA_HEIGHT) % ARENA_HEIGHT
  };

  player.segments.unshift(newHead);

  if (player.pendingGrowth > 0) {
    player.pendingGrowth--;
  } else {
    player.segments.pop();
  }
}

function checkFoodCollision(player) {
  const head = player.segments[0];
  for (let i = 0; i < food.length; i++) {
    const f = food[i];
    const dist = Math.hypot(f.x - head.x, f.y - head.y);
    if (dist < 10) {
      player.pendingGrowth += 1;
      food[i] = {
        x: Math.random() * ARENA_WIDTH,
        y: Math.random() * ARENA_HEIGHT
      };
      break;
    }
  }
}

function checkCollisions() {
  const alivePlayers = Object.entries(players).filter(([id, p]) => p.alive && p.segments.length > 0);
  for (let i = 0; i < alivePlayers.length; i++) {
    const [idA, pA] = alivePlayers[i];
    const headA = pA.segments[0];
    for (let j = 0; j < alivePlayers.length; j++) {
      if (i === j) continue;
      const [idB, pB] = alivePlayers[j];
      for (let s = 0; s < pB.segments.length; s++) {
        const segB = pB.segments[s];
        const dist = Math.hypot(segB.x - headA.x, segB.y - headA.y);
        if (dist < 20) {
          eliminatePlayer(pA);
          break;
        }
      }
    }
  }
}

function eliminatePlayer(player) {
  player.alive = false;
  player.segments = [];
  player.respawnTime = Date.now() + RESPAWN_DELAY;
}

function respawnPlayer(player) {
  player.alive = true;
  player.dirX = 1;
  player.dirY = 0;
  player.pendingGrowth = 0;
  player.segments = [{
    x: 5000,
    y: 5000
  }];
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
