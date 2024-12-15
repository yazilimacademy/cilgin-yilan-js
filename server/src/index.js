const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const Game = require('./game/Game');
const SocketHandler = require('./socket/socketHandler');

const app = express();
const PORT = 3001;

app.use(express.static(path.join(__dirname, '..', '..', 'public')));

const server = http.createServer(app);
const io = new Server(server);

const game = new Game();
new SocketHandler(io, game);

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});