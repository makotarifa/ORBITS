import React from 'react';
import { ConnectionStatus } from './ConnectionStatus';
import { PlayerList } from './PlayerList';
import { RoomInfo } from './RoomInfo';
import { GameControls } from './GameControls';

interface GameUIProps {
  className?: string;
}

export const GameUI: React.FC<GameUIProps> = ({ className = '' }) => {
  return (
    <div className={`absolute top-4 left-4 z-10 space-y-4 ${className}`}>
      {/* Connection Status - Top Left */}
      <ConnectionStatus />

      {/* Game Controls - Top Left, below connection status */}
      <GameControls className="w-80" />

      {/* Room Info - Top Right */}
      <div className="absolute top-4 right-4">
        <RoomInfo className="w-80" />
      </div>

      {/* Player List - Bottom Left */}
      <div className="absolute bottom-4 left-4">
        <PlayerList className="w-80" />
      </div>

      {/* Instructions - Bottom Right */}
      <div className="absolute bottom-4 right-4">
        <div className="bg-gray-800 bg-opacity-90 rounded-lg p-4 w-80">
          <h3 className="text-white font-semibold mb-2">Instructions</h3>
          <div className="text-gray-300 text-sm space-y-1">
            <div>• Use WASD or Arrow Keys to move</div>
            <div>• Camera automatically follows you</div>
            <div>• Join rooms to play with others</div>
            <div>• See real-time player positions</div>
          </div>
        </div>
      </div>
    </div>
  );
};