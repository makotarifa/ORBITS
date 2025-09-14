import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionStatus } from '../../components/game/ConnectionStatus';

// Mock the store
vi.mock('../../stores', () => ({
  useConnectionState: vi.fn(),
}));

import { useConnectionState } from '../../stores';

describe('ConnectionStatus', () => {
  const mockUseConnectionState = vi.mocked(useConnectionState);

  beforeEach(() => {
    vi.clearAllMocks();
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

    render(<ConnectionStatus />);

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      connectionError: null,
      socketId: 'test-socket-id',
    });

    render(<ConnectionStatus className="custom-class" />);

    const container = screen.getByText('Connected').parentElement;
    expect(container?.className).toContain('custom-class');
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

    render(<ConnectionStatus />);

    const indicator = screen.getByText('Connecting...').previousElementSibling;
    expect(indicator?.className).toContain('bg-yellow-500');
  });

  it('should render with default styling when no className provided', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      connectionError: null,
      socketId: 'test-socket-id',
    });

    const { container } = render(<ConnectionStatus />);

    const statusDiv = container.firstChild as HTMLElement;
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

    render(<ConnectionStatus />);

    const statusText = screen.getByText('Connecting...');
    expect(statusText).toHaveClass('text-yellow-500');
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

    render(<ConnectionStatus />);

    const errorText = screen.getByText(errorMessage);
    expect(errorText).toHaveClass('text-xs');
    expect(errorText).toHaveClass('text-red-400');
    expect(errorText).toHaveClass('ml-2');
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

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
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

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
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

    const { container } = render(<ConnectionStatus />);

    const indicator = container.querySelector('.w-3.h-3.rounded-full');
    expect(indicator).not.toHaveClass('animate-pulse');
  });
});