import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm'
import { Quiz } from './Quiz'

@Entity()
export class Chart {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  assetName: string

  @Column()
  timeframe: string

  @Column()
  chartImageUrl: string

  @Column()
  result: 'up' | 'down'

  @CreateDateColumn()
  createdAt: Date

  @OneToMany(() => Quiz, quiz => quiz.chart)
  quizzes: Quiz[]
} 