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

// Serve static files with proper MIME types
app.use(express.static(publicPath, {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Serve index.html for the root path and any other paths (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

const server = createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const game = new Game();
new SocketHandler(io, game);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
