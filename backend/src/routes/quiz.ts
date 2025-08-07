import { Router, Request, Response } from 'express'
import { AppDataSource } from '../index'
import { Chart } from '../entities/Chart'
import { Quiz } from '../entities/Quiz'
import { User } from '../entities/User'
import { authenticateToken } from '../middleware/auth'
import axios from 'axios'

const router = Router()

// Define the AuthRequest interface to match middleware/auth.ts
interface AuthRequest extends Request {
  user?: {
    userId: string
  }
}

// Get BTC historical data for the quiz
router.get('/btc-history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Get query parameters
    const { days = '180' } = req.query;
    const daysAgo = parseInt(days as string, 10);
    
    // Calculate time range
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (daysAgo * 24 * 60 * 60);
    
    // Fetch data from CoinGecko API
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range`, {
      params: {
        vs_currency: 'usd',
        from: startTime,
        to: endTime
      }
    });
    
    // Process and transform data
    const priceData = response.data.prices.map((item: [number, number]) => {
      return {
        time: item[0] / 1000, // Convert from milliseconds to seconds
        value: item[1] // Price in USD
      };
    });
    
    // Send the data
    res.json({
      symbol: 'BTCUSD',
      data: priceData
    });
  } catch (error) {
    console.error('Error fetching BTC data:', error);
    res.status(500).json({ error: 'Error fetching BTC price data' });
  }
});

// Get random chart for quiz
router.get('/random', authenticateToken, async (_req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const chartRepository = AppDataSource.getRepository(Chart)
    
    const chart = await chartRepository
      .createQueryBuilder('chart')
      .orderBy('RANDOM()')
      .getOne()

    if (!chart) {
      return res.status(404).json({ error: 'No charts available' })
    }

    return res.json({
      id: chart.id,
      chartImageUrl: chart.chartImageUrl,
      assetName: chart.assetName,
      timeframe: chart.timeframe,
    })
  } catch (error) {
    console.error('Error fetching random chart:', error)
    return res.status(500).json({ error: 'Error fetching chart' })
  }
})

// Submit quiz prediction
router.post('/submit', authenticateToken, async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const chartRepository = AppDataSource.getRepository(Chart)
    const quizRepository = AppDataSource.getRepository(Quiz)
    const userRepository = AppDataSource.getRepository(User)
    
    const { chartId, prediction } = req.body
    const userId = req.user?.userId

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

    return res.json({
      correct: isCorrect,
      eloChange,
      newEloScore: user.eloScore,
    })
  } catch (error) {
    console.error('Error submitting quiz:', error)
    return res.status(500).json({ error: 'Error submitting quiz' })
  }
})

// Helper function to calculate ELO change
function calculateEloChange(_currentElo: number, isCorrect: boolean): number {
  const K = 32 // K-factor for ELO calculation
  const expectedScore = 0.5 // Expected score for a random prediction
  const actualScore = isCorrect ? 1 : 0
  const eloChange = Math.round(K * (actualScore - expectedScore))
  return eloChange
}

export default router 