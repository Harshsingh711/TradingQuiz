import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm'
import { Quiz } from './Quiz'

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  username: string

  @Column()
  passwordHash: string

  @Column({ type: 'float', default: 1000 })
  eloScore: number

  @CreateDateColumn()
  createdAt: Date

  @OneToMany(() => Quiz, quiz => quiz.user)
  quizzes: Quiz[]

  // Helper method to calculate win rate
  getWinRate(): number {
    if (!this.quizzes || this.quizzes.length === 0) return 0
    const correctPredictions = this.quizzes.filter(quiz => quiz.result === quiz.prediction).length
    return Math.round((correctPredictions / this.quizzes.length) * 100)
  }

  // Helper method to get total quizzes
  getTotalQuizzes(): number {
    return this.quizzes?.length || 0
  }

  // Helper method to get correct predictions
  getCorrectPredictions(): number {
    if (!this.quizzes) return 0
    return this.quizzes.filter(quiz => quiz.result === quiz.prediction).length
  }
} 