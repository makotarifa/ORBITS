import Phaser from 'phaser';
import { BasePlayerEntity, PlayerEntityConfig } from './BasePlayerEntity';
import { Position } from '../../types/game-events.types';
import { GAME_CONSTANTS } from '../../constants/game.constants';

export class LocalPlayerEntity extends BasePlayerEntity {
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private lastPositionUpdate: number = 0;

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
    this.applyFriction(delta);
    this.updatePositionFromVelocity(delta);
    this.updateRotation(delta);

    // Update container position
    this.setPosition(this.currentPosition.x, this.currentPosition.y);
  }

  private handleInput(delta: number): void {
    if (!this.keys) return;

    const deltaTime = delta / 1000; // Convert to seconds
    let inputVector = { x: 0, y: 0 };

    // Handle WASD keys
    if (this.keys.W.isDown || this.keys.UP.isDown) {
      inputVector.y = -1;
    }
    if (this.keys.S.isDown || this.keys.DOWN.isDown) {
      inputVector.y = 1;
    }
    if (this.keys.A.isDown || this.keys.LEFT.isDown) {
      inputVector.x = -1;
    }
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) {
      inputVector.x = 1;
    }

    // Normalize input vector for consistent acceleration
    if (inputVector.x !== 0 || inputVector.y !== 0) {
      const length = Math.sqrt(inputVector.x * inputVector.x + inputVector.y * inputVector.y);
      inputVector.x /= length;
      inputVector.y /= length;
    }

    // Apply acceleration to velocity
    this.velocity.x += inputVector.x * GAME_CONSTANTS.PLAYER.ACCELERATION * deltaTime;
    this.velocity.y += inputVector.y * GAME_CONSTANTS.PLAYER.ACCELERATION * deltaTime;

    // Limit maximum velocity
    const maxSpeed = GAME_CONSTANTS.PLAYER.MOVE_SPEED;
    const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (currentSpeed > maxSpeed) {
      this.velocity.x = (this.velocity.x / currentSpeed) * maxSpeed;
      this.velocity.y = (this.velocity.y / currentSpeed) * maxSpeed;
    }
  }

  private applyFriction(delta: number): void {
    const deltaTime = delta / 1000;
    this.velocity.x *= Math.pow(GAME_CONSTANTS.PLAYER.FRICTION, deltaTime * GAME_CONSTANTS.PLAYER.FRICTION_FRAME_RATE); // Apply friction per frame
    this.velocity.y *= Math.pow(GAME_CONSTANTS.PLAYER.FRICTION, deltaTime * GAME_CONSTANTS.PLAYER.FRICTION_FRAME_RATE);
  }

  private updatePositionFromVelocity(delta: number): void {
    const deltaTime = delta / 1000;

    // Update position based on velocity
    this.currentPosition.x += this.velocity.x * deltaTime;
    this.currentPosition.y += this.velocity.y * deltaTime;

    // Keep player within bounds with smooth boundary collision
    const bounds = GAME_CONSTANTS.DEFAULTS.MOVEMENT_BOUNDS;
    this.currentPosition.x = Phaser.Math.Clamp(this.currentPosition.x, bounds.MIN_X, bounds.MAX_X);
    this.currentPosition.y = Phaser.Math.Clamp(this.currentPosition.y, bounds.MIN_Y, bounds.MAX_Y);

    // Bounce off boundaries (reduce velocity when hitting edges)
    if (this.currentPosition.x <= bounds.MIN_X || this.currentPosition.x >= bounds.MAX_X) {
      this.velocity.x *= -GAME_CONSTANTS.PLAYER.BOUNCE_ENERGY_LOSS; // Bounce with energy loss
    }
    if (this.currentPosition.y <= bounds.MIN_Y || this.currentPosition.y >= bounds.MAX_Y) {
      this.velocity.y *= -GAME_CONSTANTS.PLAYER.BOUNCE_ENERGY_LOSS; // Bounce with energy loss
    }
  }

  private updateRotation(delta: number): void {
    const deltaTime = delta / 1000;

    // Calculate target rotation based on velocity direction
    let targetRotation = this.sprite.rotation;
    if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      targetRotation = Math.atan2(this.velocity.y, this.velocity.x);
    }

    // Smooth rotation interpolation
    let rotationDiff = targetRotation - this.sprite.rotation;

    // Normalize rotation difference to [-PI, PI]
    while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
    while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;

    // Apply smooth rotation
    this.sprite.rotation += rotationDiff * GAME_CONSTANTS.PLAYER.ROTATION_SPEED * deltaTime;

    // Update player rotation for server sync
    this.playerRotation = this.sprite.rotation;

    // Send position updates to server at regular intervals
    this.sendPositionUpdate();
  }

  private sendPositionUpdate(): void {
    const now = Date.now();

    // Throttle position updates to server
    if (now - this.lastPositionUpdate > GAME_CONSTANTS.PLAYER.POSITION_UPDATE_INTERVAL) {
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