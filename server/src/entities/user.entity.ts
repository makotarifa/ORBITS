import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Match } from './match.entity';
import { Ranking } from './ranking.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: 0 })
  level: number;

  @Column({ default: 0 })
  experience: number;

  @Column({ default: 0 })
  totalMatches: number;

  @Column({ default: 0 })
  totalWins: number;

  @Column({ default: 0 })
  totalKills: number;

  @Column({ default: 0 })
  totalDeaths: number;

  @Column({ default: 0 })
  totalScore: number;

  @Column({ default: 0 })
  totalPlayTime: number; // in seconds

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Match, 'winner')
  wonMatches: Match[];

  @OneToMany(() => Ranking, (ranking) => ranking.user)
  rankings: Ranking[];

  // Computed properties
  get winRate(): number {
    return this.totalMatches > 0 ? (this.totalWins / this.totalMatches) * 100 : 0;
  }

  get killDeathRatio(): number {
    return this.totalDeaths > 0 ? this.totalKills / this.totalDeaths : this.totalKills;
  }

  get averageScorePerMatch(): number {
    return this.totalMatches > 0 ? this.totalScore / this.totalMatches : 0;
  }
}