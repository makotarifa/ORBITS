import React from 'react';
import { useConnectionState } from '../../stores';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const { isConnected, connectionError } = useConnectionState();

  const getStatusColor = () => {
    if (connectionError) return 'text-red-500';
    if (isConnected) return 'text-green-500';
    return 'text-yellow-500';
  };

  const getStatusText = () => {
    if (connectionError) return 'Connection Error';
    if (isConnected) return 'Connected';
    return 'Connecting...';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {connectionError && (
        <span className="text-xs text-red-400 ml-2">
          {connectionError}
        </span>
      )}
    </div>
  );
};