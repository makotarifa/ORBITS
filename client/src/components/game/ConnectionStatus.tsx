import React from 'react';
import { useConnectionState } from '../../stores';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const { isConnected, isReconnecting, connectionError } = useConnectionState();

  const hasError = connectionError?.trim();

  const getStatusColor = () => {
    if (hasError) return 'text-red-500';
    if (isConnected) return 'text-green-500';
    if (isReconnecting) return 'text-orange-500';
    return 'text-yellow-500';
  };

  const getStatusText = () => {
    if (hasError) return 'Connection Error';
    if (isConnected) return 'Connected';
    if (isReconnecting) return 'Reconnecting...';
    return 'Connecting...';
  };

  const getIndicatorColor = () => {
    if (hasError) return 'bg-red-500';
    if (isConnected) return 'bg-green-500';
    if (isReconnecting) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const getIndicatorAnimation = () => {
    if (isReconnecting) return 'animate-pulse';
    if (!isConnected && !hasError) return 'animate-pulse';
    return '';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-3 h-3 rounded-full ${getIndicatorColor()} ${getIndicatorAnimation()}`} />
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {hasError && (
        <span className="text-xs text-red-400 ml-2">
          {connectionError}
        </span>
      )}
    </div>
  );
};