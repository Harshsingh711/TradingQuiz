import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface ChartReplayProps {
  height?: number;
  width?: string | number;
  onReady?: (hasData: boolean) => void;
  onTradeComplete?: (result: { 
    entryPrice: number, 
    exitPrice: number,
    profit: number, 
    percentChange: number,
    timeInTrade: number 
  }) => void;
}

type CandlestickData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

type Position = {
  type: 'long' | 'short';
  entryPrice: number;
  entryTime: number;
  size: number;
  exitPrice?: number;
  exitTime?: number;
  profit?: number;
};

export default function ChartReplay({ 
  height = 450, 
  width = '100%', 
  onReady,
  onTradeComplete 
}: ChartReplayProps) {
  // Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for chart data
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for replay functionality
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x, etc.
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '30m' | '1h'>('1m');
  
  // State for trading functionality
  const [balance, setBalance] = useState(100000); // $100,000 starting balance
  const [positions, setPositions] = useState<Position[]>([]);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [positionSize, setPositionSize] = useState(1); // 1 unit by default
  
  // Generate sample candle data with proper structure
  const generateCandleData = (): CandlestickData[] => {
    const data: CandlestickData[] = [];
    const basePrice = 35000; // Base price for BTC
    const now = Math.floor(Date.now() / 1000);
    
    // Determine interval based on timeframe
    let interval = 3600; // Default to 1h
    if (timeframe === '1m') interval = 60;
    if (timeframe === '5m') interval = 300;
    if (timeframe === '15m') interval = 900;
    if (timeframe === '30m') interval = 1800;
    
    // Create 1000 candles (plenty of history to play with)
    for (let i = 0; i < 1000; i++) {
      // Start 1000 intervals ago and move forward
      const timestamp = now - ((1000 - i) * interval);
      
      // Create more realistic price movements with trends
      // Start with previous candle's close price or base price
      const prevClose = i > 0 ? data[i-1].close : basePrice;
      
      // Create some volatility and trend
      const trendFactor = 1 + (Math.sin(i/100) * 0.001); // Creates longer-term cycles
      const volatility = prevClose * 0.005 * (Math.random() - 0.5); // 0.5% random noise
      
      // Calculate the basic move for this candle
      const move = prevClose * 0.002 * (Math.random() - 0.48); // Slight upward bias
      const close = prevClose * trendFactor + move + volatility;
      
      // Generate open near previous close 
      const open = prevClose + (prevClose * 0.001 * (Math.random() - 0.5));
      
      // Calculate high and low with proper relationships
      const high = Math.max(open, close) + (Math.abs(close - open) * (0.5 + Math.random() * 0.5));
      const low = Math.min(open, close) - (Math.abs(close - open) * (0.5 + Math.random() * 0.5));
      
      // Generate volume that correlates with price movement
      const volumeBase = 100 + Math.random() * 900;
      const volumeMove = Math.abs(close - open) / open * 10000;
      const volume = volumeBase + volumeMove;
      
      data.push({
        time: timestamp,
        open,
        high,
        low,
        close,
        volume
      });
    }
    
    return data;
  };

  // Fetch or generate data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // In a full implementation, we would fetch from API
        // For now, we'll use our generation function
        const generatedData = generateCandleData();
        setCandleData(generatedData);
        
        // Set the initial position to show the last 50 candles instead of just the latest one
        // This ensures we have sufficient historical data visible from the start
        setCurrentIndex(generatedData.length - 50);
        
        if (onReady) onReady(true);
      } catch (err) {
        console.error("Error loading chart data:", err);
        setError("Failed to load chart data");
        if (onReady) onReady(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [timeframe, onReady]);

  // Handle playing through chart data
  useEffect(() => {
    if (!isPlaying || currentIndex >= candleData.length - 1) {
      return;
    }
    
    // Calculate delay based on timeframe and playback speed
    let delay = 1000; // 1 second per candle by default
    if (timeframe === '1m') delay = 100;
    if (timeframe === '5m') delay = 200;
    if (timeframe === '15m') delay = 300;
    if (timeframe === '30m') delay = 500;
    
    // Adjust for playback speed
    delay = delay / playbackSpeed;
    
    const timer = setTimeout(() => {
      setCurrentIndex(prevIndex => {
        const newIndex = prevIndex + 1;
        
        // Check if we've reached the end
        if (newIndex >= candleData.length - 1) {
          setIsPlaying(false);
          return candleData.length - 1;
        }
        
        return newIndex;
      });
    }, delay);
    
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, candleData.length, timeframe, playbackSpeed]);

  // Add mouse interaction for dragging the chart
  useEffect(() => {
    if (!canvasRef.current || candleData.length === 0) return;
    
    const canvas = canvasRef.current;
    let isDragging = false;
    let lastX = 0;
    
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastX = e.clientX;
      canvas.style.cursor = 'grabbing';
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - lastX;
      lastX = e.clientX;
      
      // Move the chart by adjusting the current index
      // Dragging left (positive deltaX) shows earlier data (decrease index)
      // Dragging right (negative deltaX) shows later data (increase index)
      if (Math.abs(deltaX) > 3) { // Small threshold to avoid tiny movements
        const direction = deltaX > 0 ? -1 : 1;
        const step = Math.min(5, Math.max(1, Math.abs(Math.floor(deltaX / 5))));
        
        setCurrentIndex(prevIndex => {
          const newIndex = prevIndex + (direction * step);
          // Bound the index to valid data range and keep at least 10 candles visible
          return Math.min(
            candleData.length - 10, 
            Math.max(10, newIndex)
          );
        });
      }
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    };
    
    const handleMouseLeave = () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    };
    
    // Set initial cursor style to indicate chart is draggable
    canvas.style.cursor = 'grab';
    
    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    // Cleanup
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [candleData]);

  // Draw the chart with canvas
  useEffect(() => {
    if (!canvasRef.current || candleData.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions based on device pixel ratio
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Calculate visible range - show at least 80 candles at once
    // This ensures we see multiple days of data
    const visibleCount = 80;
    const startIdx = Math.max(0, currentIndex - visibleCount + 1);
    const visibleData = candleData.slice(startIdx, currentIndex + 1);
    
    // Find min and max values for scaling
    let minPrice = Number.MAX_VALUE;
    let maxPrice = Number.MIN_VALUE;
    
    for (const candle of visibleData) {
      if (candle.low < minPrice) minPrice = candle.low;
      if (candle.high > maxPrice) maxPrice = candle.high;
    }
    
    // Add padding to min/max (10%)
    const padding = (maxPrice - minPrice) * 0.1;
    minPrice -= padding;
    maxPrice += padding;
    
    // Calculate dimensions and chart area
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const margin = { top: 30, right: 80, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#1e1e30'; // Dark theme like TradingView
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#2a2a3c';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (i / 5) * chartHeight;
      
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
      
      // Price labels
      const price = maxPrice - (i / 5) * (maxPrice - minPrice);
      ctx.fillStyle = '#a0a0a0';
      ctx.font = '11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(price.toLocaleString(undefined, { maximumFractionDigits: 2 }), margin.left - 5, y + 4);
    }
    
    // Vertical grid lines (every 10 candles)
    const candleWidth = chartWidth / visibleData.length;
    for (let i = 0; i < visibleData.length; i += 10) {
      const x = margin.left + i * candleWidth;
      
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, height - margin.bottom);
      ctx.stroke();
      
      // Time labels (every 10 candles)
      if (i % 20 === 0) {
        const candle = visibleData[i];
        const date = new Date(candle.time * 1000);
        let timeLabel;
        
        if (timeframe === '1m' || timeframe === '5m') {
          timeLabel = date.toLocaleString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
          });
        } else {
          timeLabel = date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit'
          });
        }
        
        ctx.fillStyle = '#a0a0a0';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(timeLabel, x, height - margin.bottom + 15);
      }
    }
    
    // Draw volume histogram
    const maxVolume = Math.max(...visibleData.map(c => c.volume || 0));
    const volumeScale = (chartHeight * 0.2) / maxVolume;
    
    for (let i = 0; i < visibleData.length; i++) {
      const candle = visibleData[i];
      const x = margin.left + i * candleWidth;
      const volumeHeight = (candle.volume || 0) * volumeScale;
      const y = height - margin.bottom - volumeHeight;
      
      const isGreen = candle.close >= candle.open;
      ctx.fillStyle = isGreen ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 82, 82, 0.3)';
      ctx.fillRect(
        x, 
        y, 
        candleWidth * 0.8, 
        volumeHeight
      );
    }
    
    // Draw candlesticks
    for (let i = 0; i < visibleData.length; i++) {
      const candle = visibleData[i];
      const x = margin.left + i * candleWidth;
      
      // Scale price to y-coordinate
      const openY = margin.top + ((maxPrice - candle.open) / (maxPrice - minPrice)) * chartHeight;
      const closeY = margin.top + ((maxPrice - candle.close) / (maxPrice - minPrice)) * chartHeight;
      const highY = margin.top + ((maxPrice - candle.high) / (maxPrice - minPrice)) * chartHeight;
      const lowY = margin.top + ((maxPrice - candle.low) / (maxPrice - minPrice)) * chartHeight;
      
      const isGreen = candle.close >= candle.open;
      
      // Draw wick
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.strokeStyle = isGreen ? '#4CAF50' : '#FF5252';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw body
      const candleBodyWidth = Math.max(candleWidth * 0.7, 1);
      const bodyX = x + (candleWidth - candleBodyWidth) / 2;
      const bodyY = isGreen ? closeY : openY;
      const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
      
      ctx.fillStyle = isGreen ? '#4CAF50' : '#FF5252';
      ctx.fillRect(bodyX, bodyY, candleBodyWidth, bodyHeight);
    }
    
    // Draw current price line
    if (visibleData.length > 0) {
      const currentPrice = visibleData[visibleData.length - 1].close;
      const priceY = margin.top + ((maxPrice - currentPrice) / (maxPrice - minPrice)) * chartHeight;
      
      ctx.beginPath();
      ctx.moveTo(margin.left, priceY);
      ctx.lineTo(width - margin.right, priceY);
      ctx.strokeStyle = '#f0f0f0';
      ctx.setLineDash([5, 3]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Price label on right
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(width - margin.right + 1, priceY - 10, 50, 20);
      
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(
        currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        width - margin.right + 5,
        priceY + 4
      );
    }
    
    // Draw positions and trades
    if (currentPosition) {
      const candle = candleData[currentIndex];
      
      // Draw entry price level
      const entryY = margin.top + ((maxPrice - currentPosition.entryPrice) / (maxPrice - minPrice)) * chartHeight;
      
      ctx.beginPath();
      ctx.moveTo(margin.left, entryY);
      ctx.lineTo(width - margin.right, entryY);
      ctx.strokeStyle = currentPosition.type === 'long' ? '#4CAF50' : '#FF5252';
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Calculate P&L
      const currentPrice = candle.close;
      const priceDiff = currentPosition.type === 'long' 
        ? currentPrice - currentPosition.entryPrice
        : currentPosition.entryPrice - currentPrice;
      
      const percentPnl = (priceDiff / currentPosition.entryPrice) * 100;
      const dollarPnl = priceDiff * currentPosition.size;
      
      // Draw P&L label
      ctx.fillStyle = priceDiff >= 0 ? '#4CAF50' : '#FF5252';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(
        `P&L: ${dollarPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${percentPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}%)`,
        margin.left + 10,
        margin.top + 20
      );
    }
    
    // Draw chart title and time
    ctx.fillStyle = '#f0f0f0';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('BTC/USD', margin.left, 20);
    
    // Draw current time
    if (visibleData.length > 0) {
      const currentCandle = visibleData[visibleData.length - 1];
      const date = new Date(currentCandle.time * 1000);
      
      ctx.fillStyle = '#a0a0a0';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(
        date.toLocaleString(),
        width - margin.right - 10,
        20
      );
    }
    
  }, [candleData, currentIndex, timeframe, currentPosition]);

  // Function to enter a long position
  const enterLong = () => {
    if (currentPosition || currentIndex >= candleData.length - 1) return;
    
    const entryCandle = candleData[currentIndex];
    const entryPrice = entryCandle.close;
    
    setCurrentPosition({
      type: 'long',
      entryPrice,
      entryTime: entryCandle.time,
      size: positionSize
    });
  };

  // Function to enter a short position
  const enterShort = () => {
    if (currentPosition || currentIndex >= candleData.length - 1) return;
    
    const entryCandle = candleData[currentIndex];
    const entryPrice = entryCandle.close;
    
    setCurrentPosition({
      type: 'short',
      entryPrice,
      entryTime: entryCandle.time,
      size: positionSize
    });
  };

  // Function to close position
  const closePosition = () => {
    if (!currentPosition || currentIndex >= candleData.length - 1) return;
    
    const exitCandle = candleData[currentIndex];
    const exitPrice = exitCandle.close;
    
    // Calculate profit/loss
    const priceDiff = currentPosition.type === 'long' 
      ? exitPrice - currentPosition.entryPrice
      : currentPosition.entryPrice - exitPrice;
    
    const profit = priceDiff * currentPosition.size;
    
    // Update balance
    setBalance(prevBalance => prevBalance + profit);
    
    // Create completed position
    const completedPosition: Position = {
      ...currentPosition,
      exitPrice,
      exitTime: exitCandle.time,
      profit
    };
    
    // Add to positions history
    setPositions(prevPositions => [...prevPositions, completedPosition]);
    
    // Clear current position
    setCurrentPosition(null);
    
    // Call onTradeComplete if provided
    if (onTradeComplete) {
      const timeInTrade = exitCandle.time - currentPosition.entryTime;
      const percentChange = (priceDiff / currentPosition.entryPrice) * 100;
      
      onTradeComplete({
        entryPrice: currentPosition.entryPrice,
        exitPrice,
        profit,
        percentChange,
        timeInTrade
      });
    }
  };

  // Container style
  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1e1e30',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={containerStyle} ref={chartContainerRef}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        padding: '8px 12px',
        borderBottom: '1px solid #2a2a3c',
        backgroundColor: '#1e1e30',
        alignItems: 'center',
        gap: '8px',
      }}>
        {/* Timeframe selector */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['1m', '5m', '15m', '30m', '1h'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: timeframe === tf ? '#3b82f6' : '#2a2a3c',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {tf}
            </button>
          ))}
        </div>
        
        {/* Playback controls */}
        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 10))}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#2a2a3c',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            ⏪
          </button>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#2a2a3c',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <button
            onClick={() => setCurrentIndex(Math.min(candleData.length - 1, currentIndex + 10))}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#2a2a3c',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            ⏩
          </button>
          
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#2a2a3c',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="4">4x</option>
            <option value="8">8x</option>
          </select>
        </div>
        
        {/* Position size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '16px' }}>
          <span style={{ color: '#a0a0a0', fontSize: '12px' }}>Size:</span>
          <input
            type="number"
            value={positionSize}
            onChange={(e) => setPositionSize(Number(e.target.value))}
            min="0.1"
            step="0.1"
            style={{
              width: '60px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#2a2a3c',
              color: '#ffffff',
              fontSize: '12px',
            }}
          />
        </div>
        
        {/* Balance */}
        <div style={{ marginLeft: 'auto', color: '#f0f0f0', fontSize: '14px', fontWeight: 'bold' }}>
          ${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </div>
      
      {/* Chart area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(30, 30, 48, 0.8)',
            zIndex: 10,
          }}>
            <div style={{ color: '#f0f0f0', fontWeight: 'bold' }}>Loading chart data...</div>
          </div>
        )}
        
        {error && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '16px',
            backgroundColor: '#2a2a3c',
            color: '#ff5252',
            borderRadius: '4px',
            zIndex: 5,
          }}>
            {error}
          </div>
        )}
        
        <canvas 
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>
      
      {/* Trading controls */}
      <div style={{
        display: 'flex',
        padding: '8px 12px',
        borderTop: '1px solid #2a2a3c',
        backgroundColor: '#1e1e30',
        justifyContent: 'center',
        gap: '16px',
      }}>
        {!currentPosition ? (
          <>
            <button
              onClick={enterLong}
              disabled={currentIndex >= candleData.length - 1}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#4CAF50',
                color: '#ffffff',
                cursor: currentIndex >= candleData.length - 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: currentIndex >= candleData.length - 1 ? 0.6 : 1,
              }}
            >
              Buy / Long
            </button>
            
            <button
              onClick={enterShort}
              disabled={currentIndex >= candleData.length - 1}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#FF5252',
                color: '#ffffff',
                cursor: currentIndex >= candleData.length - 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: currentIndex >= candleData.length - 1 ? 0.6 : 1,
              }}
            >
              Sell / Short
            </button>
          </>
        ) : (
          <button
            onClick={closePosition}
            style={{
              padding: '8px 24px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#f0f0f0',
              color: '#1e1e30',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            Close Position
          </button>
        )}
      </div>
    </div>
  );
} 