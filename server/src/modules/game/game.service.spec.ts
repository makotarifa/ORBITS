import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';

describe('GameService', () => {
  let service: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add and remove clients', () => {
    const mockClient = { id: 'test' };

    service.addClient('client1', mockClient);
    expect(service.getConnectedClientsCount()).toBe(1);

    service.removeClient('client1');
    expect(service.getConnectedClientsCount()).toBe(0);
  });

  it('should manage rooms', () => {
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