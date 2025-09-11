import React from 'react';
import { useRoomState, useServerState } from '../../stores';

interface RoomInfoProps {
  className?: string;
}

export const RoomInfo: React.FC<RoomInfoProps> = ({ className = '' }) => {
  const { currentRoom, roomPlayerCount } = useRoomState();
  const { serverInfo } = useServerState();

  return (
    <div className={`bg-gray-800 bg-opacity-90 rounded-lg p-4 ${className}`}>
      <h3 className="text-white font-semibold mb-3">Room Info</h3>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-sm">Current Room:</span>
          <span className="text-white text-sm font-medium">
            {currentRoom || 'None'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-sm">Players in Room:</span>
          <span className="text-white text-sm font-medium">
            {roomPlayerCount}
          </span>
        </div>

        {serverInfo && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Total Clients:</span>
              <span className="text-white text-sm font-medium">
                {serverInfo.connectedClients}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Active Rooms:</span>
              <span className="text-white text-sm font-medium">
                {serverInfo.activeRooms}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};