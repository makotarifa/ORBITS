import React, { useState } from 'react';
import { useConnectionState } from '../../stores';
import { useSocket } from '../../hooks/socket/useSocket';
import { SocketErrorType, SocketErrorSeverity } from '../../types/socket-errors.types';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
  showRecoveryActions?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className = '',
  showDetails = false,
  showRecoveryActions = false
}) => {
  const { isConnected, connectionError } = useConnectionState();
  const { 
    isConnecting, 
    errorDetails, 
    connectionHealth, 
    canRetry, 
    retryIn, 
    forceReconnect, 
    clearError,
    reconnect 
  } = useSocket();
  
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const getStatusColor = (): string => {
    if (errorDetails) {
      switch (errorDetails.severity) {
        case SocketErrorSeverity.CRITICAL:
          return 'text-red-600';
        case SocketErrorSeverity.HIGH:
          return 'text-red-500';
        case SocketErrorSeverity.MEDIUM:
          return 'text-yellow-500';
        case SocketErrorSeverity.LOW:
          return 'text-yellow-400';
        default:
          return 'text-red-500';
      }
    }
    if (isConnected) return 'text-green-500';
    if (isConnecting) return 'text-blue-500';
    return 'text-yellow-500';
  };

  const getBadgeColor = (): string => {
    if (errorDetails) {
      switch (errorDetails.severity) {
        case SocketErrorSeverity.CRITICAL:
          return 'bg-red-600';
        case SocketErrorSeverity.HIGH:
          return 'bg-red-500';
        case SocketErrorSeverity.MEDIUM:
          return 'bg-yellow-500';
        case SocketErrorSeverity.LOW:
          return 'bg-yellow-400';
        default:
          return 'bg-red-500';
      }
    }
    if (isConnected) return 'bg-green-500';
    if (isConnecting) return 'bg-blue-500 animate-pulse';
    return 'bg-yellow-500 animate-pulse';
  };

  const getStatusText = (): string => {
    if (errorDetails) return errorDetails.userMessage;
    if (isConnected) return 'Connected';
    if (isConnecting) return 'Connecting...';
    return 'Disconnected';
  };

  const getSeverityIcon = () => {
    if (!errorDetails) return null;
    
    switch (errorDetails.severity) {
      case SocketErrorSeverity.CRITICAL:
        return '🔴';
      case SocketErrorSeverity.HIGH:
        return '🟠';
      case SocketErrorSeverity.MEDIUM:
        return '🟡';
      case SocketErrorSeverity.LOW:
        return '🟢';
      default:
        return '⚠️';
    }
  };

  const handleRecoveryAction = async (action: string) => {
    setIsRecovering(true);
    try {
      switch (action.toLowerCase()) {
        case 'retry':
        case 'try again':
          await reconnect();
          break;
        case 'force reconnect':
          await forceReconnect();
          break;
        case 'clear error':
          clearError();
          break;
        default:
          // For other actions, just clear the error and let user handle it
          clearError();
      }
    } catch (error) {
      console.error('Recovery action failed:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className={`${className}`}>
      {/* Main status indicator */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${getBadgeColor()}`} />
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        
        {/* Severity indicator */}
        {errorDetails && (
          <span className="text-xs" title={`Severity: ${errorDetails.severity}`}>
            {getSeverityIcon()}
          </span>
        )}
        
        {/* Retry countdown */}
        {canRetry && retryIn > 0 && (
          <span className="text-xs text-gray-400">
            (retry in {retryIn}s)
          </span>
        )}

        {/* Details toggle */}
        {(showDetails || errorDetails) && (
          <button
            onClick={() => setShowDetailedInfo(!showDetailedInfo)}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            {showDetailedInfo ? 'Hide' : 'Details'}
          </button>
        )}
      </div>

      {/* Detailed error information */}
      {showDetailedInfo && (
        <div className="mt-2 p-3 bg-gray-800 rounded-lg text-xs space-y-2">
          {errorDetails && (
            <>
              <div>
                <span className="text-gray-400">Type:</span>{' '}
                <span className="text-white">{errorDetails.type}</span>
              </div>
              <div>
                <span className="text-gray-400">Category:</span>{' '}
                <span className="text-white">{errorDetails.category}</span>
              </div>
              {errorDetails.technicalMessage && (
                <div>
                  <span className="text-gray-400">Technical:</span>{' '}
                  <span className="text-gray-300 font-mono text-xs">
                    {errorDetails.technicalMessage}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-400">Time:</span>{' '}
                <span className="text-white">
                  {new Date(errorDetails.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </>
          )}

          {/* Connection health information */}
          {!connectionHealth.isHealthy && (
            <div className="border-t border-gray-700 pt-2">
              <div className="text-gray-400 mb-1">Issues:</div>
              {connectionHealth.issues.map((issue, index) => (
                <div key={index} className="text-red-400 text-xs">
                  • {issue}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recovery actions */}
      {(showRecoveryActions || (errorDetails && canRetry)) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {errorDetails?.recoveryActions.slice(0, 3).map((action, index) => (
            <button
              key={index}
              onClick={() => handleRecoveryAction(action)}
              disabled={isRecovering}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
            >
              {isRecovering ? 'Working...' : action}
            </button>
          ))}
          
          {canRetry && retryIn === 0 && !errorDetails?.recoveryActions.some(a => 
            a.toLowerCase().includes('retry') || a.toLowerCase().includes('try again')
          ) && (
            <button
              onClick={() => handleRecoveryAction('retry')}
              disabled={isRecovering}
              className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-colors"
            >
              {isRecovering ? 'Retrying...' : 'Retry'}
            </button>
          )}
        </div>
      )}

      {/* Legacy error display for backward compatibility */}
      {connectionError?.trim() && !errorDetails && (
        <div className="text-xs text-red-400 mt-1">
          {connectionError}
        </div>
      )}
    </div>
  );
};