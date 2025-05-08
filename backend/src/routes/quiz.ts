import { Router } from 'express'
import { AppDataSource } from '../index'
import { Chart } from '../entities/Chart'
import { Quiz } from '../entities/Quiz'
import { User } from '../entities/User'
import { authenticateToken } from '../middleware/auth'

const router = Router()
const chartRepository = AppDataSource.getRepository(Chart)
const quizRepository = AppDataSource.getRepository(Quiz)
const userRepository = AppDataSource.getRepository(User)

// Get random chart for quiz
router.get('/random', authenticateToken, async (req, res) => {
  try {
    const chart = await chartRepository
      .createQueryBuilder('chart')
      .orderBy('RANDOM()')
      .getOne()

    if (!chart) {
      return res.status(404).json({ error: 'No charts available' })
    }

    res.json({
      id: chart.id,
      chartImageUrl: chart.chartImageUrl,
      assetName: chart.assetName,
      timeframe: chart.timeframe,
    })
  } catch (error) {
    console.error('Error fetching random chart:', error)
    res.status(500).json({ error: 'Error fetching chart' })
  }
})

// Submit quiz prediction
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { chartId, prediction } = req.body
    const userId = req.user.userId

    // Get chart and user
    const chart = await chartRepository.findOne({ where: { id: chartId } })
    const user = await userRepository.findOne({ where: { id: userId } })

    if (!chart || !user) {
      return res.status(404).json({ error: 'Chart or user not found' })
    }

    // Calculate ELO change
    const isCorrect = prediction === chart.result
    const eloChange = calculateEloChange(user.eloScore, isCorrect)

    // Update user's ELO score
    user.eloScore += eloChange
    await userRepository.save(user)

    // Create quiz record
    const quiz = quizRepository.create({
      user,
      chart,
      prediction,
      result: chart.result,
      eloChange,
    })
    await quizRepository.save(quiz)

    res.json({
      correct: isCorrect,
      eloChange,
      newEloScore: user.eloScore,
    })
  } catch (error) {
    console.error('Error submitting quiz:', error)
    res.status(500).json({ error: 'Error submitting quiz' })
  }
})

// Helper function to calculate ELO change
function calculateEloChange(currentElo: number, isCorrect: boolean): number {
  const K = 32 // K-factor for ELO calculation
  const expectedScore = 0.5 // Expected score for a random prediction
  const actualScore = isCorrect ? 1 : 0
  const eloChange = Math.round(K * (actualScore - expectedScore))
  return eloChange
}

export default router 