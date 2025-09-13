import React from 'react';
import { ConnectionStatus } from './ConnectionStatus';
import { PlayerList } from './PlayerList';
import { RoomInfo } from './RoomInfo';
import { GameControls } from './GameControls';
import { GAME_CONSTANTS } from '../../constants/game.constants';

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
          <h3 className="text-white font-semibold mb-2">{GAME_CONSTANTS.UI.LABELS.INSTRUCTIONS}</h3>
          <div className="text-gray-300 text-sm space-y-1">
            <div>• {GAME_CONSTANTS.UI.INSTRUCTIONS.MOVE_KEYS}</div>
            <div>• {GAME_CONSTANTS.UI.INSTRUCTIONS.CAMERA_FOLLOW}</div>
            <div>• {GAME_CONSTANTS.UI.INSTRUCTIONS.JOIN_ROOMS}</div>
            <div>• {GAME_CONSTANTS.UI.INSTRUCTIONS.REAL_TIME_POSITIONS}</div>
          </div>
        </div>
      </div>
    </div>
  );
};