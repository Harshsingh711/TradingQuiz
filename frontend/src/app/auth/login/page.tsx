'use client';

import { useState, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      // Check if response is ok and has content
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Backend server not found. Please check if the backend is running.');
        }
        
        // Try to parse error response
        let errorMessage = 'Failed to login';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid response from server');
      }

      const data = await response.json();

      // Use the auth context login function
      login(data.token, data.user);

      // Redirect to profile instead of home
      router.push('/profile');
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  // Inline styles
  const pageContainerStyle: CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: '3rem 1rem'
  };

  const formCardStyle: CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '2rem',
    width: '100%',
    maxWidth: '28rem',
    border: '1px solid #f3f4f6'
  };

  const headerContainerStyle: CSSProperties = {
    textAlign: 'center',
    marginBottom: '2rem'
  };

  const titleStyle: CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: '0.5rem'
  };

  const subtitleStyle: CSSProperties = {
    fontSize: '1rem',
    color: '#6b7280'
  };

  const errorContainerStyle: CSSProperties = {
    backgroundColor: '#fee2e2',
    border: '1px solid #f87171',
    color: '#b91c1c',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    marginBottom: '1.5rem',
    fontSize: '0.875rem'
  };

  const errorTitleStyle: CSSProperties = {
    fontWeight: '600',
    marginBottom: '0.25rem'
  };

  const formStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  };

  const inputGroupStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column'
  };

  const labelStyle: CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem'
  };

  const inputStyle: CSSProperties = {
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid #d1d5db',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    fontSize: '1rem',
    width: '100%',
    color: '#1f2937',
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    outline: 'none'
  };

  const submitButtonStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '0.5rem',
    border: 'none',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.15s ease-in-out',
    opacity: loading ? 0.7 : 1,
    marginTop: '0.5rem'
  };

  const footerStyle: CSSProperties = {
    textAlign: 'center',
    marginTop: '2rem',
    fontSize: '0.875rem',
    color: '#6b7280'
  };

  const linkStyle: CSSProperties = {
    color: '#2563eb',
    fontWeight: '500',
    textDecoration: 'none',
    transition: 'color 0.15s ease-in-out'
  };

  const spinnerContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center'
  };

  const spinnerStyle: CSSProperties = {
    marginRight: '0.75rem',
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: '9999px',
    borderTop: '2px solid transparent',
    borderRight: '2px solid transparent',
    borderBottom: '2px solid transparent',
    borderLeft: '2px solid currentColor',
    animation: 'spin 1s linear infinite'
  };

  return (
    <div style={pageContainerStyle}>
      <div style={formCardStyle}>
        <div style={headerContainerStyle}>
          <h2 style={titleStyle}>Welcome Back</h2>
          <p style={subtitleStyle}>Sign in to continue to Trading Quiz</p>
        </div>
        
        {error && (
          <div style={errorContainerStyle}>
            <p style={errorTitleStyle}>Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroupStyle}>
            <label htmlFor="username" style={labelStyle}>
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              style={submitButtonStyle}
            >
              {loading ? (
                <span style={spinnerContainerStyle}>
                  <span style={spinnerStyle}></span>
                  Logging in...
                </span>
              ) : 'Sign In'}
            </button>
          </div>
        </form>
        
        <div style={footerStyle}>
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" style={linkStyle}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 