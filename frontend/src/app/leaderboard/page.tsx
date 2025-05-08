'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

interface LeaderboardEntry {
  id: string
  username: string
  eloScore: number
  rank: number
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('/api/leaderboard')
        setLeaderboard(response.data)
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        </div>
        <div className="divide-y divide-gray-200">
          {leaderboard.map((entry) => (
            <div key={entry.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-900 w-8">
                  #{entry.rank}
                </span>
                <span className="ml-4 text-gray-900">{entry.username}</span>
              </div>
              <span className="text-lg font-semibold text-primary-600">
                {entry.eloScore}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 