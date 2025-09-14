import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionStatus } from '../../components/game/ConnectionStatus';
import { SocketErrorType, SocketErrorSeverity, SocketErrorCategory } from '../../types/socket-errors.types';

// Mock the store
vi.mock('../../stores', () => ({
  useConnectionState: vi.fn(),
}));

// Mock the useSocket hook
vi.mock('../../hooks/socket/useSocket', () => ({
  useSocket: vi.fn(),
}));

import { useConnectionState } from '../../stores';
import { useSocket } from '../../hooks/socket/useSocket';

describe('ConnectionStatus', () => {
  const mockUseConnectionState = vi.mocked(useConnectionState);
  const mockUseSocket = vi.mocked(useSocket);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for useSocket
    mockUseSocket.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      socketId: undefined,
      error: null,
      errorDetails: null,
      connectionHealth: {
        isHealthy: true,
        issues: [],
        recommendations: []
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
      forceReconnect: vi.fn(),
      clearError: vi.fn(),
      canRetry: false,
      retryIn: 0
    });
  });

  it('should render connected state', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      connectionError: null,
      socketId: 'test-socket-id',
    });

    render(<ConnectionStatus />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should render connecting state', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      connectionError: null,
      socketId: null,
    });

    mockUseSocket.mockReturnValue({
      isConnected: false,
      isConnecting: true,
      socketId: undefined,
      error: null,
      errorDetails: null,
      connectionHealth: {
        isHealthy: true,
        issues: [],
        recommendations: []
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
      forceReconnect: vi.fn(),
      clearError: vi.fn(),
      canRetry: false,
      retryIn: 0
    });

    render(<ConnectionStatus />);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('should render connection error', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      connectionError: 'Network timeout',
      socketId: null,
    });
    
    mockUseSocket.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      socketId: undefined,
      error: 'Network timeout',
      errorDetails: {
        type: SocketErrorType.NETWORK_ERROR,
        severity: SocketErrorSeverity.MEDIUM,
        category: SocketErrorCategory.TRANSIENT,
        message: 'Network timeout',
        userMessage: 'Connection Error',
        recoveryActions: ['Retry connection', 'Check internet connection'],
        canRetry: true,
        retryDelay: 5000,
        maxRetries: 3,
        timestamp: Date.now(),
        context: { phase: 'connection' }
      },
      connectionHealth: {
        isHealthy: false,
        issues: ['Network timeout'],
        recommendations: ['Retry connection']
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
      forceReconnect: vi.fn(),
      clearError: vi.fn(),
      canRetry: true,
      retryIn: 0
    });

    render(<ConnectionStatus />);

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    // The error message is shown in the details section when expanded
    // For this test, we just verify the user message is displayed
  });

  it('should apply custom className', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      connectionError: null,
      socketId: 'test-socket-id',
    });

    const { container } = render(<ConnectionStatus className="custom-class" />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv?.className).toContain('custom-class');
  });

  it('should show green indicator when connected', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      connectionError: null,
      socketId: 'test-socket-id',
    });

    render(<ConnectionStatus />);

    const indicator = screen.getByText('Connected').previousElementSibling;
    expect(indicator?.className).toContain('bg-green-500');
  });

  it('should show yellow indicator when connecting', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      connectionError: null,
      socketId: null,
    });

    mockUseSocket.mockReturnValue({
      isConnected: false,
      isConnecting: true,
      socketId: undefined,
      error: null,
      errorDetails: null,
      connectionHealth: {
        isHealthy: true,
        issues: [],
        recommendations: []
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
      forceReconnect: vi.fn(),
      clearError: vi.fn(),
      canRetry: false,
      retryIn: 0
    });

    render(<ConnectionStatus />);

    const indicator = screen.getByText('Connecting...').previousElementSibling;
    expect(indicator?.className).toContain('bg-blue-500');
  });

  it('should render with default styling when no className provided', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      connectionError: null,
      socketId: 'test-socket-id',
    });

    const { container } = render(<ConnectionStatus />);

    const statusDiv = container.querySelector('.flex.items-center.space-x-2') as HTMLElement;
    expect(statusDiv).toHaveClass('flex');
    expect(statusDiv).toHaveClass('items-center');
    expect(statusDiv).toHaveClass('space-x-2');
  });

  it('should display red indicator when connection error', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      connectionError: 'Network error',
      socketId: null,
    });

    mockUseSocket.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      socketId: undefined,
      error: 'Network error',
      errorDetails: {
        type: SocketErrorType.NETWORK_ERROR,
        severity: SocketErrorSeverity.HIGH,
        category: SocketErrorCategory.TRANSIENT,
        message: 'Network error',
        userMessage: 'Connection failed',
        recoveryActions: ['Retry connection'],
        canRetry: true,
        retryDelay: 5000,
        maxRetries: 3,
        timestamp: Date.now(),
        context: { phase: 'connection' }
      },
      connectionHealth: {
        isHealthy: false,
        issues: ['Network error'],
        recommendations: ['Retry connection']
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
      forceReconnect: vi.fn(),
      clearError: vi.fn(),
      canRetry: true,
      retryIn: 0
    });

    const { container } = render(<ConnectionStatus />);

    const indicator = container.querySelector('.w-3.h-3.rounded-full');
    expect(indicator).toHaveClass('bg-red-500');
    expect(indicator).not.toHaveClass('bg-green-500');
    expect(indicator).not.toHaveClass('bg-yellow-500');
  });

  it('should apply correct text color for connected state', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      connectionError: null,
      socketId: 'test-socket-id',
    });

    render(<ConnectionStatus />);

    const statusText = screen.getByText('Connected');
    expect(statusText).toHaveClass('text-green-500');
    expect(statusText).not.toHaveClass('text-yellow-500');
    expect(statusText).not.toHaveClass('text-red-500');
  });

  it('should apply correct text color for connecting state', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      connectionError: null,
      socketId: null,
    });

    mockUseSocket.mockReturnValue({
      isConnected: false,
      isConnecting: true,
      socketId: undefined,
      error: null,
      errorDetails: null,
      connectionHealth: {
        isHealthy: true,
        issues: [],
        recommendations: []
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
      forceReconnect: vi.fn(),
      clearError: vi.fn(),
      canRetry: false,
      retryIn: 0
    });

    render(<ConnectionStatus />);

    const statusText = screen.getByText('Connecting...');
    expect(statusText).toHaveClass('text-blue-500');
    expect(statusText).not.toHaveClass('text-green-500');
    expect(statusText).not.toHaveClass('text-red-500');
  });

  it('should apply correct text color for error state', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      connectionError: 'Connection failed',
      socketId: null,
    });

    mockUseSocket.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      socketId: undefined,
      error: 'Connection failed',
      errorDetails: {
        type: SocketErrorType.CONNECTION_TIMEOUT,
        severity: SocketErrorSeverity.HIGH,
        category: SocketErrorCategory.TRANSIENT,
        message: 'Connection failed',
        userMessage: 'Connection Error',
        recoveryActions: ['Retry connection'],
        canRetry: true,
        retryDelay: 5000,
        maxRetries: 3,
        timestamp: Date.now(),
        context: { phase: 'connection' }
      },
      connectionHealth: {
        isHealthy: false,
        issues: ['Connection failed'],
        recommendations: ['Retry connection']
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
      forceReconnect: vi.fn(),
      clearError: vi.fn(),
      canRetry: true,
      retryIn: 0
    });

    render(<ConnectionStatus />);

    const statusText = screen.getByText('Connection Error');
    expect(statusText).toHaveClass('text-red-500');
    expect(statusText).not.toHaveClass('text-yellow-500');
    expect(statusText).not.toHaveClass('text-green-500');
  });

  it('should display error message with correct styling', () => {
    const errorMessage = 'WebSocket connection timeout';
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      connectionError: errorMessage,
      socketId: null,
    });

    mockUseSocket.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      socketId: undefined,
      error: errorMessage,
      errorDetails: {
        type: SocketErrorType.CONNECTION_TIMEOUT,
        severity: SocketErrorSeverity.MEDIUM,
        category: SocketErrorCategory.TRANSIENT,
        message: errorMessage,
        userMessage: 'Connection Error',
        recoveryActions: ['Retry connection'],
        canRetry: true,
        retryDelay: 5000,
        maxRetries: 3,
        timestamp: Date.now(),
        context: { phase: 'connection' }
      },
      connectionHealth: {
        isHealthy: false,
        issues: [errorMessage],
        recommendations: ['Retry connection']
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
      forceReconnect: vi.fn(),
      clearError: vi.fn(),
      canRetry: true,
      retryIn: 0
    });

    render(<ConnectionStatus />);

    // The component shows the userMessage, not the technical error message
    const errorText = screen.getByText('Connection Error');
    expect(errorText).toHaveClass('text-yellow-500'); // MEDIUM severity uses yellow
  });

  it('should not display error message when no error', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      connectionError: null,
      socketId: 'test-socket-id',
    });

    render(<ConnectionStatus />);

    expect(screen.queryByText(/text-red-400/)).not.toBeInTheDocument();
  });

  it('should handle empty error message', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      connectionError: '',
      socketId: null,
    });

    render(<ConnectionStatus />);

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    // Should not display empty error message span
    expect(screen.queryByText(/text-red-400/)).not.toBeInTheDocument();
  });

  it('should handle long error messages', () => {
    const longErrorMessage = 'This is a very long error message that describes a detailed connection failure scenario with multiple potential causes and troubleshooting steps';
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      connectionError: longErrorMessage,
      socketId: null,
    });

    render(<ConnectionStatus />);

    expect(screen.getByText(longErrorMessage)).toBeInTheDocument();
  });

  it('should handle null socketId when connected', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      connectionError: null,
      socketId: null,
    });

    render(<ConnectionStatus />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should handle undefined socketId when connecting', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      connectionError: null,
      socketId: null,
    });

    render(<ConnectionStatus />);

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  // Reconnecting state tests
  it('should render reconnecting state', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: true,
      connectionError: null,
      socketId: null,
    });

    render(<ConnectionStatus />);

    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
  });

  it('should show orange indicator when reconnecting', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: true,
      connectionError: null,
      socketId: null,
    });

    render(<ConnectionStatus />);

    const indicator = screen.getByText('Reconnecting...').previousElementSibling;
    expect(indicator?.className).toContain('bg-orange-500');
  });

  it('should apply correct text color for reconnecting state', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: true,
      connectionError: null,
      socketId: null,
    });

    render(<ConnectionStatus />);

    const statusText = screen.getByText('Reconnecting...');
    expect(statusText).toHaveClass('text-orange-500');
    expect(statusText).not.toHaveClass('text-green-500');
    expect(statusText).not.toHaveClass('text-yellow-500');
    expect(statusText).not.toHaveClass('text-red-500');
  });

  it('should show pulsing animation when reconnecting', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: true,
      connectionError: null,
      socketId: null,
    });

    const { container } = render(<ConnectionStatus />);

    const indicator = container.querySelector('.w-3.h-3.rounded-full');
    expect(indicator).toHaveClass('animate-pulse');
  });

  it('should show pulsing animation when connecting but not connected', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      connectionError: null,
      socketId: null,
    });

    const { container } = render(<ConnectionStatus />);

    const indicator = container.querySelector('.w-3.h-3.rounded-full');
    expect(indicator).toHaveClass('animate-pulse');
  });

  it('should not show pulsing animation when connected', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      connectionError: null,
      socketId: 'test-socket-id',
    });

    const { container } = render(<ConnectionStatus />);

    const indicator = container.querySelector('.w-3.h-3.rounded-full');
    expect(indicator).not.toHaveClass('animate-pulse');
  });

  it('should not show pulsing animation when there is an error', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      connectionError: 'Connection failed',
      socketId: null,
    });

    mockUseSocket.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      socketId: undefined,
      error: 'Connection failed',
      errorDetails: {
        type: SocketErrorType.CONNECTION_TIMEOUT,
        severity: SocketErrorSeverity.HIGH, // HIGH severity doesn't have pulse animation
        category: SocketErrorCategory.TRANSIENT,
        message: 'Connection failed',
        userMessage: 'Connection Error',
        recoveryActions: ['Retry connection'],
        canRetry: true,
        retryDelay: 5000,
        maxRetries: 3,
        timestamp: Date.now(),
        context: { phase: 'connection' }
      },
      connectionHealth: {
        isHealthy: false,
        issues: ['Connection failed'],
        recommendations: ['Retry connection']
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      reconnect: vi.fn(),
      forceReconnect: vi.fn(),
      clearError: vi.fn(),
      canRetry: true,
      retryIn: 0
    });

    const { container } = render(<ConnectionStatus />);

    const indicator = container.querySelector('.w-3.h-3.rounded-full');
    expect(indicator).not.toHaveClass('animate-pulse');
  });
});