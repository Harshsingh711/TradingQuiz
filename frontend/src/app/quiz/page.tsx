'use client'

import { useState, CSSProperties, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import ChartReplay from '../components/ChartReplay'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default function Quiz() {
  const { isAuthenticated, user, updateUserElo } = useAuth();
  const [chartHasData, setChartHasData] = useState(false);
  const [totalPnL, setTotalPnL] = useState(0);
  const [tradeCount, setTradeCount] = useState(0);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [currentElo, setCurrentElo] = useState(() => {
    // Load current ELO from user profile if available
    return 1200; // Will be updated by useEffect
  });

  // Update currentElo when user profile changes
  useEffect(() => {
    if (isAuthenticated && user?.eloScore) {
      setCurrentElo(user.eloScore);
    }
  }, [isAuthenticated, user?.eloScore]);

  const handleTradeComplete = (result: { 
    entryPrice: number, 
    exitPrice: number,
    profit: number, 
    percentChange: number,
    timeInTrade: number 
  }) => {
    // Update total P&L and trade count
    setTotalPnL(prev => prev + result.profit);
    setTradeCount(prev => prev + 1);
    
    // Add to trade history
    const newTrade = {
      id: Date.now(),
      ...result,
      timestamp: new Date().toLocaleString()
    };
    setTradeHistory(prev => [newTrade, ...prev].slice(0, 10)); // Keep last 10 trades
    
    console.log('Trade completed:', result);
  };

  const handleQuizComplete = (result: {
    totalPercentGain: number,
    finalBalance: number,
    eloChange: number,
    newElo: number,
    quizDuration: number,
    candlesUsed: number,
    reason: 'timeLimit' | 'candleLimit' | 'manual'
  }) => {
    setQuizResult(result);
    setCurrentElo(result.newElo); // Update current ELO display
    
    // Add to quiz history
    const newQuiz = {
      id: Date.now(),
      ...result,
      timestamp: new Date().toLocaleString(),
      tradeCount: tradeCount
    };
    setQuizHistory(prev => [newQuiz, ...prev].slice(0, 5)); // Keep last 5 quizzes
    
    console.log('Quiz completed:', result);
  };

  const resetQuiz = () => {
    setQuizResult(null);
    setTotalPnL(0);
    setTradeCount(0);
    setTradeHistory([]);
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Styles
  const pageContainerStyle: CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '1.5rem 1rem',
    backgroundColor: '#111827',
    minHeight: '100vh'
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
    flex: '3',
    borderRadius: '0.375rem',
    overflow: 'hidden',
    height: '600px'
  };

  const scoringSectionStyle: CSSProperties = {
    flex: '1',
    display: 'flex',
    flexDirection: 'column' as 'column',
    padding: '1rem',
    gap: '1rem'
  };

  const scoringTitleStyle: CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#f3f4f6',
    marginBottom: '1rem'
  };

  const statBoxStyle: CSSProperties = {
    padding: '1rem',
    backgroundColor: '#2a2a3c',
    borderRadius: '0.375rem',
    textAlign: 'center' as 'center'
  };

  const statLabelStyle: CSSProperties = {
    fontSize: '0.875rem',
    color: '#a0a0a0',
    marginBottom: '0.5rem'
  };

  const statValueStyle: CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold'
  };

  const instructionsStyle: CSSProperties = {
    fontSize: '0.875rem',
    color: '#a0a0a0',
    lineHeight: '1.5',
    padding: '1rem',
    backgroundColor: '#2a2a3c',
    borderRadius: '0.375rem'
  };

  const tradeHistoryStyle: CSSProperties = {
    maxHeight: '200px',
    overflowY: 'auto' as 'auto',
    backgroundColor: '#2a2a3c',
    borderRadius: '0.375rem',
    padding: '0.5rem'
  };

  const tradeItemStyle: CSSProperties = {
    padding: '0.5rem',
    borderBottom: '1px solid #3a3a4c',
    fontSize: '0.75rem'
  };

  const modalStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const modalContentStyle: CSSProperties = {
    backgroundColor: '#1e1e30',
    borderRadius: '0.5rem',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto' as 'auto'
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
      
      {/* Quiz Result Modal */}
      {quizResult && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#f3f4f6',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              Quiz Complete!
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Performance Summary */}
              <div style={statBoxStyle}>
                <div style={statLabelStyle}>Final Performance</div>
                <div style={{
                  ...statValueStyle,
                  color: quizResult.totalPercentGain >= 0 ? '#4CAF50' : '#FF5252'
                }}>
                  {quizResult.totalPercentGain >= 0 ? '+' : ''}{quizResult.totalPercentGain.toFixed(2)}%
                </div>
              </div>

              {/* ELO Change */}
              <div style={statBoxStyle}>
                <div style={statLabelStyle}>ELO Change</div>
                <div style={{
                  ...statValueStyle,
                  color: quizResult.eloChange >= 0 ? '#4CAF50' : '#FF5252'
                }}>
                  {quizResult.eloChange >= 0 ? '+' : ''}{quizResult.eloChange} ({quizResult.newElo})
                </div>
              </div>

              {/* Quiz Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Duration</div>
                  <div style={{ ...statValueStyle, fontSize: '1rem', color: '#f3f4f6' }}>
                    {formatTime(Math.floor(quizResult.quizDuration))}
                  </div>
                </div>
                
                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Candles Used</div>
                  <div style={{ ...statValueStyle, fontSize: '1rem', color: '#f3f4f6' }}>
                    {quizResult.candlesUsed}
                  </div>
                </div>
                
                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Final Balance</div>
                  <div style={{ ...statValueStyle, fontSize: '1rem', color: '#f3f4f6' }}>
                    ${quizResult.finalBalance.toLocaleString()}
                  </div>
                </div>
                
                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Trades Made</div>
                  <div style={{ ...statValueStyle, fontSize: '1rem', color: '#f3f4f6' }}>
                    {tradeCount}
                  </div>
                </div>
              </div>

              {/* Reason for ending */}
              <div style={{
                ...instructionsStyle,
                textAlign: 'center',
                backgroundColor: quizResult.reason === 'timeLimit' ? '#4A3A1F' : 
                                 quizResult.reason === 'candleLimit' ? '#3A1F1F' : '#1F3A1F'
              }}>
                Quiz ended: {
                  quizResult.reason === 'timeLimit' ? 'Time limit reached' :
                  quizResult.reason === 'candleLimit' ? 'Candle limit reached' :
                  'Manually ended'
                }
              </div>

              {/* Action Buttons */}
              <button
                onClick={resetQuiz}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                Start New Quiz
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={contentContainerStyle}>
        {/* Left side - BTC Chart (3/4 width) */}
        <div style={chartSectionStyle}>
          <ChartReplay 
            height={600}
            onReady={(hasData) => setChartHasData(hasData)}
            onTradeComplete={handleTradeComplete}
            onQuizComplete={handleQuizComplete}
            isQuizMode={true}
          />
        </div>
        
        {/* Right side - Scoring and Stats (1/4 width) */}
        <div style={scoringSectionStyle}>
          <h2 style={scoringTitleStyle}>Quiz Dashboard</h2>
          
          {/* Instructions */}
          <div style={instructionsStyle}>
            <h3 style={{ color: '#f3f4f6', marginBottom: '0.5rem', fontSize: '1rem' }}>Quiz Rules:</h3>
            <ul style={{ paddingLeft: '1rem', margin: 0 }}>
              <li>Time limit: 10 minutes</li>
              <li>Candle limit: 5000 points</li>
              <li>1m = 1pt, 5m = 5pts, 15m = 15pts, 30m = 30pts, 1h = 60pts</li>
              <li>Click &quot;Start Quiz&quot; to begin</li>
              <li>ELO changes based on % gain/loss</li>
            </ul>
          </div>
          
          {/* Current ELO Display */}
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>Current ELO Rating</div>
            <div style={{
              ...statValueStyle,
              color: '#FFD700' // Gold color for ELO
            }}>
              {currentElo}
            </div>
          </div>
          
          {/* Current Performance (during quiz) */}
          {!quizResult && (
            <>
              {/* Total P&L */}
              <div style={statBoxStyle}>
                <div style={statLabelStyle}>Current P&L</div>
                <div style={{
                  ...statValueStyle,
                  color: totalPnL >= 0 ? '#4CAF50' : '#FF5252'
                }}>
                  ${totalPnL.toFixed(2)}
                </div>
              </div>
              
              {/* Trade Count */}
              <div style={statBoxStyle}>
                <div style={statLabelStyle}>Trades Completed</div>
                <div style={{
                  ...statValueStyle,
                  color: '#f3f4f6'
                }}>
                  {tradeCount}
                </div>
              </div>
            </>
          )}
          
          {/* Quiz History */}
          {quizHistory.length > 0 && (
            <>
              <h3 style={{ color: '#f3f4f6', fontSize: '1.125rem', fontWeight: 'bold' }}>Recent Quizzes</h3>
              <div style={tradeHistoryStyle}>
                {quizHistory.map((quiz, index) => (
                  <div key={quiz.id} style={tradeItemStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#a0a0a0' }}>#{quizHistory.length - index}</span>
                      <span style={{ 
                        color: quiz.totalPercentGain >= 0 ? '#4CAF50' : '#FF5252',
                        fontWeight: 'bold'
                      }}>
                        {quiz.totalPercentGain >= 0 ? '+' : ''}{quiz.totalPercentGain.toFixed(2)}%
                      </span>
                    </div>
                    <div style={{ fontSize: '0.625rem', color: '#666' }}>
                      ELO: {quiz.eloChange >= 0 ? '+' : ''}{quiz.eloChange} | 
                      Trades: {quiz.tradeCount} | 
                      {formatTime(Math.floor(quiz.quizDuration))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* Recent Trades */}
          {tradeHistory.length > 0 && (
            <>
              <h3 style={{ color: '#f3f4f6', fontSize: '1.125rem', fontWeight: 'bold' }}>Recent Trades</h3>
              <div style={tradeHistoryStyle}>
                {tradeHistory.map((trade) => (
                  <div key={trade.id} style={tradeItemStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#a0a0a0' }}>
                        ${trade.entryPrice.toFixed(2)} → ${trade.exitPrice.toFixed(2)}
                      </span>
                      <span style={{ 
                        color: trade.profit >= 0 ? '#4CAF50' : '#FF5252',
                        fontWeight: 'bold'
                      }}>
                        {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.625rem', color: '#666' }}>
                      {trade.percentChange >= 0 ? '+' : ''}{trade.percentChange.toFixed(2)}% • 
                      {Math.floor(trade.timeInTrade / 60)}:{(trade.timeInTrade % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 