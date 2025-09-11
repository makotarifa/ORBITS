import Phaser from 'phaser';
import { BasePlayerEntity, PlayerEntityConfig } from './BasePlayerEntity';
import { Position, Velocity } from '../../types/game-events.types';

export class RemotePlayerEntity extends BasePlayerEntity {
  private readonly interpolationSpeed: number = 0.1;
  private lastUpdateTime: number = 0;
  private serverPosition: Position;
  private serverVelocity: Velocity;
  private serverRotation: number = 0;
  private readonly interpolationThreshold: number = 5; // Distance threshold for interpolation

  constructor(config: PlayerEntityConfig) {
    super({ ...config, isLocal: false, color: 0xff0000 }); // Red for remote players

    this.serverPosition = { x: config.x, y: config.y };
    this.serverVelocity = { x: 0, y: 0 };
  }

  public update(delta: number): void {
    this.interpolatePosition(delta);
    this.updateVisualRotation();

    // Update container position
    this.setPosition(this.currentPosition.x, this.currentPosition.y);
  }

  private interpolatePosition(delta: number): void {
    const deltaTime = delta / 1000; // Convert to seconds

    // Calculate distance to target
    const distance = Phaser.Math.Distance.Between(
      this.currentPosition.x,
      this.currentPosition.y,
      this.targetPosition.x,
      this.targetPosition.y
    );

    // If we're close enough to the target, snap to it
    if (distance < this.interpolationThreshold) {
      this.currentPosition = { ...this.targetPosition };
      this.velocity = { ...this.serverVelocity };
      return;
    }

    // Interpolate towards target position
    const lerpFactor = Math.min(this.interpolationSpeed * deltaTime * 60, 1); // 60 FPS normalization

    this.currentPosition.x = Phaser.Math.Linear(
      this.currentPosition.x,
      this.targetPosition.x,
      lerpFactor
    );

    this.currentPosition.y = Phaser.Math.Linear(
      this.currentPosition.y,
      this.targetPosition.y,
      lerpFactor
    );

    // Interpolate velocity for smoother movement
    this.velocity.x = Phaser.Math.Linear(
      this.velocity.x,
      this.serverVelocity.x,
      lerpFactor
    );

    this.velocity.y = Phaser.Math.Linear(
      this.velocity.y,
      this.serverVelocity.y,
      lerpFactor
    );
  }

  private updateVisualRotation(): void {
    // Update sprite rotation based on movement direction or server rotation
    if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      this.sprite.rotation = Math.atan2(this.velocity.y, this.velocity.x);
    } else {
      this.sprite.rotation = this.serverRotation;
    }
  }

  public updateFromServer(position: Position, velocity: Velocity, rotation: number): void {
    this.serverPosition = { ...position };
    this.serverVelocity = { ...velocity };
    this.serverRotation = rotation;
    this.lastUpdateTime = Date.now();

    // Update target position for interpolation
    this.updatePosition(position, rotation);
    this.updateVelocity(velocity);
  }

  public getServerPosition(): Position {
    return { ...this.serverPosition };
  }

  public getServerVelocity(): Velocity {
    return { ...this.serverVelocity };
  }

  public getLastUpdateTime(): number {
    return this.lastUpdateTime;
  }

  public getInterpolationDistance(): number {
    return Phaser.Math.Distance.Between(
      this.currentPosition.x,
      this.currentPosition.y,
      this.targetPosition.x,
      this.targetPosition.y
    );
  }

  // Override to handle server updates
  public updatePosition(position: Position, rotation: number = 0): void {
    super.updatePosition(position, rotation);
    this.serverPosition = { ...position };
    this.serverRotation = rotation;
  }

  public updateVelocity(velocity: Velocity): void {
    super.updateVelocity(velocity);
    this.serverVelocity = { ...velocity };
  }
}