import React, { useState } from 'react';

interface LoginOverlayProps {
  onJoin: (username: string) => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({ onJoin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(username.trim() || 'Player');
  };

  return (
    <div className="overlay">
      <form onSubmit={handleSubmit} className="username-form">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          maxLength={11}
          className="username-input"
        />
        <button type="submit" className="join-btn">
          Join
        </button>
      </form>
    </div>
  );
};
