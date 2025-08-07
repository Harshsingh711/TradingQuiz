import { Router, Request, Response } from 'express'
import { AppDataSource } from '../index'
import { User } from '../entities/User'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Define the AuthRequest interface to match middleware/auth.ts
interface AuthRequest extends Request {
  user?: {
    userId: string
  }
}

// Get user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userRepository = AppDataSource.getRepository(User)
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

    return res.json({
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
    return res.status(500).json({ error: 'Error fetching profile' })
  }
})

// Update user ELO score
router.put('/elo', authenticateToken, async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    console.log('ELO update request received:', {
      userId: req.user?.userId,
      requestBody: req.body,
      headers: req.headers.authorization ? 'Bearer token present' : 'No auth header'
    });
    
    const userRepository = AppDataSource.getRepository(User)
    const userId = req.user?.userId
    const { eloScore } = req.body

    if (typeof eloScore !== 'number') {
      console.error('Invalid ELO score type:', typeof eloScore, eloScore);
      return res.status(400).json({ error: 'Invalid ELO score' })
    }

    const user = await userRepository.findOne({
      where: { id: userId },
    })

    if (!user) {
      console.error('User not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' })
    }

    console.log('Updating user ELO:', {
      username: user.username,
      oldElo: user.eloScore,
      newElo: eloScore
    });

    // Update the user's ELO score
    user.eloScore = eloScore
    await userRepository.save(user)

    console.log('ELO update successful:', {
      username: user.username,
      newElo: user.eloScore
    });

    return res.json({
      id: user.id,
      username: user.username,
      eloScore: user.eloScore,
    })
  } catch (error) {
    console.error('Error updating ELO score:', error)
    return res.status(500).json({ error: 'Error updating ELO score' })
  }
})

export default router 