import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm'
import { User } from './User'
import { Chart } from './Chart'

@Entity()
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, user => user.quizzes)
  user: User

  @ManyToOne(() => Chart)
  chart: Chart

  @Column()
  prediction: 'up' | 'down'

  @Column()
  result: 'up' | 'down'

  @Column({ type: 'float' })
  eloChange: number

  @CreateDateColumn()
  timestamp: Date
} 