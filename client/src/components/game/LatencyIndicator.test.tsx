import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LatencyIndicator } from './LatencyIndicator';
import { useLatency } from '../../hooks/socket/useLatency';
import { GAME_CONSTANTS } from '../../constants/game.constants';

// Mock the useLatency hook
vi.mock('../../hooks/socket/useLatency');

const mockUseLatency = useLatency as any;

// Create mock return values for useLatency
const createMockLatencyData = (overrides = {}) => ({
  latency: null,
  averageLatency: null,
  isLatencyMeasuring: false,
  startLatencyMeasurement: vi.fn(),
  stopLatencyMeasurement: vi.fn(),
  getLatencyQuality: vi.fn().mockReturnValue('unknown'),
  ...overrides,
});

describe('LatencyIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with default props', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData());
      
      render(<LatencyIndicator />);
      
      expect(screen.getByText(GAME_CONSTANTS.UI.LABELS.LATENCY)).toBeInTheDocument();
      expect(screen.getByText(GAME_CONSTANTS.UI.LABELS.LATENCY_UNKNOWN)).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData());
      
      const { container } = render(<LatencyIndicator className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should hide label when showLabel is false', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData());
      
      render(<LatencyIndicator showLabel={false} />);
      
      expect(screen.queryByText(GAME_CONSTANTS.UI.LABELS.LATENCY)).not.toBeInTheDocument();
    });

    it('should hide quality indicator when showQualityIndicator is false', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData());
      
      const { container } = render(<LatencyIndicator showQualityIndicator={false} />);
      
      // Quality bars should not be present
      expect(container.querySelectorAll('div[class*="h-3"]')).toHaveLength(0);
    });
  });

  describe('latency display', () => {
    it('should display unknown when latency is null', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData({
        latency: null,
        averageLatency: null,
        getLatencyQuality: vi.fn().mockReturnValue('unknown'),
      }));
      
      render(<LatencyIndicator />);
      
      expect(screen.getByText(GAME_CONSTANTS.UI.LABELS.LATENCY_UNKNOWN)).toBeInTheDocument();
    });

    it('should display current latency when available', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData({
        latency: 45,
        averageLatency: null,
        getLatencyQuality: vi.fn().mockReturnValue('good'),
      }));
      
      render(<LatencyIndicator />);
      
      expect(screen.getByText(`45${GAME_CONSTANTS.UI.LABELS.LATENCY_MS}`)).toBeInTheDocument();
    });

    it('should display average latency when available (priority over current)', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData({
        latency: 45,
        averageLatency: 38,
        getLatencyQuality: vi.fn().mockReturnValue('good'),
      }));
      
      render(<LatencyIndicator />);
      
      expect(screen.getByText(`38${GAME_CONSTANTS.UI.LABELS.LATENCY_MS}`)).toBeInTheDocument();
    });

    it('should round latency to nearest integer', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData({
        latency: 45.7,
        averageLatency: null,
        getLatencyQuality: vi.fn().mockReturnValue('good'),
      }));
      
      render(<LatencyIndicator />);
      
      expect(screen.getByText(`46${GAME_CONSTANTS.UI.LABELS.LATENCY_MS}`)).toBeInTheDocument();
    });
  });

  describe('quality indicators', () => {
    it('should apply good quality styling', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData({
        latency: 30,
        getLatencyQuality: vi.fn().mockReturnValue('good'),
      }));
      
      render(<LatencyIndicator />);
      
      const latencyText = screen.getByText(`30${GAME_CONSTANTS.UI.LABELS.LATENCY_MS}`);
      expect(latencyText).toHaveClass('text-green-500');
    });

    it('should apply okay quality styling', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData({
        latency: 100,
        getLatencyQuality: vi.fn().mockReturnValue('okay'),
      }));
      
      render(<LatencyIndicator />);
      
      const latencyText = screen.getByText(`100${GAME_CONSTANTS.UI.LABELS.LATENCY_MS}`);
      expect(latencyText).toHaveClass('text-yellow-500');
    });

    it('should apply poor quality styling', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData({
        latency: 200,
        getLatencyQuality: vi.fn().mockReturnValue('poor'),
      }));
      
      render(<LatencyIndicator />);
      
      const latencyText = screen.getByText(`200${GAME_CONSTANTS.UI.LABELS.LATENCY_MS}`);
      expect(latencyText).toHaveClass('text-red-500');
    });

    it('should apply unknown quality styling', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData({
        latency: null,
        getLatencyQuality: vi.fn().mockReturnValue('unknown'),
      }));
      
      render(<LatencyIndicator />);
      
      const latencyText = screen.getByText(GAME_CONSTANTS.UI.LABELS.LATENCY_UNKNOWN);
      expect(latencyText).toHaveClass('text-gray-400');
    });
  });

  describe('quality bars', () => {
    it('should show 3 active bars for good quality', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData({
        latency: 30,
        getLatencyQuality: vi.fn().mockReturnValue('good'),
      }));
      
      const { container } = render(<LatencyIndicator />);
      
      const activeBars = container.querySelectorAll('.bg-green-500');
      const inactiveBars = container.querySelectorAll('.bg-gray-600');
      
      expect(activeBars).toHaveLength(3);
      expect(inactiveBars).toHaveLength(0);
    });

    it('should show 2 active bars for okay quality', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData({
        latency: 100,
        getLatencyQuality: vi.fn().mockReturnValue('okay'),
      }));
      
      const { container } = render(<LatencyIndicator />);
      
      const activeBars = container.querySelectorAll('.bg-yellow-500');
      const inactiveBars = container.querySelectorAll('.bg-gray-600');
      
      expect(activeBars).toHaveLength(2);
      expect(inactiveBars).toHaveLength(1);
    });

    it('should show 1 active bar for poor quality', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData({
        latency: 200,
        getLatencyQuality: vi.fn().mockReturnValue('poor'),
      }));
      
      const { container } = render(<LatencyIndicator />);
      
      const activeBars = container.querySelectorAll('.bg-red-500');
      const inactiveBars = container.querySelectorAll('.bg-gray-600');
      
      expect(activeBars).toHaveLength(1);
      expect(inactiveBars).toHaveLength(2);
    });

    it('should show 0 active bars for unknown quality', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData({
        latency: null,
        getLatencyQuality: vi.fn().mockReturnValue('unknown'),
      }));
      
      const { container } = render(<LatencyIndicator />);
      
      const activeBars = container.querySelectorAll('.bg-green-500, .bg-yellow-500, .bg-red-500');
      const inactiveBars = container.querySelectorAll('.bg-gray-600');
      
      expect(activeBars).toHaveLength(0);
      expect(inactiveBars).toHaveLength(3);
    });

    it('should always show 3 total bars', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData({
        getLatencyQuality: vi.fn().mockReturnValue('okay'),
      }));
      
      const { container } = render(<LatencyIndicator />);
      
      const allBars = container.querySelectorAll('div[class*="h-3"]');
      expect(allBars).toHaveLength(3);
    });
  });

  describe('accessibility', () => {
    it('should have proper structure for screen readers', () => {
      mockUseLatency.mockReturnValue(createMockLatencyData({
        latency: 50,
        getLatencyQuality: vi.fn().mockReturnValue('good'),
      }));
      
      render(<LatencyIndicator />);
      
      // Should have label and value in separate elements
      expect(screen.getByText(GAME_CONSTANTS.UI.LABELS.LATENCY)).toBeInTheDocument();
      expect(screen.getByText(`50${GAME_CONSTANTS.UI.LABELS.LATENCY_MS}`)).toBeInTheDocument();
    });
  });
});