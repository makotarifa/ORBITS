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

export enum RankingType {
  GLOBAL = 'global',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SEASONAL = 'seasonal',
}

@Entity('rankings')
@Index(['type', 'rank'])
@Index(['type', 'score'])
@Index(['userId', 'type', 'period'], { unique: true })
@Index(['period'])
export class Ranking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.rankings)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: RankingType,
    default: RankingType.GLOBAL,
  })
  type: RankingType;

  @Column({ default: 0 })
  score: number;

  @Column({ default: 0 })
  rank: number;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  losses: number;

  @Column({ default: 0 })
  kills: number;

  @Column({ default: 0 })
  deaths: number;

  @Column({ default: 0 })
  assists: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  period: string; // Format: YYYY-WW for weekly, YYYY-MM for monthly, YYYY-QQ for seasonal

  @Column({ default: 0 })
  totalMatches: number;

  @Column({ default: 0 })
  totalPlayTime: number; // in seconds

  @Column('jsonb', { nullable: true })
  achievements: {
    firstBlood: number;
    multiKills: number;
    perfectGames: number;
    comebacks: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get winRate(): number {
    return this.totalMatches > 0 ? (this.wins / this.totalMatches) * 100 : 0;
  }

  get killDeathRatio(): number {
    return this.deaths > 0 ? this.kills / this.deaths : this.kills;
  }

  get averageScorePerMatch(): number {
    return this.totalMatches > 0 ? this.score / this.totalMatches : 0;
  }

  get efficiency(): number {
    return this.totalMatches > 0 ? (this.kills + this.assists) / Math.max(this.deaths, 1) : 0;
  }
}