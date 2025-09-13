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
  const hasInitializedRef = useRef(false);
  const [isGameReady, setIsGameReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('GameView: Current state -', { isGameReady, isConnecting, error });

  // Initialize game on component mount
  useEffect(() => {
    // Prevent re-initialization
    if (hasInitializedRef.current) {
      console.log('GameView: Game already initialized, skipping...');
      return;
    }

    console.log('GameView: Initializing game...');
    hasInitializedRef.current = true;

    const initializeGame = async () => {
      console.log('GameView: initializeGame called');
      console.log('GameView: gameRef.current =', gameRef.current);
      console.log('GameView: phaserGameRef.current =', phaserGameRef.current);
      
      try {
        // Small delay to allow React dev mode double-invocation to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Connect to socket first with authentication
        setIsConnecting(true);
        console.log('GameView: Starting socket connection...');
        
        // Check if already connected, if not connect
        if (!socketService.isConnected()) {
            console.log("GameView: Socket not connected, initiating connection...");
          await socketService.connect();
        } else {
            console.log("GameView: Socket already connected");
        }
        console.log('GameView: Socket connected successfully');        // Configure Phaser game
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
        console.log('GameView: Creating Phaser game...');
        phaserGameRef.current = new Phaser.Game(config);
        console.log('GameView: Phaser game created, waiting for initialization...');

        // Wait for the game to be ready before accessing scenes
        phaserGameRef.current.events.once('ready', () => {
          console.log('GameView: Phaser game is ready');
          // Game is now ready - scenes have been created and initialized
          console.log('GameView: Game initialization complete');
          setIsGameReady(true);
          setIsConnecting(false);
        });

      } catch (error) {
        console.error('Failed to initialize game:', error);
        setIsConnecting(false);
        setError(error instanceof Error ? error.message : 'Failed to initialize game');
      }
    };

    initializeGame();

    // Cleanup only on actual unmount
    return () => {
      // This only runs when component unmounts
    };
  }, []); // Empty dependency array - only run once on mount

  // Separate effect for socket cleanup on unmount
  useEffect(() => {
    return () => {
      // This only runs when component unmounts
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
      socketService.disconnect();
    };
  }, []); // Empty dependency array - only runs on mount/unmount

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

  console.log('GameView: Rendering main game view');
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Phaser Game Container - Always render so DOM is available */}
      <div 
        ref={gameRef} 
        className="absolute top-0 left-0 w-full h-full"
        style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      />
      
      {/* Loading Overlay */}
      {isConnecting && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center z-50">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Connecting to Game Server</h2>
            <p className="text-slate-300">Initializing your spaceship...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center z-50">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 text-center max-w-md">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
            <p className="text-slate-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      {/* React UI Overlay - Only show when game is ready */}
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