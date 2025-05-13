'use client';

import { useAuth } from '../context/AuthContext';
import { CSSProperties } from 'react';

export default function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  
  const navStyle: CSSProperties = {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '0.5rem 0'
  };
  
  const containerStyle: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '4rem'
  };
  
  const logoStyle: CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#2563eb',
    textDecoration: 'none'
  };
  
  const navLinksStyle: CSSProperties = {
    display: 'flex',
    gap: '1.5rem'
  };
  
  const linkStyle: CSSProperties = {
    color: '#4b5563',
    textDecoration: 'none',
    fontWeight: '500'
  };
  
  const activeLinkStyle: CSSProperties = {
    ...linkStyle,
    color: '#1f2937',
    borderBottom: '2px solid #2563eb'
  };
  
  const userInfoStyle: CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280'
  };
  
  const buttonStyle: CSSProperties = {
    backgroundColor: 'transparent',
    border: '1px solid #d1d5db',
    color: '#4b5563',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none'
  };
  
  const primaryButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    color: 'white'
  };
  
  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <a href="/" style={logoStyle}>
            Trading Quiz
          </a>
          <div style={navLinksStyle}>
            <a href="/" style={window.location.pathname === '/' ? activeLinkStyle : linkStyle}>
              Home
            </a>
            {isAuthenticated && (
              <>
                <a href="/quiz" style={window.location.pathname === '/quiz' ? activeLinkStyle : linkStyle}>
                  Quiz
                </a>
                <a href="/leaderboard" style={window.location.pathname === '/leaderboard' ? activeLinkStyle : linkStyle}>
                  Leaderboard
                </a>
              </>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {isAuthenticated ? (
            <>
              {user && (
                <div style={userInfoStyle}>
                  {user.username} | ELO: {user.eloScore}
                </div>
              )}
              <a href="/profile" style={window.location.pathname === '/profile' ? activeLinkStyle : linkStyle}>
                Profile
              </a>
              <button onClick={logout} style={buttonStyle}>
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/auth/login" style={buttonStyle}>
                Login
              </a>
              <a href="/auth/register" style={primaryButtonStyle}>
                Register
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 