import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../../game/scenes/GameScene';
import { GameUI } from './GameUI';
import { socketService } from '../../services/socket/socket.service';
import { GAME_CONSTANTS } from '../../constants/game.constants';

interface GameViewProps {
  onLogout: () => void;
}

export const GameView: React.FC<GameViewProps> = ({ onLogout }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const [isGameReady, setIsGameReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const initializeGame = async () => {
      if (!gameRef.current || phaserGameRef.current) return;

      try {
        // Connect to socket first with authentication
        setIsConnecting(true);
        await socketService.connectWithAuth();
        
        // Configure Phaser game
        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          width: GAME_CONSTANTS.DEFAULTS.GAME_WORLD.WIDTH,
          height: GAME_CONSTANTS.DEFAULTS.GAME_WORLD.HEIGHT,
          parent: gameRef.current,
          backgroundColor: 0x2c3e50,
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { x: 0, y: 0 },
              debug: false,
            },
          },
          scene: [GameScene],
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: GAME_CONSTANTS.DEFAULTS.GAME_WORLD.WIDTH,
            height: GAME_CONSTANTS.DEFAULTS.GAME_WORLD.HEIGHT,
          },
        };

        // Create the Phaser game
        phaserGameRef.current = new Phaser.Game(config);
        
        // Wait a bit for the game to initialize
        setTimeout(() => {
          setIsGameReady(true);
          setIsConnecting(false);
        }, 1000);

      } catch (error) {
        console.error('Failed to initialize game:', error);
        setIsConnecting(false);
        // Could show error state here
      }
    };

    initializeGame();

    // Cleanup on unmount
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
      socketService.disconnect();
    };
  }, []);

  const handleLogout = () => {
    // Clean up socket connection
    socketService.disconnect();
    
    // Clean up Phaser game
    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true);
      phaserGameRef.current = null;
    }
    
    // Call parent logout handler
    onLogout();
  };

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Connecting to Game Server</h2>
          <p className="text-slate-300">Initializing your spaceship...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Phaser Game Container */}
      <div 
        ref={gameRef} 
        className="absolute top-0 left-0 w-full h-full"
        style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      />
      
      {/* React UI Overlay */}
      {isGameReady && (
        <>
          <GameUI className="z-10" />
          
          {/* Logout Button - Top Right */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg 
                         transition-colors duration-200 shadow-lg border border-red-500"
            >
              Logout
            </button>
          </div>

          {/* Welcome Message - Top Center */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-blue-600/90 backdrop-blur-sm rounded-lg px-6 py-2 text-center">
              <p className="text-white font-medium">
                Welcome, Pilot! Use <kbd className="bg-slate-700 px-2 py-1 rounded text-xs">WASD</kbd> or arrow keys to move
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};