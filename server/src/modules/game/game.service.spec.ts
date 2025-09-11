import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { Socket } from 'socket.io';

describe('GameService', () => {
  let service: GameService;
  let mockSocket1: Partial<Socket>;
  let mockSocket2: Partial<Socket>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService],
    }).compile();

    service = module.get<GameService>(GameService);

    // Mock sockets
    mockSocket1 = { id: 'client1' } as Socket;
    mockSocket2 = { id: 'client2' } as Socket;
  });

  describe('Basic functionality', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should add and remove clients', () => {
      service.addClient('client1', mockSocket1 as Socket);
      expect(service.getConnectedClientsCount()).toBe(1);

      service.removeClient('client1');
      expect(service.getConnectedClientsCount()).toBe(0);
    });

    it('should manage rooms', () => {
      service.addClient('client1', mockSocket1 as Socket);
      service.addClient('client2', mockSocket2 as Socket);

      service.joinRoom('client1', 'room1');
      service.joinRoom('client2', 'room1');

      expect(service.getRoomClients('room1')).toEqual(['client1', 'client2']);
      expect(service.getRoomsCount()).toBe(1);

      service.leaveRoom('client1', 'room1');
      expect(service.getRoomClients('room1')).toEqual(['client2']);

      service.leaveRoom('client2', 'room1');
      expect(service.getRoomsCount()).toBe(0);
    });
  });

  describe('Position synchronization', () => {
    beforeEach(() => {
      service.addClient('client1', mockSocket1 as Socket);
    });

    it('should initialize player with default state', () => {
      const state = service.getPlayerState('client1');
      expect(state).toBeDefined();
      expect(state?.position).toEqual({ x: 0, y: 0 });
      expect(state?.rotation).toBe(0);
      expect(state?.velocity).toEqual({ x: 0, y: 0 });
    });

    it('should update player position with significant change', () => {
      const newPosition = { x: 10, y: 20 };
      const newRotation = 1.5;
      const newVelocity = { x: 5, y: 10 };

      const result = service.updatePlayerPosition('client1', newPosition, newRotation, newVelocity);

      expect(result.shouldUpdate).toBe(true);
      expect(result.deltaData).toBeDefined();
      expect(result.deltaData?.position).toEqual(newPosition);
      expect(result.deltaData?.rotation).toBe(newRotation);
      expect(result.deltaData?.velocity).toEqual(newVelocity);
      expect(result.deltaData?.playerId).toBe('client1');
    });

    it('should not update with insignificant position change', () => {
      // First update to set a baseline
      service.updatePlayerPosition('client1', { x: 10, y: 10 }, 1.0, { x: 5, y: 5 });

      // Small change below threshold
      const result = service.updatePlayerPosition('client1', { x: 10.05, y: 10.05 }, 1.005, { x: 5.02, y: 5.02 });

      expect(result.shouldUpdate).toBe(false);
    });

    it('should respect throttling', () => {
      const position = { x: 10, y: 20 };
      
      // First update should succeed
      const result1 = service.updatePlayerPosition('client1', position);
      expect(result1.shouldUpdate).toBe(true);

      // Immediate second update should be throttled
      const result2 = service.updatePlayerPosition('client1', { x: 15, y: 25 });
      expect(result2.shouldUpdate).toBe(false);
    });

    it('should get room players state', () => {
      service.addClient('client2', mockSocket2 as Socket);
      service.joinRoom('client1', 'room1');
      service.joinRoom('client2', 'room1');

      // Update positions
      service.updatePlayerPosition('client1', { x: 10, y: 10 });
      service.updatePlayerPosition('client2', { x: 20, y: 20 });

      const roomState = service.getRoomPlayersState('room1');
      expect(roomState).toHaveLength(2);
      expect(roomState.find(p => p.playerId === 'client1')?.state.position).toEqual({ x: 10, y: 10 });
      expect(roomState.find(p => p.playerId === 'client2')?.state.position).toEqual({ x: 20, y: 20 });
    });

    it('should handle client disconnection and room cleanup', () => {
      service.joinRoom('client1', 'room1');
      
      expect(service.getRoomClients('room1')).toContain('client1');
      expect(service.getPlayerState('client1')).toBeDefined();

      service.removeClient('client1');

      expect(service.getRoomClients('room1')).toHaveLength(0);
      expect(service.getPlayerState('client1')).toBeUndefined();
      expect(service.getRoomsCount()).toBe(0);
    });

    it('should handle room switching', () => {
      service.joinRoom('client1', 'room1');
      expect(service.getRoomClients('room1')).toContain('client1');
      expect(service.getPlayerState('client1')?.roomId).toBe('room1');

      // Switch to room2
      service.joinRoom('client1', 'room2');
      expect(service.getRoomClients('room1')).toHaveLength(0);
      expect(service.getRoomClients('room2')).toContain('client1');
      expect(service.getPlayerState('client1')?.roomId).toBe('room2');
    });
  });

  describe('Delta compression', () => {
    beforeEach(() => {
      service.addClient('client1', mockSocket1 as Socket);
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should detect significant position changes', () => {
      // Set initial position
      service.updatePlayerPosition('client1', { x: 0, y: 0 });

      // Wait to avoid throttling
      jest.advanceTimersByTime(50);

      // Significant position change
      const result = service.updatePlayerPosition('client1', { x: 0.2, y: 0.2 });
      expect(result.shouldUpdate).toBe(true);
    });

    it('should detect significant rotation changes', () => {
      // Set initial rotation
      service.updatePlayerPosition('client1', undefined, 0);

      // Wait to avoid throttling
      jest.advanceTimersByTime(50);

      // Significant rotation change
      const result = service.updatePlayerPosition('client1', undefined, 0.02);
      expect(result.shouldUpdate).toBe(true);
    });

    it('should detect significant velocity changes', () => {
      // Set initial velocity
      service.updatePlayerPosition('client1', undefined, undefined, { x: 0, y: 0 });

      // Wait to avoid throttling
      jest.advanceTimersByTime(50);

      // Significant velocity change
      const result = service.updatePlayerPosition('client1', undefined, undefined, { x: 0.1, y: 0.1 });
      expect(result.shouldUpdate).toBe(true);
    });
  });
});