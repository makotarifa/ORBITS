import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RoomInfo } from './RoomInfo';

// Mock the stores
const mockUseRoomState = vi.fn();
const mockUseServerState = vi.fn();

vi.mock('../../stores', () => ({
  useRoomState: () => mockUseRoomState(),
  useServerState: () => mockUseServerState(),
}));

describe('RoomInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render room info with no current room', () => {
    mockUseRoomState.mockReturnValue({
      currentRoom: null,
      roomPlayerCount: 0,
    });
    mockUseServerState.mockReturnValue({
      serverInfo: null,
    });

    render(<RoomInfo />);

    expect(screen.getByText('Room Info')).toBeInTheDocument();
    expect(screen.getByText('Current Room:')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.getByText('Players in Room:')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render room info with current room and players', () => {
    mockUseRoomState.mockReturnValue({
      currentRoom: 'test-room-123',
      roomPlayerCount: 5,
    });
    mockUseServerState.mockReturnValue({
      serverInfo: null,
    });

    render(<RoomInfo />);

    expect(screen.getByText('test-room-123')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render server info when available', () => {
    mockUseRoomState.mockReturnValue({
      currentRoom: 'test-room-123',
      roomPlayerCount: 3,
    });
    mockUseServerState.mockReturnValue({
      serverInfo: {
        connectedClients: 15,
        activeRooms: 7,
      },
    });

    render(<RoomInfo />);

    expect(screen.getByText('Total Clients:')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Active Rooms:')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('should not render server info when not available', () => {
    mockUseRoomState.mockReturnValue({
      currentRoom: 'test-room-123',
      roomPlayerCount: 3,
    });
    mockUseServerState.mockReturnValue({
      serverInfo: null,
    });

    render(<RoomInfo />);

    expect(screen.queryByText('Total Clients:')).not.toBeInTheDocument();
    expect(screen.queryByText('Active Rooms:')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    mockUseRoomState.mockReturnValue({
      currentRoom: null,
      roomPlayerCount: 0,
    });
    mockUseServerState.mockReturnValue({
      serverInfo: null,
    });

    const { container } = render(<RoomInfo className="custom-class" />);

    const roomInfoDiv = container.firstChild as HTMLElement;
    expect(roomInfoDiv).toHaveClass('custom-class');
    expect(roomInfoDiv).toHaveClass('bg-gray-800');
    expect(roomInfoDiv).toHaveClass('bg-opacity-90');
    expect(roomInfoDiv).toHaveClass('rounded-lg');
    expect(roomInfoDiv).toHaveClass('p-4');
  });

  it('should render with default styling when no className provided', () => {
    mockUseRoomState.mockReturnValue({
      currentRoom: null,
      roomPlayerCount: 0,
    });
    mockUseServerState.mockReturnValue({
      serverInfo: null,
    });

    const { container } = render(<RoomInfo />);

    const roomInfoDiv = container.firstChild as HTMLElement;
    expect(roomInfoDiv).toHaveClass('bg-gray-800');
    expect(roomInfoDiv).toHaveClass('bg-opacity-90');
    expect(roomInfoDiv).toHaveClass('rounded-lg');
    expect(roomInfoDiv).toHaveClass('p-4');
  });

  it('should display room player count correctly', () => {
    mockUseRoomState.mockReturnValue({
      currentRoom: 'room-1',
      roomPlayerCount: 8,
    });
    mockUseServerState.mockReturnValue({
      serverInfo: null,
    });

    render(<RoomInfo />);

    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('should handle zero players in room', () => {
    mockUseRoomState.mockReturnValue({
      currentRoom: 'empty-room',
      roomPlayerCount: 0,
    });
    mockUseServerState.mockReturnValue({
      serverInfo: null,
    });

    render(<RoomInfo />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('empty-room')).toBeInTheDocument();
  });

  it('should handle large numbers for server stats', () => {
    mockUseRoomState.mockReturnValue({
      currentRoom: 'busy-room',
      roomPlayerCount: 50,
    });
    mockUseServerState.mockReturnValue({
      serverInfo: {
        connectedClients: 1000,
        activeRooms: 150,
      },
    });

    render(<RoomInfo />);

    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('should render all labels correctly', () => {
    mockUseRoomState.mockReturnValue({
      currentRoom: 'test-room',
      roomPlayerCount: 2,
    });
    mockUseServerState.mockReturnValue({
      serverInfo: {
        connectedClients: 10,
        activeRooms: 3,
      },
    });

    render(<RoomInfo />);

    expect(screen.getByText('Current Room:')).toBeInTheDocument();
    expect(screen.getByText('Players in Room:')).toBeInTheDocument();
    expect(screen.getByText('Total Clients:')).toBeInTheDocument();
    expect(screen.getByText('Active Rooms:')).toBeInTheDocument();
  });
});