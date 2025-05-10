import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { DataSource } from 'typeorm'
import authRoutes from './routes/auth'
import quizRoutes from './routes/quiz'
import leaderboardRoutes from './routes/leaderboard'
import profileRoutes from './routes/profile'
import { User } from './entities/User'
import { Quiz } from './entities/Quiz'
import { Chart } from './entities/Chart'

dotenv.config()

const app = express()

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

// Database connection
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'trading_quiz',
  entities: [User, Quiz, Chart],
  synchronize: process.env.NODE_ENV === 'development',
})

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// Start server
const PORT = process.env.PORT || 3001

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully')
    
    // Register routes after database is initialized
    app.use('/api/auth', authRoutes)
    app.use('/api/quiz', quizRoutes)
    app.use('/api/leaderboard', leaderboardRoutes)
    app.use('/api/profile', profileRoutes)
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Error connecting to database:', error)
  }) 