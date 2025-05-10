'use client';

import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();

  const navStyle = {
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '0.5rem 0'
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '4rem'
  };

  const logoStyle = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#2563eb',
    textDecoration: 'none'
  };

  const navGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem'
  };

  const linkStyle = {
    color: '#4b5563',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '0.25rem 0',
    borderBottom: '2px solid transparent'
  };

  const activeStyle = {
    ...linkStyle,
    borderBottomColor: '#2563eb',
    color: '#1f2937'
  };

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: '#4b5563',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontWeight: '500',
    fontSize: '0.875rem',
    cursor: 'pointer',
    textDecoration: 'none'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    color: 'white'
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <div style={navGroupStyle}>
          <a href="/" style={logoStyle}>
            Trading Quiz
          </a>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="/" style={window.location.pathname === '/' ? activeStyle : linkStyle}>
              Home
            </a>
            {isAuthenticated && (
              <>
                <a href="/quiz" style={window.location.pathname === '/quiz' ? activeStyle : linkStyle}>
                  Quiz
                </a>
                <a href="/leaderboard" style={window.location.pathname === '/leaderboard' ? activeStyle : linkStyle}>
                  Leaderboard
                </a>
              </>
            )}
          </div>
        </div>

        <div style={navGroupStyle}>
          {isAuthenticated ? (
            <>
              {user && (
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {user.username} | ELO: {user.eloScore}
                </div>
              )}
              <a href="/profile" style={window.location.pathname === '/profile' ? activeStyle : linkStyle}>
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