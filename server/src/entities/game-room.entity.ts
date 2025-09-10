import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RoomStatus {
  WAITING = 'waiting',
  STARTING = 'starting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  CLOSED = 'closed',
}

export enum RoomVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  FRIENDS_ONLY = 'friends_only',
}

@Entity('game_rooms')
@Index(['status'])
@Index(['visibility'])
@Index(['createdAt'])
export class GameRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column()
  hostUserId: string;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.WAITING,
  })
  status: RoomStatus;

  @Column({
    type: 'enum',
    enum: RoomVisibility,
    default: RoomVisibility.PUBLIC,
  })
  visibility: RoomVisibility;

  @Column({ nullable: true, length: 20 })
  password: string;

  @Column('jsonb')
  players: {
    userId: string;
    username: string;
    isReady: boolean;
    joinedAt: Date;
    team?: 'red' | 'blue';
    role?: 'player' | 'spectator';
  }[];

  @Column({ default: 8 })
  maxPlayers: number;

  @Column({ default: 0 })
  maxSpectators: number;

  @Column('jsonb')
  gameConfig: {
    gameMode: string;
    mapName: string;
    timeLimit: number; // in minutes
    scoreLimit: number;
    teamMode: boolean;
    friendlyFire: boolean;
    respawnTime: number; // in seconds
    weaponSettings: {
      startingWeapons: string[];
      weaponSpawns: boolean;
      weaponDamageMultiplier: number;
    };
    powerupSettings: {
      enablePowerups: boolean;
      powerupSpawnRate: number;
      powerupDuration: number;
    };
  };

  @Column('jsonb', { nullable: true })
  gameState: {
    currentRound: number;
    totalRounds: number;
    timeRemaining: number;
    scores: {
      red?: number;
      blue?: number;
      individual?: Record<string, number>;
    };
    phase: 'waiting' | 'countdown' | 'active' | 'paused' | 'ended';
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date;

  // Computed properties
  get currentPlayers(): number {
    return this.players?.filter(p => p.role === 'player').length || 0;
  }

  get currentSpectators(): number {
    return this.players?.filter(p => p.role === 'spectator').length || 0;
  }

  get readyPlayers(): number {
    return this.players?.filter(p => p.isReady && p.role === 'player').length || 0;
  }

  get canStart(): boolean {
    return (
      this.status === RoomStatus.WAITING &&
      this.currentPlayers >= 2 &&
      this.readyPlayers === this.currentPlayers
    );
  }

  get canJoin(): boolean {
    return (
      this.status === RoomStatus.WAITING &&
      this.currentPlayers < this.maxPlayers
    );
  }

  get canSpectate(): boolean {
    return (
      this.maxSpectators > 0 &&
      this.currentSpectators < this.maxSpectators &&
      (this.status === RoomStatus.WAITING || this.status === RoomStatus.IN_PROGRESS)
    );
  }

  get isPrivate(): boolean {
    return this.visibility === RoomVisibility.PRIVATE && !!this.password;
  }
}