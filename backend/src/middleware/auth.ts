import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface AuthRequest extends Request {
  user?: {
    userId: string
  }
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string
    }
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' })
  }
} 