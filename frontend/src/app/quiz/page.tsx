'use client'

import { useState, CSSProperties } from 'react'
import { useAuth } from '../context/AuthContext'
import ChartReplay from '../components/ChartReplay'

export default function Quiz() {
  const { isAuthenticated } = useAuth();
  const [decision, setDecision] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [quizResult, setQuizResult] = useState<string | null>(null);
  const [chartHasData, setChartHasData] = useState(false);

  const handleDecision = (choice: string) => {
    setDecision(choice);
    setIsRevealed(true);
    
    // Simulate quiz result (in real app, compare with actual price movement)
    const outcomes = ['win', 'loss', 'breakeven'];
    const randomResult = outcomes[Math.floor(Math.random() * outcomes.length)];
    setQuizResult(randomResult);
  };

  const handleTradeComplete = (result: { 
    entryPrice: number, 
    exitPrice: number,
    profit: number, 
    percentChange: number,
    timeInTrade: number 
  }) => {
    console.log('Trade completed:', result);
    // Handle the trade result
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
    color: '#f3f4f6',
    marginBottom: '1.5rem'
  };

  const contentContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'row' as 'row',
    gap: '1.5rem',
    backgroundColor: '#1e1e30',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    overflow: 'hidden'
  };

  const chartSectionStyle: CSSProperties = {
    flex: '2',
    borderRadius: '0.375rem',
    overflow: 'hidden',
    height: '500px'
  };

  const actionSectionStyle: CSSProperties = {
    flex: '1',
    display: 'flex',
    flexDirection: 'column' as 'column',
    padding: '1rem'
  };

  const actionTitleStyle: CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#f3f4f6',
    marginBottom: '1rem'
  };

  const actionDescriptionStyle: CSSProperties = {
    fontSize: '1rem',
    color: '#4b5563',
    marginBottom: '2rem'
  };

  const buttonContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column' as 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    gap: '1rem'
  };

  const buyButtonStyle: CSSProperties = {
    width: '100%',
    padding: '1.25rem',
    backgroundColor: '#4CAF50',
    color: '#ffffff',
    borderRadius: '0.375rem',
    border: 'none',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    textAlign: 'center' as 'center'
  };

  const sellButtonStyle: CSSProperties = {
    width: '100%',
    padding: '1.25rem',
    backgroundColor: '#FF5252',
    color: '#ffffff',
    borderRadius: '0.375rem',
    border: 'none',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    textAlign: 'center' as 'center'
  };

  const waitButtonStyle: CSSProperties = {
    width: '80%',
    padding: '0.75rem',
    backgroundColor: '#FFC107',
    color: '#ffffff',
    borderRadius: '0.375rem',
    border: 'none',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    textAlign: 'center' as 'center'
  };

  const resultStyle: CSSProperties = {
    marginTop: '2rem',
    textAlign: 'center' as 'center',
    padding: '1rem',
    backgroundColor: '#2a2a3c',
    borderRadius: '0.375rem'
  };

  // For authenticated users only
  if (!isAuthenticated) {
    return (
      <div style={pageContainerStyle}>
        <h1 style={headingStyle}>Trading Quiz</h1>
        <div style={{
          backgroundColor: '#2a2a3c',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          padding: '2rem',
          textAlign: 'center' as 'center',
          color: '#f3f4f6'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Sign In Required
          </h2>
          <p style={{ marginBottom: '1.5rem', color: '#a0a0a0' }}>
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
          <ChartReplay 
            height={450}
            onReady={(hasData) => setChartHasData(hasData)}
            onTradeComplete={handleTradeComplete}
          />
        </div>
        
        {/* Right side - Quiz interface (1/3 width) */}
        <div style={actionSectionStyle}>
          <h2 style={actionTitleStyle}>What's your decision?</h2>
          
          <div>
            <p style={actionDescriptionStyle}>
              Based on the historical BTC price shown, would you buy, sell, or wait?
              {chartHasData ? 
                " The chart shows price up to a specific point in time. Make your decision!" : 
                " Loading chart data..."}
            </p>
            
            <div style={buttonContainerStyle}>
              <button
                style={{
                  ...buyButtonStyle,
                  opacity: decision || !chartHasData ? 0.7 : 1,
                  cursor: decision || !chartHasData ? 'not-allowed' : 'pointer'
                }}
                onClick={() => !decision && chartHasData && handleDecision('buy')}
                disabled={!!decision || !chartHasData}
              >
                Buy
              </button>
              
              <button
                style={{
                  ...waitButtonStyle,
                  opacity: decision || !chartHasData ? 0.7 : 1,
                  cursor: decision || !chartHasData ? 'not-allowed' : 'pointer'
                }}
                onClick={() => !decision && chartHasData && handleDecision('wait')}
                disabled={!!decision || !chartHasData}
              >
                Wait
              </button>
              
              <button
                style={{
                  ...sellButtonStyle,
                  opacity: decision || !chartHasData ? 0.7 : 1,
                  cursor: decision || !chartHasData ? 'not-allowed' : 'pointer'
                }}
                onClick={() => !decision && chartHasData && handleDecision('sell')}
                disabled={!!decision || !chartHasData}
              >
                Sell
              </button>
            </div>
          </div>
          
          {/* Show result after decision */}
          {decision && (
            <div style={resultStyle}>
              <p>You decided to <strong>{decision}</strong></p>
              
              {!isRevealed ? (
                <p>Revealing the price movement...</p>
              ) : (
                <>
                  <p>The price went <strong>{quizResult === 'win' ? 'UP ↑' : quizResult === 'loss' ? 'DOWN ↓' : ''}</strong></p>
                  <p style={{ marginTop: '10px' }}>{quizResult === 'win' ? 'You made a profit!' : quizResult === 'loss' ? 'You took a loss.' : 'Your trade broke even.'}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 