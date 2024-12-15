import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Phaser from 'phaser';
import { LoginOverlay } from '@/components/LoginOverlay';
import { GameScene } from '@/game/GameScene';

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.scale.resize(window.innerWidth, window.innerHeight);
        const scene = gameInstanceRef.current.scene.getScene('GameScene') as GameScene;
        if (scene) {
          scene.handleResize();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleJoin = (username: string) => {
    if (!socket || !gameRef.current) return;

    const socketInstance = socket;

    class CustomGameScene extends GameScene {
      create() {
        super.create();
        this.setupSocket(socketInstance);
        socketInstance.emit('join', username);
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#000000',
      scene: CustomGameScene
    };

    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy(true);
    }

    gameInstanceRef.current = new Phaser.Game(config);
    setIsLoggedIn(true);
  };

  return (
    <div ref={gameRef} style={{ width: '100vw', height: '100vh' }}>
      {!isLoggedIn && <LoginOverlay onJoin={handleJoin} />}
    </div>
  );
};

export default App;
