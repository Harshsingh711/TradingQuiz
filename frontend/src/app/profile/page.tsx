'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import Link from 'next/link'

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
  const { token, user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error)
        // If API fails, at least show the basic user info from auth context
        if (user) {
          setProfile({
            id: user.id,
            username: user.username,
            eloScore: user.eloScore || 0,
            totalQuizzes: 0,
            correctPredictions: 0,
            winRate: 0,
            rank: 0
          });
        }
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchProfile()
    }
  }, [token, user])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ 
          border: '4px solid #3b82f6', 
          borderTopColor: 'transparent',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          margin: '0 auto',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '1rem', color: '#4b5563' }}>Loading profile...</p>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '1rem',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Profile</h1>
        <p>Unable to load profile data. Please try again later.</p>
        <button 
          onClick={() => setLoading(true)}
          style={{
            marginTop: '1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '1rem' 
    }}>
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          color: 'white'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Your Profile</h1>
          <p style={{ opacity: 0.8, marginTop: '0.25rem' }}>Track your trading performance</p>
        </div>
        
        {/* ELO Score Section */}
        <div style={{ 
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#6b7280',
            fontWeight: '600'
          }}>
            Your ELO Rating
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2563eb' }}>
              {profile.eloScore}
            </div>
            <div style={{ 
              marginLeft: '0.5rem',
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              textTransform: 'uppercase'
            }}>
              {profile.eloScore === 0 ? 'New Player' : 
               profile.eloScore < 1000 ? 'Beginner' : 
               profile.eloScore < 1200 ? 'Intermediate' : 
               profile.eloScore < 1500 ? 'Advanced' : 'Expert'}
            </div>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            {profile.rank > 0 ? `Rank #${profile.rank} on the leaderboard` : 'Not yet ranked'}
          </div>
        </div>
        
        {/* Content Section */}
        <div style={{ padding: '1.5rem' }}>
          {/* User Info and Stats Grid */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* User Information */}
            <div style={{ 
              backgroundColor: '#f9fafb',
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <h2 style={{ 
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '1rem'
              }}>
                User Information
              </h2>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Username</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>
                  {profile.username}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Account Status</p>
                <p style={{ 
                  display: 'inline-block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  backgroundColor: '#d1fae5',
                  color: '#047857',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '9999px'
                }}>
                  Active
                </p>
              </div>
            </div>
            
            {/* Quiz Statistics */}
            <div style={{ 
              backgroundColor: '#f9fafb',
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <h2 style={{ 
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '1rem'
              }}>
                Quiz Statistics
              </h2>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Quizzes</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>
                    {profile.totalQuizzes || 0}
                  </p>
                </div>
                <div style={{ 
                  height: '2.5rem',
                  width: '2.5rem',
                  backgroundColor: '#dbeafe',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#2563eb', fontWeight: 'bold' }}>
                    {profile.totalQuizzes || 0}
                  </span>
                </div>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Correct Predictions</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>
                    {profile.correctPredictions || 0}
                  </p>
                </div>
                <div style={{ 
                  height: '2.5rem',
                  width: '2.5rem',
                  backgroundColor: '#d1fae5',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#047857', fontWeight: 'bold' }}>
                    {profile.correctPredictions || 0}
                  </span>
                </div>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Win Rate</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>
                    {profile.winRate || 0}%
                  </p>
                </div>
                <div style={{ 
                  height: '2.5rem',
                  width: '2.5rem',
                  backgroundColor: '#fef3c7',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#b45309', fontWeight: 'bold' }}>
                    {profile.winRate || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            marginTop: '2rem',
            gap: '1rem'
          }}>
            <a 
              href="/quiz"
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}
            >
              Take a Quiz
            </a>
            <a 
              href="/leaderboard"
              style={{
                backgroundColor: '#e5e7eb',
                color: '#1f2937',
                fontWeight: 'bold',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}
            >
              View Leaderboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 