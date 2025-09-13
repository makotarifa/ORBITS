import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GameControls } from './GameControls';
import { GAME_CONSTANTS } from '../../constants/game.constants';

// Mock the usePlayer hook
vi.mock('../../hooks/socket/usePlayer', () => ({
  usePlayer: vi.fn(() => ({
    currentRoom: null,
    isInRoom: false,
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    player: null,
    updatePosition: vi.fn(),
    updateVelocity: vi.fn(),
    sendMove: vi.fn(),
    setMoving: vi.fn(),
  })),
}));

// Mock the socket hook
vi.mock('../../hooks/socket/useSocket', () => ({
  useSocket: vi.fn(() => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

import { usePlayer } from '../../hooks/socket/usePlayer';



describe('GameControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders game controls with correct labels', () => {
    render(<GameControls />);

    expect(screen.getByText(GAME_CONSTANTS.UI.LABELS.GAME_CONTROLS)).toBeInTheDocument();
    expect(screen.getByText(GAME_CONSTANTS.UI.LABELS.ROOM_ID)).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'div' && content.includes('Controls');
    })).toBeInTheDocument();
  });

  it('renders join room button when not in room', () => {
    render(<GameControls />);

    expect(screen.getByText(GAME_CONSTANTS.UI.BUTTONS.JOIN_ROOM)).toBeInTheDocument();
    expect(screen.queryByText(GAME_CONSTANTS.UI.BUTTONS.LEAVE_ROOM)).not.toBeInTheDocument();
  });

  it('renders leave room button when in room', () => {
    vi.mocked(usePlayer).mockReturnValue({
      currentRoom: 'test-room',
      isInRoom: true,
      joinRoom: vi.fn(),
      leaveRoom: vi.fn(),
      player: { id: 'test', position: { x: 0, y: 0 }, rotation: 0, velocity: { x: 0, y: 0 }, isMoving: false, lastUpdate: Date.now() },
      updatePosition: vi.fn(),
      updateVelocity: vi.fn(),
      sendMove: vi.fn(),
      setMoving: vi.fn(),
    });

    render(<GameControls />);

    expect(screen.getByText(GAME_CONSTANTS.UI.BUTTONS.LEAVE_ROOM)).toBeInTheDocument();
    expect(screen.queryByText(GAME_CONSTANTS.UI.BUTTONS.JOIN_ROOM)).not.toBeInTheDocument();
    expect(screen.getByText(`${GAME_CONSTANTS.UI.LABELS.CONNECTED_TO} test-room`)).toBeInTheDocument();
  });

  it('shows room ID input with correct placeholder', () => {
    render(<GameControls />);

    const input = screen.getByPlaceholderText(GAME_CONSTANTS.UI.PLACEHOLDERS.ENTER_ROOM_ID);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(GAME_CONSTANTS.DEFAULTS.ROOM_ID);
  });

  it('updates room ID when typing', () => {
    render(<GameControls />);

    const input = screen.getByPlaceholderText(GAME_CONSTANTS.UI.PLACEHOLDERS.ENTER_ROOM_ID);
    fireEvent.change(input, { target: { value: 'new-room-id' } });

    expect(input).toHaveValue('new-room-id');
  });

  it('calls joinRoom when join button is clicked', () => {
    const mockJoinRoom = vi.fn();
    vi.mocked(usePlayer).mockReturnValue({
      currentRoom: null,
      isInRoom: false,
      joinRoom: mockJoinRoom,
      leaveRoom: vi.fn(),
      player: { id: 'test', position: { x: 0, y: 0 }, rotation: 0, velocity: { x: 0, y: 0 }, isMoving: false, lastUpdate: Date.now() },
      updatePosition: vi.fn(),
      updateVelocity: vi.fn(),
      sendMove: vi.fn(),
      setMoving: vi.fn(),
    });

    render(<GameControls />);

    const input = screen.getByPlaceholderText(GAME_CONSTANTS.UI.PLACEHOLDERS.ENTER_ROOM_ID);
    fireEvent.change(input, { target: { value: 'test-room' } });

    const joinButton = screen.getByText(GAME_CONSTANTS.UI.BUTTONS.JOIN_ROOM);
    fireEvent.click(joinButton);

    expect(mockJoinRoom).toHaveBeenCalledWith('test-room');
  });

  it('calls leaveRoom when leave button is clicked', () => {
    const mockLeaveRoom = vi.fn();
    vi.mocked(usePlayer).mockReturnValue({
      currentRoom: 'test-room',
      isInRoom: true,
      joinRoom: vi.fn(),
      leaveRoom: mockLeaveRoom,
      player: { id: 'test', position: { x: 0, y: 0 }, rotation: 0, velocity: { x: 0, y: 0 }, isMoving: false, lastUpdate: Date.now() },
      updatePosition: vi.fn(),
      updateVelocity: vi.fn(),
      sendMove: vi.fn(),
      setMoving: vi.fn(),
    });

    render(<GameControls />);

    const leaveButton = screen.getByText(GAME_CONSTANTS.UI.BUTTONS.LEAVE_ROOM);
    fireEvent.click(leaveButton);

    expect(mockLeaveRoom).toHaveBeenCalled();
  });

  it('displays control instructions', () => {
    render(<GameControls />);

    expect(screen.getByText(`• ${GAME_CONSTANTS.UI.INSTRUCTIONS.MOVE_KEYS}`)).toBeInTheDocument();
    expect(screen.getByText(`• ${GAME_CONSTANTS.UI.INSTRUCTIONS.CAMERA_FOLLOW}`)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<GameControls className="custom-class" />);

    const container = screen.getByText(GAME_CONSTANTS.UI.LABELS.GAME_CONTROLS).closest('div');
    expect(container).toHaveClass('custom-class');
  });
});