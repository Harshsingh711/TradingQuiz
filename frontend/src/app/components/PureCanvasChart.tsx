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

type CandlePoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export default function PureCanvasChart({ height = 450, width = '100%', onReady }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cutoffIndex, setCutoffIndex] = useState<number | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, price: number, date: Date} | null>(null);

  // Generate fallback data
  const generateFallbackData = (): PricePoint[] => {
    console.log('Generating fallback data...');
    const fallbackData: PricePoint[] = [];
    const basePrice = 35000;
    const now = Math.floor(Date.now() / 1000);
    const dayInSeconds = 86400;
    
    for (let i = 0; i < 180; i++) {
      const volatility = (Math.random() - 0.5) * 1000;
      const trend = Math.sin(i / 20) * 3000;
      fallbackData.push({
        time: now - (180 - i) * dayInSeconds,
        value: basePrice + trend + volatility + (i * 30)
      });
    }
    return fallbackData;
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Try to fetch from our API
        try {
          const response = await axios.get('/api/quiz/btc-history?days=180');
          
          if (response.data && response.data.data && response.data.data.length > 0) {
            const chartData = response.data.data;
            
            // Generate cutoff index
            const minCutoff = Math.floor(chartData.length * 0.6);
            const maxCutoff = Math.floor(chartData.length * 0.8);
            const randomCutoff = Math.floor(Math.random() * (maxCutoff - minCutoff + 1)) + minCutoff;
            
            setData(chartData);
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
        
        setData(fallbackData);
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
  }, [onReady]);

  // Draw the chart
  useEffect(() => {
    if (!canvasRef.current || !data.length || cutoffIndex === null) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions based on its container size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Use the visible data (either cut off or full)
    const visibleData = showFull ? data : data.slice(0, cutoffIndex);
    
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
    
    // Time range
    const startTime = visibleData[0].time;
    const endTime = visibleData[visibleData.length - 1].time;
    
    // Calculate scaling factors
    const xScale = canvas.offsetWidth / (endTime - startTime);
    const yScale = canvas.offsetHeight / (maxPrice - minPrice);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    
    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    
    // Draw grid
    ctx.strokeStyle = '#f0f3fa';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 1; i < 6; i++) {
      const y = canvas.offsetHeight - ((i / 5) * canvas.offsetHeight);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.offsetWidth, y);
      ctx.stroke();
      
      // Price labels
      const price = minPrice + ((i / 5) * (maxPrice - minPrice));
      ctx.fillStyle = '#333333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`$${Math.round(price).toLocaleString()}`, canvas.offsetWidth - 10, y - 5);
    }
    
    // Vertical grid lines
    for (let i = 1; i < 6; i++) {
      const x = (i / 5) * canvas.offsetWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.offsetHeight);
      ctx.stroke();
      
      // Date labels
      const time = startTime + ((i / 5) * (endTime - startTime));
      const date = new Date(time * 1000);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      ctx.textAlign = 'center';
      ctx.fillText(`${month}/${day}`, x, canvas.offsetHeight - 5);
    }
    
    // Draw price line
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    
    // Starting point
    const firstX = (visibleData[0].time - startTime) * xScale;
    const firstY = canvas.offsetHeight - ((visibleData[0].value - minPrice) * yScale);
    ctx.moveTo(firstX, firstY);
    
    // Draw line segments
    const points: {x: number, y: number, price: number, time: number}[] = [];
    
    for (let i = 1; i < visibleData.length; i++) {
      const x = (visibleData[i].time - startTime) * xScale;
      const y = canvas.offsetHeight - ((visibleData[i].value - minPrice) * yScale);
      ctx.lineTo(x, y);
      points.push({x, y, price: visibleData[i].value, time: visibleData[i].time});
    }
    
    ctx.stroke();
    
    // Draw area fill
    ctx.lineTo((visibleData[visibleData.length - 1].time - startTime) * xScale, canvas.offsetHeight);
    ctx.lineTo(firstX, canvas.offsetHeight);
    ctx.closePath();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fill();
    
    // Draw chart title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('BTC/USD', 10, 20);
    
    // Draw last price
    const lastPrice = visibleData[visibleData.length - 1].value;
    ctx.textAlign = 'right';
    ctx.fillText(`$${lastPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}`, canvas.offsetWidth - 10, 20);
    
    // Draw time range
    const startDate = new Date(startTime * 1000);
    const endDate = new Date(endTime * 1000);
    const dateFormat = { month: 'short', day: 'numeric', year: 'numeric' } as const;
    
    ctx.textAlign = 'center';
    ctx.font = '12px Arial';
    ctx.fillText(
      `${startDate.toLocaleDateString('en-US', dateFormat)} - ${endDate.toLocaleDateString('en-US', dateFormat)}`,
      canvas.offsetWidth / 2,
      canvas.offsetHeight - 20
    );
    
    // Draw hovered point if any
    if (hoveredPoint) {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(hoveredPoint.x, hoveredPoint.y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Price tooltip
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(hoveredPoint.x - 60, hoveredPoint.y - 40, 120, 35);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`$${hoveredPoint.price.toLocaleString(undefined, {maximumFractionDigits: 2})}`, hoveredPoint.x, hoveredPoint.y - 25);
      
      const dateStr = hoveredPoint.date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      ctx.font = '10px Arial';
      ctx.fillText(dateStr, hoveredPoint.x, hoveredPoint.y - 10);
    }
    
    // Mouse move handler for price tooltips
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      
      // Find closest point
      let closestPoint = null;
      let minDistance = Number.MAX_VALUE;
      
      for (const point of points) {
        const distance = Math.abs(point.x - mouseX);
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      }
      
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
  }, [data, cutoffIndex, showFull, hoveredPoint]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        // Force redraw on resize
        setHoveredPoint(null); // Clear any hover state
        canvasRef.current.width = canvasRef.current.offsetWidth;
        canvasRef.current.height = canvasRef.current.offsetHeight;
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
  
  // Apply the expected size props to the container
  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    position: 'relative',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  };
  
  return (
    <div style={containerStyle}>
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
  );
} 