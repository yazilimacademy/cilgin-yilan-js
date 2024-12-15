import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import Game from './game/Game';
import SocketHandler from './socket/SocketHandler';

const app = express();
const PORT = 3001;

// Serve static files from the public directory
const publicPath = path.join(__dirname, '../public');
console.log('Serving static files from:', publicPath);
app.use(express.static(publicPath));

// Serve index.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

const server = createServer(app);
const io = new Server(server);

const game = new Game();
new SocketHandler(io, game);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
