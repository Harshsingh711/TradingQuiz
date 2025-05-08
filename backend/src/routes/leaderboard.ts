import { Router } from 'express'
import { AppDataSource } from '../index'
import { User } from '../entities/User'

const router = Router()
const userRepository = AppDataSource.getRepository(User)

// Get leaderboard
router.get('/', async (req, res) => {
  try {
    const users = await userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.eloScore'])
      .orderBy('user.eloScore', 'DESC')
      .take(100)
      .getMany()

    const leaderboard = users.map((user, index) => ({
      id: user.id,
      username: user.username,
      eloScore: user.eloScore,
      rank: index + 1,
    }))

    res.json(leaderboard)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    res.status(500).json({ error: 'Error fetching leaderboard' })
  }
})

export default router 