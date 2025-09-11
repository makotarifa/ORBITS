import Phaser from 'phaser';
import { Position, Velocity } from '../../types/game-events.types';

export interface PlayerEntityConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  playerId: string;
  isLocal?: boolean;
  color?: number;
}

export abstract class BasePlayerEntity extends Phaser.GameObjects.Container {
  protected playerId: string;
  protected isLocal: boolean;
  protected sprite!: Phaser.GameObjects.Sprite;
  protected label!: Phaser.GameObjects.Text;
  protected velocity: Velocity = { x: 0, y: 0 };
  protected playerRotation: number = 0;
  protected targetPosition: Position;
  protected currentPosition: Position;

  constructor(config: PlayerEntityConfig) {
    super(config.scene, config.x, config.y);

    this.playerId = config.playerId;
    this.isLocal = config.isLocal || false;
    this.currentPosition = { x: config.x, y: config.y };
    this.targetPosition = { x: config.x, y: config.y };

    this.scene.add.existing(this);
    this.createSprite(config.color);
    this.createLabel();
  }

  private createSprite(color: number = 0x00ff00): void {
    // Create a simple colored rectangle as player sprite
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color);
    graphics.fillRect(-16, -16, 32, 32);
    graphics.generateTexture(`player-${this.playerId}`, 32, 32);
    graphics.destroy();

    this.sprite = this.scene.add.sprite(0, 0, `player-${this.playerId}`);
    this.add(this.sprite);
  }

  private createLabel(): void {
    this.label = this.scene.add.text(0, -30, this.playerId.slice(0, 8), {
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.label.setOrigin(0.5);
    this.add(this.label);
  }

  public updatePosition(position: Position, rotation: number = 0): void {
    this.targetPosition = { ...position };
    this.playerRotation = rotation;
  }

  public updateVelocity(velocity: Velocity): void {
    this.velocity = { ...velocity };
  }

  public getPosition(): Position {
    return { ...this.currentPosition };
  }

  public getVelocity(): Velocity {
    return { ...this.velocity };
  }

  public getPlayerId(): string {
    return this.playerId;
  }

  public isLocalPlayer(): boolean {
    return this.isLocal;
  }

  public abstract update(delta: number): void;

  public destroy(): void {
    // Clean up texture if it exists
    if (this.scene.textures.exists(`player-${this.playerId}`)) {
      this.scene.textures.remove(`player-${this.playerId}`);
    }
    super.destroy();
  }
}