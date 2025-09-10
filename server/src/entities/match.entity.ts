import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum MatchStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum MatchType {
  DEATHMATCH = 'deathmatch',
  TEAM_BATTLE = 'team_battle',
  SURVIVAL = 'survival',
  CAPTURE_FLAG = 'capture_flag',
}

@Entity('matches')
@Index(['status'])
@Index(['createdAt'])
@Index(['winnerId'])
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MatchType,
    default: MatchType.DEATHMATCH,
  })
  type: MatchType;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.WAITING,
  })
  status: MatchStatus;

  @Column('jsonb')
  players: {
    userId: string;
    username: string;
    kills: number;
    deaths: number;
    score: number;
    joinedAt: Date;
    leftAt?: Date;
  }[];

  @Column({ nullable: true })
  winnerId: string;

  @ManyToOne(() => User, (user) => user.wonMatches, { nullable: true })
  @JoinColumn({ name: 'winnerId' })
  winner: User;

  @Column({ default: 0 })
  duration: number; // in seconds

  @Column({ default: 8 })
  maxPlayers: number;

  @Column('jsonb', { nullable: true })
  gameSettings: {
    mapSize: { width: number; height: number };
    timeLimit: number;
    scoreLimit: number;
    weaponSettings: Record<string, any>;
  };

  @Column('jsonb', { nullable: true })
  finalStats: {
    totalKills: number;
    totalDeaths: number;
    totalScore: number;
    averageScore: number;
    mvpUserId: string;
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
    return this.players?.filter(p => !p.leftAt).length || 0;
  }

  get isActive(): boolean {
    return this.status === MatchStatus.IN_PROGRESS;
  }

  get canJoin(): boolean {
    return this.status === MatchStatus.WAITING && this.currentPlayers < this.maxPlayers;
  }
}