# Crazy Snake Game 🐍

A modern multiplayer snake game built with Node.js and Phaser 3, featuring real-time gameplay and unique mechanics.

## Features 🎮

- **Multiplayer Gameplay**: Play with multiple players in real-time
- **Modern Graphics**: Smooth animations and visual effects
- **Dynamic Food System**: 
  - Different types of food with varying effects
  - Speed boost powerups
  - When a snake dies, its segments turn into food
- **Interactive UI**:
  - Real-time scoreboard showing top 5 players
  - Minimap for better navigation
  - Score and high score tracking
- **Smooth Controls**: Responsive keyboard controls (WASD/Arrow Keys)

## Getting Started 🚀

### Prerequisites

- Node.js (v20 or higher)
- npm (comes with Node.js)
- Docker (optional, for containerized deployment)

### Installation

#### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yazilimacademy/cilgin-yilan-js
cd cilgin-yilan-js
```

2. Install and build server:
```bash
cd server
npm install
npm run build
```

3. Install and build client:
```bash
cd ../client
npm install
npm run build
```

4. Start the server:
```bash
cd ../server
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3001
```

#### Docker Deployment

1. Build the Docker image:
```bash
docker build -t yilan -f Dockerfile .
```

2. Run the container:
```bash
docker run -p 3001:3001 yilan
```

3. Access the game at:
```
http://localhost:3001
```

## How to Play 🎯

1. Enter your username when prompted
2. Use WASD or Arrow keys to control your snake
3. Collect food to grow:
   - Red food: Regular growth
   - Yellow food: Extra points
   - Green food: Speed boost
4. Avoid colliding with other players
5. When a snake is defeated, its body turns into food for other players

## Game Mechanics 🎲

- **Growth System**: Each food item increases your snake's length
- **Speed Mechanics**: 
  - Snake speed decreases slightly as you grow longer
  - Green food provides temporary speed boosts
- **Scoring System**:
  - Regular food: 10 points
  - Super food: 25 points
  - Speed boost food: 15 points
- **Minimap**: Shows your position and visible range in the arena

## Technical Details 🔧

- **Frontend**: 
  - TypeScript for type safety
  - Phaser 3 for game rendering
  - Socket.io-client for real-time communication
  - Vite for fast development and optimized builds
- **Backend**:
  - Node.js with TypeScript
  - Express.js for serving static files
  - Socket.io for multiplayer support
- **Game Logic**:
  - Collision detection
  - Food spawning system
  - Player state management
- **Deployment**:
  - Docker support for easy deployment
  - Multi-stage builds for optimized container size

## Contributing 🤝

Contributions are welcome! Feel free to submit issues and pull requests.

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments 👏

- Phaser.js team for the amazing game framework
- Socket.io team for real-time capabilities
- All contributors who helped improve the game