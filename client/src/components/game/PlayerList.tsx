import React from 'react';
import { useRoomState, useLocalPlayerState } from '../../stores';

interface PlayerListProps {
  className?: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({ className = '' }) => {
  const { roomPlayers, roomPlayerCount } = useRoomState();
  const { localPlayerId } = useLocalPlayerState();

  const players = Array.from(roomPlayers.entries());

  return (
    <div className={`bg-gray-800 bg-opacity-90 rounded-lg p-4 ${className}`}>
      <h3 className="text-white font-semibold mb-3">
        Players ({roomPlayerCount})
      </h3>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {players.length === 0 ? (
          <div className="text-gray-400 text-sm">
            No players in room
          </div>
        ) : (
          players.map(([playerId, playerState]) => (
            <div
              key={playerId}
              className={`flex items-center justify-between p-2 rounded ${
                playerId === localPlayerId
                  ? 'bg-blue-600 bg-opacity-50'
                  : 'bg-gray-700 bg-opacity-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  playerId === localPlayerId ? 'bg-blue-400' : 'bg-green-400'
                }`} />
                <span className="text-white text-sm font-medium">
                  {playerId === localPlayerId ? 'You' : playerId.slice(0, 8)}
                </span>
              </div>

              <div className="text-xs text-gray-300">
                ({Math.round(playerState.position.x)}, {Math.round(playerState.position.y)})
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};