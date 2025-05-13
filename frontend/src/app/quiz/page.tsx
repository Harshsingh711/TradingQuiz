'use client'

import { useState, CSSProperties } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Quiz() {
  const { isAuthenticated } = useAuth();
  const [decision, setDecision] = useState<'buy' | 'sell' | 'wait' | null>(null);

  const handleDecision = (action: 'buy' | 'sell' | 'wait') => {
    setDecision(action);
    console.log(`User decided to ${action}`);
  };

  // Styles
  const pageContainerStyle: CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '1.5rem 1rem'
  };

  const headingStyle: CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '1.5rem'
  };

  const contentContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: '2rem',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    padding: '1.5rem',
    overflow: 'hidden'
  };

  const chartSectionStyle: CSSProperties = {
    flex: '2',
    backgroundColor: '#f3f4f6',
    borderRadius: '0.375rem',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    color: '#6b7280',
    fontSize: '1rem',
    fontWeight: '500',
    border: '2px dashed #d1d5db'
  };

  const actionSectionStyle: CSSProperties = {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem'
  };

  const actionTitleStyle: CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '1rem'
  };

  const actionDescriptionStyle: CSSProperties = {
    fontSize: '1rem',
    color: '#4b5563',
    marginBottom: '2rem',
    lineHeight: '1.5'
  };

  const buttonContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    gap: '1.5rem'
  };

  const buyButtonStyle: CSSProperties = {
    width: '100%',
    padding: '1.25rem',
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    textAlign: 'center'
  };

  const sellButtonStyle: CSSProperties = {
    width: '100%',
    padding: '1.25rem',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    textAlign: 'center'
  };

  const waitButtonStyle: CSSProperties = {
    width: '80%',
    padding: '0.75rem',
    backgroundColor: '#f59e0b',
    color: 'white',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    textAlign: 'center'
  };

  const resultStyle: CSSProperties = {
    marginTop: '2rem',
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#f3f4f6',
    borderRadius: '0.375rem'
  };

  // For authenticated users only
  if (!isAuthenticated) {
    return (
      <div style={pageContainerStyle}>
        <h1 style={headingStyle}>Trading Quiz</h1>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Sign In Required
          </h2>
          <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
            You need to be logged in to access the trading quiz.
          </p>
          <a 
            href="/auth/login"
            style={{
              display: 'inline-block',
              backgroundColor: '#3b82f6',
              color: 'white',
              fontWeight: 'bold',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              textDecoration: 'none'
            }}
          >
            Log in to continue
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainerStyle}>
      <h1 style={headingStyle}>Trading Quiz</h1>
      
      <div style={contentContainerStyle}>
        {/* Left side - Chart placeholder (2/3 width) */}
        <div style={chartSectionStyle}>
          <div>
            <p style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Chart Placeholder</p>
            <p style={{ fontSize: '0.875rem', opacity: 0.7, textAlign: 'center' }}>
              The BTC/USD price chart will be displayed here
            </p>
          </div>
        </div>
        
        {/* Right side - Trading Actions (1/3 width) */}
        <div style={actionSectionStyle}>
          <div>
            <h2 style={actionTitleStyle}>What's your decision?</h2>
            <p style={actionDescriptionStyle}>
              Based on the chart analysis, would you buy, sell, or wait?
            </p>
          </div>
          
          <div style={buttonContainerStyle}>
            <button 
              style={buyButtonStyle}
              onClick={() => handleDecision('buy')}
            >
              Buy
            </button>
            
            <button 
              style={waitButtonStyle}
              onClick={() => handleDecision('wait')}
            >
              Wait
            </button>
            
            <button 
              style={sellButtonStyle}
              onClick={() => handleDecision('sell')}
            >
              Sell
            </button>
          </div>
          
          {decision && (
            <div style={resultStyle}>
              <p>You decided to <strong>{decision}</strong></p>
              <p>This feature is currently for demonstration purposes only.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 