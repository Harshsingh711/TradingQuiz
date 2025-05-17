'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface ChartProps {
  height?: number;
  width?: string | number;
  onReady?: (hasData: boolean) => void;
}

type PricePoint = {
  time: number;
  value: number;
};

export default function LinePointChart({ height = 450, width = '100%', onReady }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cutoffIndex, setCutoffIndex] = useState<number | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, price: number, date: Date} | null>(null);
  const [timeframe, setTimeframe] = useState<'1h' | '30m' | '15m' | '5m' | '1m'>('1h');

  // Generate fallback data
  const generateFallbackData = (): PricePoint[] => {
    console.log('Generating fallback data...');
    const fallbackData: PricePoint[] = [];
    const basePrice = 35000;
    
    // Current time in seconds
    const now = Math.floor(Date.now() / 1000);
    
    // Seconds in each timeframe
    const timeframes = {
      '1m': 60,
      '5m': 5 * 60,
      '15m': 15 * 60,
      '30m': 30 * 60,
      '1h': 60 * 60
    };
    
    // Generate 180 data points spaced by the selected timeframe
    const interval = timeframes[timeframe];
    const points = 180;
    
    for (let i = 0; i < points; i++) {
      const pointOffset = points - i - 1;
      const timestamp = now - (pointOffset * interval);
      
      const volatility = (Math.random() - 0.5) * 1000;
      const trend = Math.sin(i / 20) * 3000;
      const price = basePrice + trend + volatility + (i * 30);
      
      fallbackData.push({
        time: timestamp,
        value: price
      });
    }
    
    return fallbackData;
  };

  // Fetch data and adjust for timeframe
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Try to fetch from our API
        try {
          const response = await axios.get('/api/quiz/btc-history?days=180');
          
          if (response.data && response.data.data && response.data.data.length > 0) {
            const lineData = response.data.data;
            
            // We'll slice the data based on timeframe to simulate different timeframes
            // In a real app, you would fetch different timeframe data from the API
            const timeframeFactors = {
              '1m': 180,  // use all points
              '5m': 150,  // use 5/6 of points
              '15m': 120, // use 2/3 of points
              '30m': 90,  // use 1/2 of points
              '1h': 60    // use 1/3 of points
            };
            
            // Adjust data points based on selected timeframe
            const factor = timeframeFactors[timeframe];
            const adjustedData = lineData.slice(-factor);
            
            setPriceData(adjustedData);
            
            // Generate cutoff index
            const minCutoff = Math.floor(adjustedData.length * 0.6);
            const maxCutoff = Math.floor(adjustedData.length * 0.8);
            const randomCutoff = Math.floor(Math.random() * (maxCutoff - minCutoff + 1)) + minCutoff;
            
            setCutoffIndex(randomCutoff);
            
            if (onReady) onReady(true);
            return;
          }
        } catch (e) {
          console.error("API fetch failed, using fallback data", e);
        }
        
        // Use fallback data if API fails
        const fallbackData = generateFallbackData();
        const fallbackCutoff = Math.floor(fallbackData.length * 0.7);
        
        setPriceData(fallbackData);
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
  }, [onReady, timeframe]);

  // Draw the chart
  useEffect(() => {
    if (!canvasRef.current || !priceData.length || cutoffIndex === null) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions based on container size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Use the visible data (either cut off or full)
    const visibleData = showFull ? priceData : priceData.slice(0, cutoffIndex);
    
    // Find min and max values for scaling
    let minPrice = Number.MAX_VALUE;
    let maxPrice = Number.MIN_VALUE;
    
    for (const point of visibleData) {
      if (point.value < minPrice) minPrice = point.value;
      if (point.value > maxPrice) maxPrice = point.value;
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
    
    // Vertical grid lines with date labels
    const dateLines = Math.min(6, visibleData.length);
    for (let i = 0; i < dateLines; i++) {
      const x = margin.left + ((i / (dateLines - 1)) * chartWidth);
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
      
      // Date label - format based on timeframe
      const index = Math.floor((i / (dateLines - 1)) * (visibleData.length - 1));
      const date = new Date(visibleData[index].time * 1000);
      
      let dateLabel;
      if (timeframe === '1m' || timeframe === '5m') {
        // For minute timeframes, show hour:minute
        dateLabel = date.toLocaleString(undefined, {
          month: 'numeric', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit'
        });
      } else if (timeframe === '15m' || timeframe === '30m') {
        // For 15/30 min timeframes, show abbreviated format
        dateLabel = date.toLocaleString(undefined, {
          month: 'numeric', 
          day: 'numeric', 
          hour: 'numeric', 
          minute: '2-digit'
        });
      } else {
        // For hourly, show the date with hour
        dateLabel = date.toLocaleString(undefined, {
          month: 'numeric', 
          day: 'numeric', 
          hour: 'numeric'
        });
      }
      
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(dateLabel, x, height - 10);
    }
    
    // Calculate point coordinates
    const points: {x: number, y: number, price: number, time: number}[] = [];
    
    for (let i = 0; i < visibleData.length; i++) {
      const point = visibleData[i];
      const x = margin.left + (i / (visibleData.length - 1)) * chartWidth;
      const y = margin.top + chartHeight - ((point.value - minPrice) / (maxPrice - minPrice)) * chartHeight;
      
      points.push({
        x, 
        y, 
        price: point.value, 
        time: point.time
      });
    }
    
    // Draw line connecting points
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
    
    // Draw area fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.lineTo(points[points.length - 1].x, margin.top + chartHeight);
    ctx.lineTo(points[0].x, margin.top + chartHeight);
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fill();
    
    // Draw points
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    }
    
    // Draw chart title and current price
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('BTC/USD', margin.left, 20);
    
    // Draw current price
    const lastPoint = visibleData[visibleData.length - 1];
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`$${lastPoint.value.toLocaleString(undefined, {maximumFractionDigits: 2})}`, width - 10, 20);
    
    // Draw timeframe
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Timeframe: ${timeframe}`, width / 2, 20);
    
    // Draw hover tooltip
    if (hoveredPoint) {
      const { x, y, price, date } = hoveredPoint;
      
      // Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      
      // Use roundRect if it exists, otherwise fallback to regular rect
      if (ctx.roundRect) {
        // @ts-ignore - TypeScript doesn't know about roundRect
        ctx.roundRect(x - 80, y - 60, 160, 50, 4);
      } else {
        ctx.fillRect(x - 80, y - 60, 160, 50);
      }
      
      ctx.fill();
      
      // Format date based on timeframe
      let dateStr;
      if (timeframe === '1m' || timeframe === '5m') {
        dateStr = date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } else if (timeframe === '15m' || timeframe === '30m') {
        dateStr = date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        dateStr = date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit'
        });
      }
      
      // Tooltip content
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(dateStr, x, y - 40);
      
      // Price value
      ctx.fillText(`$${price.toLocaleString(undefined, {maximumFractionDigits: 2})}`, x, y - 20);
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
        setHoveredPoint(null);
        return;
      }
      
      // Find closest point
      let closestPoint = null;
      let minDistance = Number.MAX_VALUE;
      
      for (const point of points) {
        const dx = point.x - mouseX;
        const dy = point.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      }
      
      // Only show tooltip if mouse is close enough to a point
      if (closestPoint && minDistance < 30) {
        setHoveredPoint({
          x: closestPoint.x,
          y: closestPoint.y,
          price: closestPoint.price,
          date: new Date(closestPoint.time * 1000)
        });
      } else {
        setHoveredPoint(null);
      }
    };
    
    const handleMouseLeave = () => {
      setHoveredPoint(null);
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [priceData, cutoffIndex, showFull, hoveredPoint, timeframe]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        setHoveredPoint(null);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Provide reveal function
  const revealChart = () => {
    if (!showFull) {
      setShowFull(true);
      return true;
    }
    return false;
  };
  
  // Expose reveal function globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__revealChart = revealChart;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).__revealChart = undefined;
      }
    };
  }, []);
  
  // Create timeframe selector buttons
  const handleTimeframeChange = (tf: '1h' | '30m' | '15m' | '5m' | '1m') => {
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
      {/* Timeframe selector controls */}
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
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              backgroundColor: timeframe === tf ? '#3b82f6' : '#ffffff',
              color: timeframe === tf ? '#ffffff' : '#1f2937',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: timeframe === tf ? 'bold' : 'normal',
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
          📝 Draw
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