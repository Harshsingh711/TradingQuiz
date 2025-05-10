'use client';

import { useAuth } from './context/AuthContext';
import { CSSProperties } from 'react';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  const containerStyle: CSSProperties = {
    position: 'relative',
    padding: '2rem 1rem'
  };

  const heroContainerStyle: CSSProperties = {
    maxWidth: '1024px',
    margin: '0 auto',
    padding: '4rem 1rem'
  };

  const headingStyle: CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: '1.5rem'
  };

  const accentStyle: CSSProperties = {
    color: '#2563eb'
  };

  const paragraphStyle: CSSProperties = {
    fontSize: '1.125rem',
    lineHeight: 1.75,
    color: '#4b5563',
    textAlign: 'center',
    maxWidth: '42rem',
    margin: '0 auto',
    marginBottom: '2.5rem'
  };

  const buttonGroupStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '3rem'
  };

  const buttonStyle: CSSProperties = {
    display: 'inline-block',
    backgroundColor: 'white',
    color: '#1f2937',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    padding: '0.75rem 1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    minWidth: '12rem'
  };

  const primaryButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    color: 'white'
  };

  const userCardStyle: CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    maxWidth: '24rem',
    margin: '0 auto',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  };

  const userCardHeaderStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  };

  const userInfoStyle: CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937'
  };

  const eloContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginTop: '0.5rem'
  };

  const eloLabelStyle: CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginRight: '0.5rem'
  };

  const eloValueStyle: CSSProperties = {
    fontWeight: 'bold',
    color: '#2563eb'
  };

  const eloRankStyle: CSSProperties = {
    fontSize: '0.75rem',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    marginLeft: '0.5rem'
  };

  const avatarStyle: CSSProperties = {
    width: '3rem',
    height: '3rem',
    backgroundColor: '#dbeafe',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: '1.25rem'
  };

  const userCardFooterStyle: CSSProperties = {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #f3f4f6',
    textAlign: 'right' as const
  };

  const linkStyle: CSSProperties = {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500'
  };

  const featuresContainerStyle: CSSProperties = {
    backgroundColor: '#f9fafb',
    padding: '4rem 1rem'
  };

  const featuresHeadingStyle: CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center' as const,
    marginBottom: '0.75rem'
  };

  const featuresSubheadingStyle: CSSProperties = {
    fontSize: '1.125rem',
    color: '#4b5563',
    textAlign: 'center' as const,
    marginBottom: '3rem'
  };

  const featuresGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    maxWidth: '1024px',
    margin: '0 auto'
  };

  const featureCardStyle: CSSProperties = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  };

  const featureIconStyle: CSSProperties = {
    width: '3rem',
    height: '3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
    color: '#2563eb',
    borderRadius: '0.5rem',
    marginBottom: '1rem'
  };

  const featureTitleStyle: CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.5rem'
  };

  const featureDescriptionStyle: CSSProperties = {
    color: '#6b7280'
  };

  return (
    <div style={containerStyle}>
      <div style={heroContainerStyle}>
        <h1 style={headingStyle}>
          Test Your Trading <span style={accentStyle}>Skills</span>
        </h1>
        <p style={paragraphStyle}>
          Challenge yourself with our interactive trading quiz. Predict market movements,
          compete with others, and climb the leaderboard. Start your trading journey today!
        </p>
        
        <div style={buttonGroupStyle}>
          {isAuthenticated ? (
            <>
              <a href="/quiz" style={primaryButtonStyle}>
                Start Quiz
              </a>
              <a href="/leaderboard" style={buttonStyle}>
                View Leaderboard
              </a>
            </>
          ) : (
            <>
              <a href="/auth/register" style={primaryButtonStyle}>
                Register Now
              </a>
              <a href="/auth/login" style={buttonStyle}>
                Log In
              </a>
            </>
          )}
        </div>
        
        {/* User Welcome Card */}
        {isAuthenticated && user && (
          <div style={userCardStyle}>
            <div style={userCardHeaderStyle}>
              <div>
                <div style={userInfoStyle}>Welcome back, {user.username}!</div>
                <div style={eloContainerStyle}>
                  <span style={eloLabelStyle}>ELO Score:</span>
                  <span style={eloValueStyle}>{user.eloScore}</span>
                  <span style={eloRankStyle}>
                    {user.eloScore === 0 ? 'New Player' : 
                     user.eloScore < 1000 ? 'Beginner' : 
                     user.eloScore < 1200 ? 'Intermediate' : 
                     user.eloScore < 1500 ? 'Advanced' : 'Expert'}
                  </span>
                </div>
              </div>
              <div style={avatarStyle}>
                {user.username.substring(0, 2).toUpperCase()}
              </div>
            </div>
            <div style={userCardFooterStyle}>
              <a href="/profile" style={linkStyle}>
                View Full Profile →
              </a>
            </div>
          </div>
        )}
      </div>
      
      {/* Features Section */}
      <div style={featuresContainerStyle}>
        <div>
          <h2 style={featuresHeadingStyle}>Features</h2>
          <p style={featuresSubheadingStyle}>Everything you need to enhance your trading skills</p>
          
          <div style={featuresGridStyle}>
            <div style={featureCardStyle}>
              <div style={featureIconStyle}>
                📊
              </div>
              <h3 style={featureTitleStyle}>Real Market Charts</h3>
              <p style={featureDescriptionStyle}>Quiz yourself with real market data and historical charts.</p>
            </div>
            
            <div style={featureCardStyle}>
              <div style={featureIconStyle}>
                📈
              </div>
              <h3 style={featureTitleStyle}>ELO Rating System</h3>
              <p style={featureDescriptionStyle}>Earn points based on successful predictions and track your progress.</p>
            </div>
            
            <div style={featureCardStyle}>
              <div style={featureIconStyle}>
                🏆
              </div>
              <h3 style={featureTitleStyle}>Global Leaderboard</h3>
              <p style={featureDescriptionStyle}>Compete with traders worldwide and climb the ranking ladder.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 