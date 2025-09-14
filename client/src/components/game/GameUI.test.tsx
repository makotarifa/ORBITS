import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GameUI } from './GameUI';
import { GAME_CONSTANTS } from '../../constants/game.constants';

// Mock child components
vi.mock('./ConnectionStatus', () => ({
  ConnectionStatus: () => <div data-testid="connection-status">Connection Status</div>,
}));

vi.mock('./PlayerList', () => ({
  PlayerList: ({ className }: { className?: string }) => (
    <div data-testid="player-list" className={className}>Player List</div>
  ),
}));

vi.mock('./RoomInfo', () => ({
  RoomInfo: ({ className }: { className?: string }) => (
    <div data-testid="room-info" className={className}>Room Info</div>
  ),
}));

vi.mock('./GameControls', () => ({
  GameControls: ({ className }: { className?: string }) => (
    <div data-testid="game-controls" className={className}>Game Controls</div>
  ),
}));

vi.mock('./LatencyIndicator', () => ({
  LatencyIndicator: () => <div data-testid="latency-indicator">Latency Indicator</div>,
}));

describe('GameUI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all game UI components', () => {
    render(<GameUI />);

    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    expect(screen.getByTestId('latency-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('game-controls')).toBeInTheDocument();
    expect(screen.getByTestId('room-info')).toBeInTheDocument();
    expect(screen.getByTestId('player-list')).toBeInTheDocument();
  });

  it('renders instructions section with correct content', () => {
    render(<GameUI />);

    expect(screen.getByText(GAME_CONSTANTS.UI.LABELS.INSTRUCTIONS)).toBeInTheDocument();
    expect(screen.getByText(`• ${GAME_CONSTANTS.UI.INSTRUCTIONS.MOVE_KEYS}`)).toBeInTheDocument();
    expect(screen.getByText(`• ${GAME_CONSTANTS.UI.INSTRUCTIONS.CAMERA_FOLLOW}`)).toBeInTheDocument();
    expect(screen.getByText(`• ${GAME_CONSTANTS.UI.INSTRUCTIONS.JOIN_ROOMS}`)).toBeInTheDocument();
    expect(screen.getByText(`• ${GAME_CONSTANTS.UI.INSTRUCTIONS.REAL_TIME_POSITIONS}`)).toBeInTheDocument();
  });

  it('applies correct positioning classes', () => {
    render(<GameUI />);

    // Main container should have absolute positioning
    const mainContainer = screen.getByTestId('connection-status').parentElement?.parentElement;
    expect(mainContainer).toHaveClass('absolute', 'top-4', 'left-4', 'z-10', 'space-y-4');

    // Connection/Latency container should be flex
    const connectionContainer = screen.getByTestId('connection-status').parentElement;
    expect(connectionContainer).toHaveClass('flex', 'items-center', 'space-x-4');

    // Room info should be positioned top-right
    const roomInfoContainer = screen.getByTestId('room-info').parentElement;
    expect(roomInfoContainer).toHaveClass('absolute', 'top-4', 'right-4');

    // Player list should be positioned bottom-left
    const playerListContainer = screen.getByTestId('player-list').parentElement;
    expect(playerListContainer).toHaveClass('absolute', 'bottom-4', 'left-4');

    // Instructions should be positioned bottom-right
    const instructionsContainer = screen.getByText(GAME_CONSTANTS.UI.LABELS.INSTRUCTIONS).parentElement?.parentElement;
    expect(instructionsContainer).toHaveClass('absolute', 'bottom-4', 'right-4');
  });

  it('passes correct className to GameControls', () => {
    render(<GameUI />);

    const gameControls = screen.getByTestId('game-controls');
    expect(gameControls).toHaveClass('w-80');
  });

  it('passes correct className to RoomInfo', () => {
    render(<GameUI />);

    const roomInfo = screen.getByTestId('room-info');
    expect(roomInfo).toHaveClass('w-80');
  });

  it('passes correct className to PlayerList', () => {
    render(<GameUI />);

    const playerList = screen.getByTestId('player-list');
    expect(playerList).toHaveClass('w-80');
  });

  it('applies custom className', () => {
    render(<GameUI className="custom-class" />);

    const mainContainer = screen.getByTestId('connection-status').parentElement?.parentElement;
    expect(mainContainer).toHaveClass('custom-class');
  });

  it('instructions section has correct styling', () => {
    render(<GameUI />);

    const instructionsContainer = screen.getByText(GAME_CONSTANTS.UI.LABELS.INSTRUCTIONS).parentElement;
    expect(instructionsContainer).toHaveClass('bg-gray-800', 'bg-opacity-90', 'rounded-lg', 'p-4', 'w-80');

    const instructionsTitle = screen.getByText(GAME_CONSTANTS.UI.LABELS.INSTRUCTIONS);
    expect(instructionsTitle).toHaveClass('text-white', 'font-semibold', 'mb-2');

    const instructionsList = instructionsTitle.nextElementSibling;
    expect(instructionsList).toHaveClass('text-gray-300', 'text-sm', 'space-y-1');
  });
});