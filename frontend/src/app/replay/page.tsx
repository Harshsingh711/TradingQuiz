'use client';

import { useState, CSSProperties } from 'react';
import { useAuth } from '../context/AuthContext';
import ChartReplay from '../components/ChartReplay';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default function ReplayPage() {
  const { isAuthenticated } = useAuth();
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalProfit: 0,
    winRate: 0,
    averageProfit: 0,
    averageLoss: 0
  });
  
  // Handle when a trade is completed
  const handleTradeComplete = (result: { 
    entryPrice: number, 
    exitPrice: number,
    profit: number, 
    percentChange: number,
    timeInTrade: number 
  }) => {
    // Add trade to history
    const newTradeHistory = [
      {
        id: Date.now(),
        ...result,
        time: new Date().toLocaleString()
      },
      ...tradeHistory
    ];
    
    setTradeHistory(newTradeHistory);
    
    // Update stats
    const isWin = result.profit > 0;
    const newStats = {
      totalTrades: stats.totalTrades + 1,
      winningTrades: isWin ? stats.winningTrades + 1 : stats.winningTrades,
      losingTrades: isWin ? stats.losingTrades : stats.losingTrades + 1,
      totalProfit: stats.totalProfit + result.profit,
      winRate: 0,
      averageProfit: 0,
      averageLoss: 0
    };
    
    // Calculate win rate and averages
    newStats.winRate = newStats.totalTrades > 0 
      ? (newStats.winningTrades / newStats.totalTrades) * 100 
      : 0;
      
    // Get all profits and losses to calculate averages
    const profits = [...newTradeHistory.filter(t => t.profit > 0).map(t => t.profit)];
    const losses = [...newTradeHistory.filter(t => t.profit < 0).map(t => t.profit)];
    
    newStats.averageProfit = profits.length > 0 
      ? profits.reduce((sum, val) => sum + val, 0) / profits.length 
      : 0;
      
    newStats.averageLoss = losses.length > 0 
      ? losses.reduce((sum, val) => sum + val, 0) / losses.length 
      : 0;
    
    setStats(newStats);
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
    flexDirection: 'column' as 'column',
    gap: '1.5rem',
    backgroundColor: '#1e1e30',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    color: '#f3f4f6'
  };

  const chartSectionStyle: CSSProperties = {
    borderRadius: '0.375rem',
    overflow: 'hidden',
    minHeight: '600px'
  };

  const statsContainerStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap' as 'wrap',
    gap: '1rem',
    marginTop: '1rem'
  };

  const statBoxStyle: CSSProperties = {
    flex: '1',
    minWidth: '150px',
    padding: '1rem',
    backgroundColor: '#2a2a3c',
    borderRadius: '0.375rem',
    textAlign: 'center' as 'center'
  };

  const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse' as 'collapse',
    marginTop: '1rem',
    textAlign: 'left' as 'left'
  };

  const thStyle: CSSProperties = {
    padding: '0.75rem',
    borderBottom: '1px solid #2a2a3c',
    color: '#a0a0a0'
  };

  const tdStyle: CSSProperties = {
    padding: '0.75rem',
    borderBottom: '1px solid #2a2a3c'
  };

  // For authenticated users only
  if (!isAuthenticated) {
    return (
      <div style={pageContainerStyle}>
        <h1 style={headingStyle}>Chart Replay Simulator</h1>
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
            You need to be logged in to access the chart replay simulator.
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
    <div style={{
      ...pageContainerStyle,
      backgroundColor: '#111827',
      minHeight: '100vh'
    }}>
      <h1 style={headingStyle}>Chart Replay Simulator</h1>
      
      <div style={contentContainerStyle}>
        {/* Chart Replay Component */}
        <div style={chartSectionStyle}>
          <ChartReplay 
            height={600} 
            onTradeComplete={handleTradeComplete}
          />
        </div>
        
        {/* Trading Stats Section */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Trading Statistics
          </h2>
          
          <div style={statsContainerStyle}>
            <div style={statBoxStyle}>
              <div style={{ fontSize: '0.875rem', color: '#a0a0a0' }}>Total Trades</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                {stats.totalTrades}
              </div>
            </div>
            
            <div style={statBoxStyle}>
              <div style={{ fontSize: '0.875rem', color: '#a0a0a0' }}>Win Rate</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                marginTop: '0.5rem',
                color: stats.winRate >= 50 ? '#4CAF50' : '#FF5252'
              }}>
                {stats.winRate.toFixed(1)}%
              </div>
            </div>
            
            <div style={statBoxStyle}>
              <div style={{ fontSize: '0.875rem', color: '#a0a0a0' }}>Total Profit/Loss</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                marginTop: '0.5rem',
                color: stats.totalProfit >= 0 ? '#4CAF50' : '#FF5252'
              }}>
                ${stats.totalProfit.toFixed(2)}
              </div>
            </div>
            
            <div style={statBoxStyle}>
              <div style={{ fontSize: '0.875rem', color: '#a0a0a0' }}>Avg Profit</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                marginTop: '0.5rem',
                color: '#4CAF50'
              }}>
                ${stats.averageProfit.toFixed(2)}
              </div>
            </div>
            
            <div style={statBoxStyle}>
              <div style={{ fontSize: '0.875rem', color: '#a0a0a0' }}>Avg Loss</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                marginTop: '0.5rem',
                color: '#FF5252'
              }}>
                ${stats.averageLoss.toFixed(2)}
              </div>
            </div>
          </div>
          
          {/* Trade History Table */}
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
              Recent Trades
            </h3>
            
            {tradeHistory.length > 0 ? (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Time</th>
                    <th style={thStyle}>Entry</th>
                    <th style={thStyle}>Exit</th>
                    <th style={thStyle}>Profit/Loss</th>
                    <th style={thStyle}>% Change</th>
                    <th style={thStyle}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistory.map((trade) => (
                    <tr key={trade.id}>
                      <td style={tdStyle}>{trade.time}</td>
                      <td style={tdStyle}>${trade.entryPrice.toFixed(2)}</td>
                      <td style={tdStyle}>${trade.exitPrice.toFixed(2)}</td>
                      <td style={{
                        ...tdStyle,
                        color: trade.profit >= 0 ? '#4CAF50' : '#FF5252'
                      }}>
                        ${trade.profit.toFixed(2)}
                      </td>
                      <td style={{
                        ...tdStyle,
                        color: trade.percentChange >= 0 ? '#4CAF50' : '#FF5252'
                      }}>
                        {trade.percentChange.toFixed(2)}%
                      </td>
                      <td style={tdStyle}>
                        {Math.floor(trade.timeInTrade / 60)} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center' as 'center', 
                backgroundColor: '#2a2a3c',
                borderRadius: '0.375rem',
                color: '#a0a0a0'
              }}>
                No trades yet. Use the replay simulator to start trading!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 