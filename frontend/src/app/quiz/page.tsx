'use client'

import { useState, CSSProperties, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import CandlestickChart from '../components/CandlestickChart'

export default function Quiz() {
  const { isAuthenticated } = useAuth();
  const [decision, setDecision] = useState<'buy' | 'sell' | 'wait' | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [isResultRevealed, setIsResultRevealed] = useState(false);
  const [result, setResult] = useState<'up' | 'down' | null>(null);

  const handleDecision = (action: 'buy' | 'sell' | 'wait') => {
    setDecision(action);
    console.log(`User decided to ${action}`);
    
    // Reveal the chart after user makes a decision
    if (typeof window !== 'undefined' && (window as any).__revealChart) {
      const revealed = (window as any).__revealChart();
      if (revealed) {
        setIsResultRevealed(true);
        
        // For demonstration, randomly determine if they were right or wrong
        // In a real implementation, this would compare with the actual future price
        const randomResult = Math.random() > 0.5 ? 'up' : 'down';
        setResult(randomResult);
      }
    }
  };

  const getResultMessage = () => {
    if (!result) return '';
    
    if (
      (decision === 'buy' && result === 'up') || 
      (decision === 'sell' && result === 'down')
    ) {
      return 'Your prediction was correct! The price moved as you expected.';
    } else if (decision === 'wait') {
      return 'You decided to wait. No points gained or lost.';
    } else {
      return 'Your prediction was incorrect. The price moved against your expectation.';
    }
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
    borderRadius: '0.375rem',
    overflow: 'hidden',
    minHeight: '450px'
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
        {/* Left side - BTC Chart with Historical Point (2/3 width) */}
        <div style={chartSectionStyle}>
          <CandlestickChart
            height={450}
            onReady={(ready) => setIsChartReady(ready)}
          />
        </div>
        
        {/* Right side - Trading Actions (1/3 width) */}
        <div style={actionSectionStyle}>
          <div>
            <h2 style={actionTitleStyle}>What's your decision?</h2>
            <p style={actionDescriptionStyle}>
              Based on the historical BTC price shown, would you buy, sell, or wait?
              {isChartReady ? 
                " The chart shows price up to a specific point in time. Make your decision!" : 
                " Loading chart data..."}
            </p>
          </div>
          
          <div style={buttonContainerStyle}>
            <button 
              style={{
                ...buyButtonStyle,
                opacity: decision || !isChartReady ? 0.7 : 1,
                cursor: decision || !isChartReady ? 'not-allowed' : 'pointer'
              }}
              onClick={() => !decision && isChartReady && handleDecision('buy')}
              disabled={!!decision || !isChartReady}
            >
              Buy
            </button>
            
            <button 
              style={{
                ...waitButtonStyle,
                opacity: decision || !isChartReady ? 0.7 : 1,
                cursor: decision || !isChartReady ? 'not-allowed' : 'pointer'
              }}
              onClick={() => !decision && isChartReady && handleDecision('wait')}
              disabled={!!decision || !isChartReady}
            >
              Wait
            </button>
            
            <button 
              style={{
                ...sellButtonStyle,
                opacity: decision || !isChartReady ? 0.7 : 1,
                cursor: decision || !isChartReady ? 'not-allowed' : 'pointer'
              }}
              onClick={() => !decision && isChartReady && handleDecision('sell')}
              disabled={!!decision || !isChartReady}
            >
              Sell
            </button>
          </div>
          
          {decision && (
            <div style={resultStyle}>
              <p>You decided to <strong>{decision}</strong></p>
              
              {!isResultRevealed ? (
                <p>Revealing the price movement...</p>
              ) : (
                <>
                  <p>The price went <strong>{result === 'up' ? 'UP ↑' : 'DOWN ↓'}</strong></p>
                  <p style={{ marginTop: '10px' }}>{getResultMessage()}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 