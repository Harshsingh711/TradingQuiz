import { Router } from 'express'
import { AppDataSource } from '../index'
import { User } from '../entities/User'

const router = Router()

// Get leaderboard
router.get('/', async (_req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User)
    
    console.log('Fetching leaderboard data...')
    
    const users = await userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.eloScore'])
      .orderBy('user.eloScore', 'DESC')
      .take(100)
      .getMany()

    console.log(`Found ${users.length} users for leaderboard`)
    console.log('Top 5 users:', users.slice(0, 5).map(u => ({ username: u.username, elo: u.eloScore })))

    const leaderboard = users.map((user, index) => ({
      id: user.id,
      username: user.username,
      eloScore: user.eloScore,
      rank: index + 1,
    }))

    return res.json(leaderboard)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return res.status(500).json({ error: 'Error fetching leaderboard' })
  }
})

export default router 