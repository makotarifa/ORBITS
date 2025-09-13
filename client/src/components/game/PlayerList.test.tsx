import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PlayerList } from './PlayerList';

// Mock the stores
const mockUseRoomState = vi.fn();
const mockUseLocalPlayerState = vi.fn();

vi.mock('../../stores', () => ({
  useRoomState: () => mockUseRoomState(),
  useLocalPlayerState: () => mockUseLocalPlayerState(),
}));

describe('PlayerList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty player list', () => {
    mockUseRoomState.mockReturnValue({
      roomPlayers: new Map(),
      roomPlayerCount: 0,
    });
    mockUseLocalPlayerState.mockReturnValue({
      localPlayerId: 'local-player-123',
    });

    render(<PlayerList />);

    expect(screen.getByText('Players (0)')).toBeInTheDocument();
    expect(screen.getByText('No players in room')).toBeInTheDocument();
  });

  it('should render single player (local player)', () => {
    const localPlayerId = 'local-player-123';
    const roomPlayers = new Map([
      [localPlayerId, {
        position: { x: 100, y: 200 },
        rotation: 0,
        velocity: { x: 0, y: 0 },
        isMoving: false,
        lastUpdate: Date.now(),
      }],
    ]);

    mockUseRoomState.mockReturnValue({
      roomPlayers,
      roomPlayerCount: 1,
    });
    mockUseLocalPlayerState.mockReturnValue({
      localPlayerId,
    });

    render(<PlayerList />);

    expect(screen.getByText('Players (1)')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('(100, 200)')).toBeInTheDocument();
  });

  it('should render multiple players with local player highlighted', () => {
    const localPlayerId = 'local-player-123';
    const roomPlayers = new Map([
      [localPlayerId, {
        position: { x: 100, y: 200 },
        rotation: 0,
        velocity: { x: 0, y: 0 },
        isMoving: false,
        lastUpdate: Date.now(),
      }],
      ['remote-player-456', {
        position: { x: 300, y: 400 },
        rotation: Math.PI / 2,
        velocity: { x: 10, y: 5 },
        isMoving: true,
        lastUpdate: Date.now(),
      }],
      ['remote-player-789', {
        position: { x: 50, y: 75 },
        rotation: Math.PI,
        velocity: { x: -5, y: -10 },
        isMoving: false,
        lastUpdate: Date.now(),
      }],
    ]);

    mockUseRoomState.mockReturnValue({
      roomPlayers,
      roomPlayerCount: 3,
    });
    mockUseLocalPlayerState.mockReturnValue({
      localPlayerId,
    });

    render(<PlayerList />);

    expect(screen.getByText('Players (3)')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    
    // Check that there are exactly 2 elements with 'remote-p' text
    const remotePlayers = screen.getAllByText('remote-p');
    expect(remotePlayers).toHaveLength(2);
    
    expect(screen.getByText('(100, 200)')).toBeInTheDocument();
    expect(screen.getByText('(300, 400)')).toBeInTheDocument();
    expect(screen.getByText('(50, 75)')).toBeInTheDocument();
  });

  it('should render only remote players when local player not in room', () => {
    const localPlayerId = 'local-player-123';
    const roomPlayers = new Map([
      ['remote-player-456', {
        position: { x: 300, y: 400 },
        rotation: 0,
        velocity: { x: 0, y: 0 },
        isMoving: false,
        lastUpdate: Date.now(),
      }],
    ]);

    mockUseRoomState.mockReturnValue({
      roomPlayers,
      roomPlayerCount: 1,
    });
    mockUseLocalPlayerState.mockReturnValue({
      localPlayerId,
    });

    render(<PlayerList />);

    expect(screen.getByText('Players (1)')).toBeInTheDocument();
    expect(screen.getByText('remote-p')).toBeInTheDocument();
    expect(screen.queryByText('You')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    mockUseRoomState.mockReturnValue({
      roomPlayers: new Map(),
      roomPlayerCount: 0,
    });
    mockUseLocalPlayerState.mockReturnValue({
      localPlayerId: 'local-player-123',
    });

    const { container } = render(<PlayerList className="custom-class" />);

    const playerListDiv = container.firstChild as HTMLElement;
    expect(playerListDiv).toHaveClass('custom-class');
    expect(playerListDiv).toHaveClass('bg-gray-800');
    expect(playerListDiv).toHaveClass('bg-opacity-90');
    expect(playerListDiv).toHaveClass('rounded-lg');
    expect(playerListDiv).toHaveClass('p-4');
  });

  it('should render with default styling when no className provided', () => {
    mockUseRoomState.mockReturnValue({
      roomPlayers: new Map(),
      roomPlayerCount: 0,
    });
    mockUseLocalPlayerState.mockReturnValue({
      localPlayerId: 'local-player-123',
    });

    const { container } = render(<PlayerList />);

    const playerListDiv = container.firstChild as HTMLElement;
    expect(playerListDiv).toHaveClass('bg-gray-800');
    expect(playerListDiv).toHaveClass('bg-opacity-90');
    expect(playerListDiv).toHaveClass('rounded-lg');
    expect(playerListDiv).toHaveClass('p-4');
  });

  it('should truncate long player IDs', () => {
    const localPlayerId = 'local-player-123';
    const roomPlayers = new Map([
      ['very-long-remote-player-id-that-should-be-truncated', {
        position: { x: 100, y: 200 },
        rotation: 0,
        velocity: { x: 0, y: 0 },
        isMoving: false,
        lastUpdate: Date.now(),
      }],
    ]);

    mockUseRoomState.mockReturnValue({
      roomPlayers,
      roomPlayerCount: 1,
    });
    mockUseLocalPlayerState.mockReturnValue({
      localPlayerId,
    });

    render(<PlayerList />);

    expect(screen.getByText('very-lon')).toBeInTheDocument();
  });

  it('should round position coordinates', () => {
    const localPlayerId = 'local-player-123';
    const roomPlayers = new Map([
      [localPlayerId, {
        position: { x: 123.7, y: 456.3 },
        rotation: 0,
        velocity: { x: 0, y: 0 },
        isMoving: false,
        lastUpdate: Date.now(),
      }],
    ]);

    mockUseRoomState.mockReturnValue({
      roomPlayers,
      roomPlayerCount: 1,
    });
    mockUseLocalPlayerState.mockReturnValue({
      localPlayerId,
    });

    render(<PlayerList />);

    expect(screen.getByText('(124, 456)')).toBeInTheDocument();
  });

  it('should handle negative coordinates', () => {
    const localPlayerId = 'local-player-123';
    const roomPlayers = new Map([
      [localPlayerId, {
        position: { x: -50.7, y: -25.3 },
        rotation: 0,
        velocity: { x: 0, y: 0 },
        isMoving: false,
        lastUpdate: Date.now(),
      }],
    ]);

    mockUseRoomState.mockReturnValue({
      roomPlayers,
      roomPlayerCount: 1,
    });
    mockUseLocalPlayerState.mockReturnValue({
      localPlayerId,
    });

    render(<PlayerList />);

    expect(screen.getByText('(-51, -25)')).toBeInTheDocument();
  });

  it('should display correct player count', () => {
    const roomPlayers = new Map([
      ['player1', { position: { x: 0, y: 0 }, rotation: 0, velocity: { x: 0, y: 0 }, isMoving: false, lastUpdate: Date.now() }],
      ['player2', { position: { x: 0, y: 0 }, rotation: 0, velocity: { x: 0, y: 0 }, isMoving: false, lastUpdate: Date.now() }],
      ['player3', { position: { x: 0, y: 0 }, rotation: 0, velocity: { x: 0, y: 0 }, isMoving: false, lastUpdate: Date.now() }],
      ['player4', { position: { x: 0, y: 0 }, rotation: 0, velocity: { x: 0, y: 0 }, isMoving: false, lastUpdate: Date.now() }],
      ['player5', { position: { x: 0, y: 0 }, rotation: 0, velocity: { x: 0, y: 0 }, isMoving: false, lastUpdate: Date.now() }],
    ]);

    mockUseRoomState.mockReturnValue({
      roomPlayers,
      roomPlayerCount: 5,
    });
    mockUseLocalPlayerState.mockReturnValue({
      localPlayerId: 'player1',
    });

    render(<PlayerList />);

    expect(screen.getByText('Players (5)')).toBeInTheDocument();
  });
});