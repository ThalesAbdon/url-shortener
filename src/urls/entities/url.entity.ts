import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('urls')
export class Url {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'https://www.example.com/some/long/url' })
  @Column({ type: 'text' })
  @Index()
  url: string;

  @ApiProperty({ example: 'abc123' })
  @Column({ unique: true })
  @Index()
  shortCode: string;

  @ApiProperty({ example: 10 })
  @Column({ default: 0 })
  accessCount: number;

  @ApiProperty({ example: '2021-09-01T12:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2021-09-01T12:00:00Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}