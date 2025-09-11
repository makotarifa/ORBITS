import Phaser from 'phaser';
import { BasePlayerEntity, PlayerEntityConfig } from './BasePlayerEntity';
import { Position } from '../../types/game-events.types';
import { GAME_CONSTANTS } from '../../constants/game.constants';

export class LocalPlayerEntity extends BasePlayerEntity {
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly moveSpeed: number = 200;
  private lastPositionUpdate: number = 0;
  private readonly positionUpdateInterval: number = 50; // Send position every 50ms

  constructor(config: PlayerEntityConfig) {
    super({ ...config, isLocal: true, color: 0x0000ff }); // Blue for local player

    this.setupInput();
  }

  private setupInput(): void {
    if (!this.scene.input.keyboard) return;

    this.keys = this.scene.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      UP: Phaser.Input.Keyboard.KeyCodes.UP,
      LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
      DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
      RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  public update(delta: number): void {
    this.handleInput(delta);
    this.updatePositionFromInput();

    // Update visual rotation based on movement direction
    if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      this.sprite.rotation = Math.atan2(this.velocity.y, this.velocity.x);
    }

    // Update container position
    this.setPosition(this.currentPosition.x, this.currentPosition.y);
  }

  private handleInput(delta: number): void {
    if (!this.keys) return;

    const deltaTime = delta / 1000; // Convert to seconds
    let newVelocity = { x: 0, y: 0 };

    // Handle WASD keys
    if (this.keys.W.isDown || this.keys.UP.isDown) {
      newVelocity.y = -this.moveSpeed;
    }
    if (this.keys.S.isDown || this.keys.DOWN.isDown) {
      newVelocity.y = this.moveSpeed;
    }
    if (this.keys.A.isDown || this.keys.LEFT.isDown) {
      newVelocity.x = -this.moveSpeed;
    }
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) {
      newVelocity.x = this.moveSpeed;
    }

    // Normalize diagonal movement
    if (newVelocity.x !== 0 && newVelocity.y !== 0) {
      const length = Math.sqrt(newVelocity.x * newVelocity.x + newVelocity.y * newVelocity.y);
      newVelocity.x = (newVelocity.x / length) * this.moveSpeed;
      newVelocity.y = (newVelocity.y / length) * this.moveSpeed;
    }

    this.updateVelocity(newVelocity);

    // Update position based on velocity
    this.currentPosition.x += newVelocity.x * deltaTime;
    this.currentPosition.y += newVelocity.y * deltaTime;

    // Keep player within bounds (simple boundary check)
    this.currentPosition.x = Phaser.Math.Clamp(this.currentPosition.x, GAME_CONSTANTS.DEFAULTS.MOVEMENT_BOUNDS.MIN_X, GAME_CONSTANTS.DEFAULTS.MOVEMENT_BOUNDS.MAX_X);
    this.currentPosition.y = Phaser.Math.Clamp(this.currentPosition.y, GAME_CONSTANTS.DEFAULTS.MOVEMENT_BOUNDS.MIN_Y, GAME_CONSTANTS.DEFAULTS.MOVEMENT_BOUNDS.MAX_Y);
  }

  private updatePositionFromInput(): void {
    const now = Date.now();

    // Throttle position updates to server
    if (now - this.lastPositionUpdate > this.positionUpdateInterval) {
      this.lastPositionUpdate = now;

      // Emit position update event (will be handled by the game scene)
      this.scene.events.emit('local-player-position-update', {
        position: { ...this.currentPosition },
        velocity: { ...this.velocity },
        rotation: this.playerRotation,
      });
    }
  }

  public setPosition(x: number, y: number): this {
    this.currentPosition = { x, y };
    this.targetPosition = { x, y };
    return super.setPosition(x, y);
  }

  public getCurrentPosition(): Position {
    return { ...this.currentPosition };
  }

  public getCurrentVelocity() {
    return { ...this.velocity };
  }
}