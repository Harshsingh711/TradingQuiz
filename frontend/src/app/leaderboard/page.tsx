'use client'

import { useEffect, useState, CSSProperties } from 'react'
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

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      console.log('Fetching leaderboard from API...')
      const response = await axios.get('/api/leaderboard')
      console.log('Leaderboard response:', response.data)
      setLeaderboard(response.data)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
    
    // Set up automatic refresh every 10 seconds (more frequent)
    const interval = setInterval(fetchLeaderboard, 10000)
    
    // Refresh when the page becomes visible (user returns from quiz)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchLeaderboard()
      }
    }
    
    // Refresh when the window gains focus (user switches back to tab)
    const handleFocus = () => {
      fetchLeaderboard()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const pageContainerStyle: CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '3rem 1rem'
  }

  const containerStyle: CSSProperties = {
    maxWidth: '56rem',
    margin: '0 auto',
    padding: '0 1rem'
  }

  const cardStyle: CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden'
  }

  const loadingCardStyle: CSSProperties = {
    ...cardStyle,
    padding: '2rem',
    textAlign: 'center' as const
  }

  const loadingSpinnerStyle: CSSProperties = {
    height: '3rem',
    width: '3rem',
    borderRadius: '9999px',
    borderBottom: '2px solid #2563eb',
    animation: 'spin 1s linear infinite',
    margin: '0 auto'
  }

  const loadingTextStyle: CSSProperties = {
    marginTop: '1rem',
    color: '#4b5563',
    fontWeight: '500'
  }

  const headerStyle: CSSProperties = {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }

  const titleStyle: CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#111827'
  }

  const subtitleStyle: CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280'
  }

  const emptyStateStyle: CSSProperties = {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#6b7280'
  }

  const tableHeaderStyle: CSSProperties = {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f9fafb',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#6b7280'
  }

  const tableRowStyle = (index: number): CSSProperties => ({
    padding: '1rem 1.5rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    alignItems: 'center',
    borderBottom: '1px solid #f3f4f6',
    backgroundColor: index < 3 ? '#eff6ff' : 'white'
  })

  const rankContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center'
  }

  const topRankStyle = (position: number): CSSProperties => ({
    width: '2rem',
    height: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    color: 'white',
    fontWeight: 'bold',
    backgroundColor: position === 0 ? '#eab308' : position === 1 ? '#9ca3af' : '#b45309'
  })

  const regularRankStyle: CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#4b5563',
    width: '2rem'
  }

  const usernameStyle: CSSProperties = {
    fontWeight: '500',
    color: '#111827'
  }

  const scoreStyle: CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#2563eb',
    textAlign: 'right' as const
  }

  const refreshButtonStyle: CSSProperties = {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }

  if (loading) {
    return (
      <div style={pageContainerStyle}>
        <div style={containerStyle}>
          <div style={loadingCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={loadingSpinnerStyle}></div>
            </div>
            <p style={loadingTextStyle}>Loading leaderboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={pageContainerStyle}>
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={headerStyle}>
            <div>
              <h1 style={titleStyle}>Leaderboard</h1>
              <p style={subtitleStyle}>Top traders ranked by ELO score</p>
            </div>
            <button 
              onClick={fetchLeaderboard}
              disabled={loading}
              style={{
                ...refreshButtonStyle,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
          
          {leaderboard.length === 0 ? (
            <div style={emptyStateStyle}>
              No data available yet. Be the first to take a quiz!
            </div>
          ) : (
            <div>
              {/* Header row */}
              <div style={tableHeaderStyle}>
                <div>Rank</div>
                <div>Username</div>
                <div style={{ textAlign: 'right' }}>ELO Score</div>
              </div>
              
              {/* Leaderboard entries */}
              {leaderboard.map((entry, index) => (
                <div 
                  key={entry.id} 
                  style={tableRowStyle(index)}
                >
                  <div style={rankContainerStyle}>
                    {index < 3 ? (
                      <span style={topRankStyle(index)}>
                        {entry.rank}
                      </span>
                    ) : (
                      <span style={regularRankStyle}>
                        #{entry.rank}
                      </span>
                    )}
                  </div>
                  <div style={usernameStyle}>{entry.username}</div>
                  <div style={scoreStyle}>
                    {entry.eloScore}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 