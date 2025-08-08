import 'reflect-metadata'
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
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

// Database connection
let dbConfig: any;

if (process.env.DATABASE_URL) {
  // Heroku provides DATABASE_URL
  dbConfig = {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    entities: [User, Quiz, Chart],
  };
} else {
  // Local development with individual environment variables
  dbConfig = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'trading_quiz',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    entities: [User, Quiz, Chart],
  };
}

export const AppDataSource = new DataSource(dbConfig);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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
    
    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() })
    })
    
    // Register routes after database is initialized
    app.use('/api/auth', authRoutes)
    app.use('/api/quiz', quizRoutes)
    app.use('/api/leaderboard', leaderboardRoutes)
    app.use('/api/profile', profileRoutes)
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  })
  .catch((error) => {
    console.error('Database connection failed:', error)
    process.exit(1)
  }) 