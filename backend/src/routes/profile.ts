import { Router } from 'express'
import { AppDataSource } from '../index'
import { User } from '../entities/User'
import { authenticateToken } from '../middleware/auth'

const router = Router()
const userRepository = AppDataSource.getRepository(User)

// Get user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['quizzes'],
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get user's rank
    const rank = await userRepository
      .createQueryBuilder('user')
      .where('user.eloScore > :eloScore', { eloScore: user.eloScore })
      .getCount()

    res.json({
      id: user.id,
      username: user.username,
      eloScore: user.eloScore,
      totalQuizzes: user.getTotalQuizzes(),
      correctPredictions: user.getCorrectPredictions(),
      winRate: user.getWinRate(),
      rank: rank + 1,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    res.status(500).json({ error: 'Error fetching profile' })
  }
})

export default router 