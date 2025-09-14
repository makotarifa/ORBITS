import React from 'react';
import { useLatency } from '../../hooks/socket/useLatency';
import { GAME_CONSTANTS } from '../../constants/game.constants';

interface LatencyIndicatorProps {
  className?: string;
  showLabel?: boolean;
  showQualityIndicator?: boolean;
}

export const LatencyIndicator: React.FC<LatencyIndicatorProps> = ({ 
  className = '',
  showLabel = true,
  showQualityIndicator = true,
}) => {
  const { latency, averageLatency, getLatencyQuality } = useLatency();
  
  const displayLatency = averageLatency ?? latency;
  const quality = getLatencyQuality();
  
  const getLatencyColor = () => {
    switch (quality) {
      case 'good':
        return 'text-green-500';
      case 'okay':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      case 'unknown':
      default:
        return 'text-gray-400';
    }
  };

  const getQualityIndicatorColor = () => {
    switch (quality) {
      case 'good':
        return 'bg-green-500';
      case 'okay':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      case 'unknown':
      default:
        return 'bg-gray-400';
    }
  };

  const getLatencyText = () => {
    if (displayLatency === null) {
      return GAME_CONSTANTS.UI.LABELS.LATENCY_UNKNOWN;
    }
    
    return `${Math.round(displayLatency)}${GAME_CONSTANTS.UI.LABELS.LATENCY_MS}`;
  };

  const getQualityBars = () => {
    const bars = [];
    const totalBars = 3;
    
    let activeBars = 0;
    switch (quality) {
      case 'good':
        activeBars = 3;
        break;
      case 'okay':
        activeBars = 2;
        break;
      case 'poor':
        activeBars = 1;
        break;
      case 'unknown':
      default:
        activeBars = 0;
        break;
    }
    
    for (let i = 0; i < totalBars; i++) {
      const isActive = i < activeBars;
      const barColor = isActive ? getQualityIndicatorColor() : 'bg-gray-600';
      
      bars.push(
        <div
          key={i}
          className={`w-1 h-3 ${barColor} rounded-sm transition-colors duration-200`}
        />
      );
    }
    
    return bars;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showQualityIndicator && (
        <div className="flex items-center space-x-0.5">
          {getQualityBars()}
        </div>
      )}
      
      {showLabel && (
        <span className="text-sm text-gray-300">
          {GAME_CONSTANTS.UI.LABELS.LATENCY}
        </span>
      )}
      
      <span className={`text-sm font-medium ${getLatencyColor()}`}>
        {getLatencyText()}
      </span>
    </div>
  );
};