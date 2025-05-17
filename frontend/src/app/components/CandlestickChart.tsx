'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface ChartProps {
  height?: number;
  width?: string | number;
  onReady?: (hasData: boolean) => void;
}

type OHLCData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h';

export default function CandlestickChart({ height = 450, width = '100%', onReady }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [candleData, setCandleData] = useState<OHLCData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cutoffIndex, setCutoffIndex] = useState<number | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState<OHLCData | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{x: number, y: number} | null>(null);
  const [timeframe, setTimeframe] = useState<TimeFrame>('15m');

  // Generate fallback candle data with more realistic price movements
  const generateFallbackData = (): OHLCData[] => {
    console.log('Generating fallback candle data...');
    const fallbackData: OHLCData[] = [];
    const basePrice = 35000;
    const now = Math.floor(Date.now() / 1000);
    
    // Determine interval based on timeframe
    let interval = 86400; // 1 day in seconds
    if (timeframe === '1m') interval = 60;
    if (timeframe === '5m') interval = 300;
    if (timeframe === '15m') interval = 900;
    if (timeframe === '30m') interval = 1800;
    if (timeframe === '1h') interval = 3600;
    
    // Seed some initial variations to make the chart look realistic
    const trendFactors = [0.99, 1.01, 0.995, 1.005, 1.02, 0.98, 1.01, 0.99, 1.03, 0.97];
    let lastClose = basePrice;
    
    // Generate enough candles to fill the chart
    const numCandles = 180; // Consistent number of candles across timeframes
    
    for (let i = 0; i < numCandles; i++) {
      // Move back in time from now
      const timestamp = now - ((numCandles - i) * interval);
      
      // Generate realistic price movements
      const trendFactor = trendFactors[i % trendFactors.length];
      // Smaller timeframes have less volatility per candle
      const volatilityFactor = timeframe === '1m' ? 0.01 : 
                               timeframe === '5m' ? 0.015 :
                               timeframe === '15m' ? 0.02 :
                               timeframe === '30m' ? 0.025 : 0.03;
      
      const volatility = (Math.random() - 0.5) * lastClose * volatilityFactor;
      
      // Create realistic OHLC data
      let open: number;
      let high: number;
      let low: number;
      let close: number;
      
      if (i === 0) {
        open = basePrice;
        close = basePrice * trendFactor + volatility;
      } else {
        open = lastClose;
        close = lastClose * trendFactor + volatility;
      }
      
      // Make high/low extend beyond open/close by random amount
      const highExtra = Math.random() * Math.abs(close - open) * 0.5;
      const lowExtra = Math.random() * Math.abs(close - open) * 0.5;
      
      high = Math.max(open, close) + highExtra;
      low = Math.min(open, close) - lowExtra;
      
      // Ensure high is always highest and low is always lowest
      high = Math.max(high, open, close);
      low = Math.min(low, open, close);
      
      fallbackData.push({
        time: timestamp,
        open,
        high,
        low,
        close
      });
      
      lastClose = close;
    }
    
    return fallbackData;
  };

  // Improved function to convert line data to OHLC data with better timeframe handling
  const convertLineToOHLC = (lineData: any[], tf: TimeFrame): OHLCData[] => {
    if (!lineData.length) return [];
    
    // Sort by time
    lineData.sort((a, b) => a.time - b.time);
    
    const groupedData: Record<string, number[]> = {};
    const ohlcData: OHLCData[] = [];
    
    // Get timeframe duration in seconds
    let tfSeconds = 900; // 15 minutes default
    if (tf === '1m') tfSeconds = 60;
    if (tf === '5m') tfSeconds = 300;
    if (tf === '15m') tfSeconds = 900;
    if (tf === '30m') tfSeconds = 1800;
    if (tf === '1h') tfSeconds = 3600;
    
    // Group data points by timeframe
    lineData.forEach(point => {
      // Round down to nearest timeframe
      const timeframeStart = Math.floor(point.time / tfSeconds) * tfSeconds;
      
      if (!groupedData[timeframeStart]) {
        groupedData[timeframeStart] = [];
      }
      
      groupedData[timeframeStart].push(point.value);
    });
    
    // Convert grouped data to OHLC
    Object.entries(groupedData).forEach(([time, values]) => {
      if (values.length < 1) return;
      
      const open = values[0];
      const high = Math.max(...values);
      const low = Math.min(...values);
      const close = values[values.length - 1];
      
      ohlcData.push({
        time: parseInt(time),
        open,
        high,
        low,
        close
      });
    });
    
    // Sort by time
    ohlcData.sort((a, b) => a.time - b.time);
    
    return ohlcData;
  };

  // Fetch data and update on timeframe change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Generate realistic fallback data directly without API calls
        // This ensures consistent data across timeframes for testing
        const fallbackData = generateFallbackData();
        const fallbackCutoff = Math.floor(fallbackData.length * 0.7);
        
        setCandleData(fallbackData);
        setCutoffIndex(fallbackCutoff);
        
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
  }, [onReady, timeframe]); // Re-fetch when timeframe changes

  // Draw candlestick chart
  useEffect(() => {
    if (!canvasRef.current || !candleData.length || cutoffIndex === null) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions based on container size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Use the visible data (either cut off or full)
    const visibleData = showFull ? candleData : candleData.slice(0, cutoffIndex);
    
    // Find min and max values for scaling
    let minPrice = Number.MAX_VALUE;
    let maxPrice = Number.MIN_VALUE;
    
    for (const candle of visibleData) {
      if (candle.low < minPrice) minPrice = candle.low;
      if (candle.high > maxPrice) maxPrice = candle.high;
    }
    
    // Add padding to min/max
    const padding = (maxPrice - minPrice) * 0.1;
    minPrice -= padding;
    maxPrice += padding;
    
    // Calculate dimensions and chart area
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const margin = { top: 30, right: 80, bottom: 30, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Time range
    const startTime = visibleData[0].time;
    const endTime = visibleData[visibleData.length - 1].time;
    
    // Calculate scaling factors
    const xScale = chartWidth / (visibleData.length);
    const yScale = chartHeight / (maxPrice - minPrice);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw chart area background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);
    
    // Draw grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines with price labels
    const priceLines = 5;
    for (let i = 0; i <= priceLines; i++) {
      const y = margin.top + (chartHeight - (i / priceLines) * chartHeight);
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
      
      // Price label
      const price = minPrice + ((i / priceLines) * (maxPrice - minPrice));
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${price.toLocaleString(undefined, {maximumFractionDigits: 0})}`, width - 10, y + 4);
    }
    
    // Format date for x-axis based on timeframe
    const formatDate = (timestamp: number): string => {
      const date = new Date(timestamp * 1000);
      
      if (timeframe === '1m') {
        // Show month/day, hour:minute for 1 minute timeframe
        return `${date.getMonth() + 1}/${date.getDate()}, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      } else if (timeframe === '5m' || timeframe === '15m') {
        // Show month/day, hour:minute for 5 and 15 minute timeframes
        return `${date.getMonth() + 1}/${date.getDate()}, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      } else if (timeframe === '30m') {
        // Show month/day, hour:minute for 30 minute timeframe
        return `${date.getMonth() + 1}/${date.getDate()}, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      } else { // 1h
        // Show month/day, hour for hourly
        return `${date.getMonth() + 1}/${date.getDate()}, ${date.getHours()}:00`;
      }
    };
    
    // Vertical grid lines with date labels
    const dateLines = Math.min(6, visibleData.length);
    for (let i = 0; i < dateLines; i++) {
      const x = margin.left + ((i / (dateLines - 1)) * chartWidth);
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
      
      // Date label
      const index = Math.floor((i / (dateLines - 1)) * (visibleData.length - 1));
      const dateLabel = formatDate(visibleData[index].time);
      
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(dateLabel, x, height - 10);
    }
    
    // Draw candlesticks
    const candleWidth = Math.min(xScale * 0.7, 15); // 70% of available space, but max 15px
    
    for (let i = 0; i < visibleData.length; i++) {
      const candle = visibleData[i];
      const x = margin.left + (i + 0.5) * xScale;
      const candleX = x - candleWidth / 2;
      
      const openY = margin.top + chartHeight - ((candle.open - minPrice) * yScale);
      const closeY = margin.top + chartHeight - ((candle.close - minPrice) * yScale);
      const highY = margin.top + chartHeight - ((candle.high - minPrice) * yScale);
      const lowY = margin.top + chartHeight - ((candle.low - minPrice) * yScale);
      
      const isUp = candle.close >= candle.open;
      
      // Draw wick
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.strokeStyle = isUp ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw body
      const candleHeight = Math.max(Math.abs(closeY - openY), 1); // Ensure at least 1px height
      
      ctx.fillStyle = isUp ? '#10b981' : '#ef4444';
      ctx.fillRect(
        candleX,
        isUp ? closeY : openY,
        candleWidth,
        candleHeight
      );
    }
    
    // Draw BTC/USD title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('BTC/USD', margin.left, 20);
    
    // Draw current price
    const lastCandle = visibleData[visibleData.length - 1];
    const lastPrice = lastCandle.close;
    
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`$${lastPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}`, width - 10, 20);
    
    // Draw timeframe
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Timeframe: ${timeframe}`,
      width / 2,
      20
    );
    
    // Draw hover tooltip
    if (hoveredCandle && hoverPosition) {
      const { x, y } = hoverPosition;
      const candle = hoveredCandle;
      const date = new Date(candle.time * 1000);
      
      // Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.roundRect(x - 80, y - 80, 160, 75, 4);
      ctx.fill();
      
      // Format date based on timeframe
      let dateStr;
      if (timeframe === '1m' || timeframe === '5m' || timeframe === '15m' || timeframe === '30m') {
        dateStr = date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } else { // 1h
        dateStr = date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Tooltip content
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(dateStr, x, y - 60);
      
      // OHLC values
      ctx.font = '12px sans-serif';
      ctx.fillText(`O: $${candle.open.toLocaleString(undefined, {maximumFractionDigits: 2})}`, x, y - 40);
      ctx.fillText(`H: $${candle.high.toLocaleString(undefined, {maximumFractionDigits: 2})}`, x, y - 25);
      ctx.fillText(`L: $${candle.low.toLocaleString(undefined, {maximumFractionDigits: 2})}`, x, y - 10);
      ctx.fillText(`C: $${candle.close.toLocaleString(undefined, {maximumFractionDigits: 2})}`, x, y + 5);
    }
    
    // Mouse interaction for hovering
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Only handle mouse events in chart area
      if (
        mouseX < margin.left || 
        mouseX > margin.left + chartWidth || 
        mouseY < margin.top || 
        mouseY > margin.top + chartHeight
      ) {
        setHoveredCandle(null);
        return;
      }
      
      // Calculate which candle is being hovered
      const canvasX = mouseX - margin.left;
      const candleIndex = Math.floor(canvasX / xScale);
      
      if (candleIndex >= 0 && candleIndex < visibleData.length) {
        setHoveredCandle(visibleData[candleIndex]);
        setHoverPosition({ x: mouseX, y: mouseY });
      } else {
        setHoveredCandle(null);
      }
    };
    
    const handleMouseLeave = () => {
      setHoveredCandle(null);
      setHoverPosition(null);
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [candleData, cutoffIndex, showFull, hoveredCandle, hoverPosition, timeframe]);
  
  // Create timeframe selector buttons with improved styling to match image
  const handleTimeframeChange = (tf: TimeFrame) => {
    setTimeframe(tf);
  };
  
  // Apply the expected size props to the container
  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    position: 'relative',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };
  
  return (
    <div style={containerStyle} ref={containerRef}>
      {/* Timeframe selector controls with improved styling to match image */}
      <div style={{
        display: 'flex',
        padding: '8px 12px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        gap: '8px',
      }}>
        {(['1h', '30m', '15m', '5m', '1m'] as const).map(tf => (
          <button
            key={tf}
            onClick={() => handleTimeframeChange(tf)}
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              backgroundColor: timeframe === tf ? '#4f46e5' : '#ffffff',
              color: timeframe === tf ? '#ffffff' : '#1f2937',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'normal',
            }}
          >
            {tf}
          </button>
        ))}
        
        <button
          style={{
            marginLeft: 'auto',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            backgroundColor: '#ffffff',
            color: '#1f2937',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onClick={() => alert('Drawing tools will be available in the premium version')}
        >
          ✏️ Draw
        </button>
      </div>
      
      {/* Chart canvas */}
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
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 10,
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{ fontWeight: 'bold' }}>Loading chart data...</div>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}></div>
              <style jsx>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          </div>
        )}
        
        {error && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px',
            backgroundColor: '#fef2f2',
            color: '#ef4444',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '80%',
            zIndex: 5,
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Error</div>
            {error}
          </div>
        )}
        
        <canvas 
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
} 