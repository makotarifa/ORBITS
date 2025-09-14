import React, { useState } from 'react';
import { SocketErrorDetails, SocketErrorSeverity, SocketErrorClassifier } from '../../types/socket-errors.types';

interface ErrorRecoveryPanelProps {
  error: SocketErrorDetails;
  onRecoveryAction: (action: string) => Promise<void>;
  className?: string;
}

export const ErrorRecoveryPanel: React.FC<ErrorRecoveryPanelProps> = ({
  error,
  onRecoveryAction,
  className = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const recoveryStrategy = SocketErrorClassifier.getRecoveryStrategy(error);

  const handleAction = async (action: string) => {
    setIsProcessing(true);
    setProcessingAction(action);
    try {
      await onRecoveryAction(action);
    } catch (err) {
      console.error('Recovery action failed:', err);
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  const getSeverityColor = () => {
    switch (error.severity) {
      case SocketErrorSeverity.CRITICAL:
        return 'border-red-600 bg-red-50';
      case SocketErrorSeverity.HIGH:
        return 'border-red-500 bg-red-50';
      case SocketErrorSeverity.MEDIUM:
        return 'border-yellow-500 bg-yellow-50';
      case SocketErrorSeverity.LOW:
        return 'border-yellow-400 bg-yellow-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getSeverityIcon = () => {
    switch (error.severity) {
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

  const getActionButtonStyle = (priority: 'immediate' | 'shortTerm' | 'longTerm' | 'fallback') => {
    switch (priority) {
      case 'immediate':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'shortTerm':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'longTerm':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'fallback':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const ActionButton: React.FC<{ 
    action: string; 
    priority: 'immediate' | 'shortTerm' | 'longTerm' | 'fallback';
    description?: string;
  }> = ({ action, priority, description }) => (
    <button
      onClick={() => handleAction(action)}
      disabled={isProcessing}
      className={`
        px-3 py-2 text-sm font-medium rounded-md transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${getActionButtonStyle(priority)}
        ${isProcessing && processingAction === action ? 'animate-pulse' : ''}
      `}
      title={description}
    >
      {isProcessing && processingAction === action ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Working...
        </span>
      ) : (
        action
      )}
    </button>
  );

  return (
    <div className={`border-2 rounded-lg p-4 ${getSeverityColor()} ${className}`}>
      {/* Error Header */}
      <div className="flex items-start space-x-3 mb-4">
        <span className="text-lg" title={`Severity: ${error.severity}`}>
          {getSeverityIcon()}
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">
            Connection Error
          </h3>
          <p className="text-gray-700 mt-1">
            {error.userMessage}
          </p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <span>Type: {error.type}</span>
            <span>•</span>
            <span>Category: {error.category}</span>
            <span>•</span>
            <span>Time: {new Date(error.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Recovery Actions */}
      <div className="space-y-3">
        {/* Immediate Actions */}
        {recoveryStrategy.immediate.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Try Now:
            </h4>
            <div className="flex flex-wrap gap-2">
              {recoveryStrategy.immediate.map((action, index) => (
                <ActionButton
                  key={`immediate-${index}`}
                  action={action}
                  priority="immediate"
                  description="Quick actions you can try immediately"
                />
              ))}
            </div>
          </div>
        )}

        {/* Short-term Actions */}
        {recoveryStrategy.shortTerm.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              If Problem Persists:
            </h4>
            <div className="flex flex-wrap gap-2">
              {recoveryStrategy.shortTerm.map((action, index) => (
                <ActionButton
                  key={`shortterm-${index}`}
                  action={action}
                  priority="shortTerm"
                  description="Actions for persistent issues"
                />
              ))}
            </div>
          </div>
        )}

        {/* Long-term Actions */}
        {recoveryStrategy.longTerm.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              For Ongoing Issues:
            </h4>
            <div className="flex flex-wrap gap-2">
              {recoveryStrategy.longTerm.map((action, index) => (
                <ActionButton
                  key={`longterm-${index}`}
                  action={action}
                  priority="longTerm"
                  description="Actions for long-term resolution"
                />
              ))}
            </div>
          </div>
        )}

        {/* Fallback Actions */}
        {recoveryStrategy.fallback.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Last Resort:
            </h4>
            <div className="flex flex-wrap gap-2">
              {recoveryStrategy.fallback.map((action, index) => (
                <ActionButton
                  key={`fallback-${index}`}
                  action={action}
                  priority="fallback"
                  description="Final troubleshooting steps"
                />
              ))}
            </div>
          </div>
        )}

        {/* Retry Information */}
        {error.canRetry && error.retryDelay && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                <p className="text-blue-800 font-medium">
                  Automatic retry available
                </p>
                <p className="text-blue-700">
                  The system will automatically retry in {Math.ceil((error.retryDelay || 0) / 1000)} seconds.
                  You can also try the actions above for faster resolution.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};