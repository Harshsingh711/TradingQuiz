'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

interface UserProfile {
  id: string
  username: string
  eloScore: number
  totalQuizzes: number
  correctPredictions: number
  winRate: number
  rank: number
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/profile/me')
        setProfile(response.data)
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile</h1>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="text-lg font-medium text-gray-900">{profile.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Global Rank</p>
                  <p className="text-lg font-medium text-gray-900">#{profile.rank}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ELO Score</p>
                  <p className="text-lg font-medium text-primary-600">{profile.eloScore}</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Total Quizzes</p>
                  <p className="text-lg font-medium text-gray-900">{profile.totalQuizzes}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Correct Predictions</p>
                  <p className="text-lg font-medium text-gray-900">{profile.correctPredictions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Win Rate</p>
                  <p className="text-lg font-medium text-gray-900">{profile.winRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 