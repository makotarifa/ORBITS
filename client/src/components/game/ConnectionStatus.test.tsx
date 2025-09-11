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
      connectionError: null,
      socketId: 'test-socket-id',
    });

    render(<ConnectionStatus />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should render connecting state', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
      connectionError: null,
      socketId: null,
    });

    render(<ConnectionStatus />);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('should render connection error', () => {
    mockUseConnectionState.mockReturnValue({
      isConnected: false,
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
      connectionError: null,
      socketId: null,
    });

    render(<ConnectionStatus />);

    const indicator = screen.getByText('Connecting...').previousElementSibling;
    expect(indicator?.className).toContain('bg-yellow-500');
  });
});