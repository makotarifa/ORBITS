import React, { useState } from 'react';
import { usePlayer } from '../../hooks/socket';
import { GAME_CONSTANTS } from '../../constants/game.constants';

interface GameControlsProps {
  className?: string;
}

export const GameControls: React.FC<GameControlsProps> = ({ className = '' }) => {
  const [roomId, setRoomId] = useState<string>(GAME_CONSTANTS.DEFAULTS.ROOM_ID);
  const { joinRoom, leaveRoom, isInRoom, currentRoom } = usePlayer();

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      joinRoom(roomId.trim());
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  return (
    <div className={`bg-gray-800 bg-opacity-90 rounded-lg p-4 ${className}`}>
      <h3 className="text-white font-semibold mb-3">Game Controls</h3>

      <div className="space-y-3">
        <div>
          <label htmlFor="room-id" className="block text-gray-300 text-sm mb-1">
            Room ID
          </label>
          <input
            id="room-id"
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Enter room ID"
          />
        </div>

        <div className="flex space-x-2">
          {!isInRoom ? (
            <button
              onClick={handleJoinRoom}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
            >
              Join Room
            </button>
          ) : (
            <button
              onClick={handleLeaveRoom}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
            >
              Leave Room
            </button>
          )}
        </div>

        {isInRoom && currentRoom && (
          <div className="text-center">
            <span className="text-green-400 text-sm">
              Connected to: {currentRoom}
            </span>
          </div>
        )}

        <div className="text-xs text-gray-400 space-y-1">
          <div>Controls:</div>
          <div>• WASD or Arrow Keys: Move</div>
          <div>• Camera follows your player</div>
        </div>
      </div>
    </div>
  );
};