import Phaser from 'phaser';
import { LocalPlayerEntity, RemotePlayerEntity } from '../entities';
import { useGameStore } from '../../stores';
import { useGameEvents, usePlayer } from '../../hooks/socket';
import { GAME_CONSTANTS } from '../../constants/game.constants';

export class GameScene extends Phaser.Scene {
  private localPlayer: LocalPlayerEntity | null = null;
  private readonly remotePlayers: Map<string, RemotePlayerEntity> = new Map();
  private readonly gameStore = useGameStore.getState();
  private readonly gameEvents = useGameEvents();
  private readonly playerHook = usePlayer();

  // UI elements
  private connectionStatusText: Phaser.GameObjects.Text | null = null;
  private playerCountText: Phaser.GameObjects.Text | null = null;
  private roomInfoText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // Create a simple background
    const graphics = this.add.graphics();
    graphics.fillStyle(0x2c3e50);
    graphics.fillRect(0, 0, GAME_CONSTANTS.DEFAULTS.GAME_WORLD.WIDTH, GAME_CONSTANTS.DEFAULTS.GAME_WORLD.HEIGHT);
    graphics.lineStyle(2, 0x34495e);
    graphics.strokeRect(0, 0, GAME_CONSTANTS.DEFAULTS.GAME_WORLD.WIDTH, GAME_CONSTANTS.DEFAULTS.GAME_WORLD.HEIGHT);
  }

  create(): void {
    this.setupCamera();
    this.setupUI();
    this.setupEventListeners();
    this.setupSocketListeners();
    this.initializeGame();
  }

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, GAME_CONSTANTS.DEFAULTS.GAME_WORLD.WIDTH, GAME_CONSTANTS.DEFAULTS.GAME_WORLD.HEIGHT);
    this.cameras.main.setBackgroundColor(0x2c3e50);
  }

  private setupUI(): void {
    // Connection status
    this.connectionStatusText = this.add.text(10, 10, 'Connecting...', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });

    // Player count
    this.playerCountText = this.add.text(10, 35, 'Players: 0', {
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    });

    // Room info
    this.roomInfoText = this.add.text(10, 55, 'Room: None', {
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    });

    // Instructions
    this.add.text(10, 570, 'WASD or Arrow Keys to move', {
      fontSize: '12px',
      color: '#cccccc',
    });
  }

  private setupEventListeners(): void {
    // Listen for local player position updates
    this.events.on('local-player-position-update', this.handleLocalPlayerPositionUpdate, this);
  }

  private setupSocketListeners(): void {
    // Connection events
    this.gameEvents.onPlayerJoined((data) => {
      this.handlePlayerJoined(data);
    });

    this.gameEvents.onPlayerLeft((data) => {
      this.handlePlayerLeft(data);
    });

    this.gameEvents.onPlayerMoved((data) => {
      this.handlePlayerMoved(data);
    });

    this.gameEvents.onPositionUpdate((data) => {
      this.handlePositionUpdate(data);
    });

    this.gameEvents.onRoomJoined((data) => {
      this.handleRoomJoined(data);
    });

    this.gameEvents.onRoomLeft((data) => {
      this.handleRoomLeft(data);
    });

    this.gameEvents.onError((data) => {
      this.handleError(data);
    });
  }

  private initializeGame(): void {
    // Try to join a default room
    const defaultRoomId = GAME_CONSTANTS.DEFAULTS.ROOM_ID;
    this.playerHook.joinRoom(defaultRoomId);

    // Create local player if we have a player state
    if (this.playerHook.player) {
      this.createLocalPlayer();
    }
  }

  private createLocalPlayer(): void {
    if (this.localPlayer) return;

    const playerState = this.playerHook.player;
    if (!playerState) return;

    this.localPlayer = new LocalPlayerEntity({
      scene: this,
      x: playerState.position.x,
      y: playerState.position.y,
      playerId: playerState.id,
    });

    // Follow the local player with camera
    this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);
  }

  private handleLocalPlayerPositionUpdate(data: {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    rotation: number;
  }): void {
    // Update local player state in the store
    this.gameStore.updateLocalPlayerState({
      position: data.position,
      velocity: data.velocity,
      lastUpdate: Date.now(),
    });

    // Send position to server
    this.playerHook.updatePosition(data.position, data.rotation);
  }

  private handlePlayerJoined(data: any): void {
    console.log('Player joined:', data.playerId);

    // Update game store
    this.gameStore.addRoomPlayer(data.playerId, {
      position: data.playerData?.position || GAME_CONSTANTS.DEFAULTS.PLAYER_POSITION,
      rotation: data.playerData?.rotation || 0,
      velocity: data.playerData?.velocity || { x: 0, y: 0 },
      lastUpdate: Date.now(),
    });

    // Create remote player entity if it's not the local player
    if (data.playerId !== this.playerHook.player?.id) {
      this.createRemotePlayer(data.playerId, data.playerData);
    }

    this.updateUI();
  }

  private handlePlayerLeft(data: any): void {
    console.log('Player left:', data.playerId);

    // Remove from game store
    this.gameStore.removeRoomPlayer(data.playerId);

    // Remove remote player entity
    const remotePlayer = this.remotePlayers.get(data.playerId);
    if (remotePlayer) {
      remotePlayer.destroy();
      this.remotePlayers.delete(data.playerId);
    }

    this.updateUI();
  }

  private handlePlayerMoved(data: any): void {
    const remotePlayer = this.remotePlayers.get(data.playerId);
    if (remotePlayer) {
      remotePlayer.updateFromServer(
        data.position,
        data.velocity,
        data.rotation
      );
    }

    // Update game store
    this.gameStore.updateRoomPlayer(data.playerId, {
      position: data.position,
      velocity: data.velocity,
      lastUpdate: Date.now(),
    });
  }

  private handlePositionUpdate(data: any): void {
    // Similar to player moved but for position updates
    this.handlePlayerMoved(data);
  }

  private handleRoomJoined(data: any): void {
    console.log('Joined room:', data.roomId);

    // Update game store
    this.gameStore.setCurrentRoom(data.roomId);
    this.gameStore.setRoomPlayerCount(data.playerCount);

    // Create remote players for existing players in the room
    if (data.playersState) {
      data.playersState.forEach((playerState: any) => {
        if (playerState.playerId !== this.playerHook.player?.id) {
          this.createRemotePlayer(playerState.playerId, playerState);
        }
      });
    }

    this.updateUI();
  }

  private handleRoomLeft(data: any): void {
    console.log('Left room:', data.roomId);

    // Clear all remote players
    this.remotePlayers.forEach(player => player.destroy());
    this.remotePlayers.clear();

    // Update game store
    this.gameStore.setCurrentRoom(null);
    this.gameStore.clearRoomPlayers();

    this.updateUI();
  }

  private handleError(data: any): void {
    console.error('Game error:', data.message);
    // Could show error message to user
  }

  private createRemotePlayer(playerId: string, playerData?: any): void {
    if (this.remotePlayers.has(playerId)) return;

    const position = playerData?.position || GAME_CONSTANTS.DEFAULTS.PLAYER_POSITION;
    const velocity = playerData?.velocity || { x: 0, y: 0 };
    const rotation = playerData?.rotation || 0;

    const remotePlayer = new RemotePlayerEntity({
      scene: this,
      x: position.x,
      y: position.y,
      playerId,
    });

    remotePlayer.updateFromServer(position, velocity, rotation);
    this.remotePlayers.set(playerId, remotePlayer);
  }

  private updateUI(): void {
    const state = useGameStore.getState();

    // Update connection status
    if (this.connectionStatusText) {
      const status = state.isConnected ? 'Connected' : 'Disconnected';
      const color = state.isConnected ? '#00ff00' : '#ff0000';
      this.connectionStatusText.setText(`Status: ${status}`);
      this.connectionStatusText.setColor(color);
    }

    // Update player count
    if (this.playerCountText) {
      this.playerCountText.setText(`Players: ${state.roomPlayerCount}`);
    }

    // Update room info
    if (this.roomInfoText) {
      const roomName = state.currentRoom || 'None';
      this.roomInfoText.setText(`Room: ${roomName}`);
    }
  }

  update(time: number, delta: number): void {
    // Update local player
    if (this.localPlayer) {
      this.localPlayer.update(delta);
    }

    // Update remote players
    this.remotePlayers.forEach(player => {
      player.update(delta);
    });

    // Update UI periodically
    if (time % 1000 < 50) { // Update every second
      this.updateUI();
    }
  }

  shutdown(): void {
    // Clean up event listeners
    this.events.off('local-player-position-update', this.handleLocalPlayerPositionUpdate, this);

    // Clean up entities
    if (this.localPlayer) {
      this.localPlayer.destroy();
    }

    this.remotePlayers.forEach(player => player.destroy());
    this.remotePlayers.clear();
  }
}