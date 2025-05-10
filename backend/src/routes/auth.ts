import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AppDataSource } from '../index'
import { User } from '../entities/User'

const router = Router()

// Register new user
router.post('/register', async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User)
    const { username, password } = req.body

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create new user
    const user = userRepository.create({
      username,
      passwordHash,
      eloScore: 1000, // Initial ELO score
    })

    await userRepository.save(user)

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    )

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        eloScore: user.eloScore,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Error registering user' })
  }
})

// Login user
router.post('/login', async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User)
    const { username, password } = req.body

    // Find user
    const user = await userRepository.findOne({ where: { username } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        eloScore: user.eloScore,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Error logging in' })
  }
})

export default router 