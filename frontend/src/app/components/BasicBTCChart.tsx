'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface ChartProps {
  height?: number;
  width?: string | number;
  onReady?: (hasData: boolean) => void;
}

export default function BasicBTCChart({ height = 450, width = '100%', onReady }: ChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cutoffIndex, setCutoffIndex] = useState<number | null>(null);
  const [showFull, setShowFull] = useState(false);

  // Generate fallback data 
  const generateFallbackData = () => {
    const fallbackData = [];
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
          console.error("API fetch failed, using fallback data");
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

  // Draw chart
  useEffect(() => {
    if (!chartRef.current || !data.length || cutoffIndex === null) return;
    
    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const displayData = showFull ? data : data.slice(0, cutoffIndex);
    
    // Setup
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Calculate min/max for y-axis
    const values = displayData.map(point => point.value);
    const minValue = Math.min(...values) * 0.95;
    const maxValue = Math.max(...values) * 1.05;
    const valueRange = maxValue - minValue;
    
    // Calculate x timeline
    const firstTime = displayData[0].time;
    const lastTime = displayData[displayData.length - 1].time;
    const timeRange = lastTime - firstTime;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#f0f3fa';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 1; i < 5; i++) {
      const y = canvas.height - (i * canvas.height / 5);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 1; i < 6; i++) {
      const x = i * canvas.width / 6;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Draw price labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    
    for (let i = 0; i < 6; i++) {
      const price = minValue + (i * valueRange / 5);
      const y = canvas.height - (i * canvas.height / 5);
      ctx.fillText('$' + Math.round(price).toLocaleString(), canvas.width - 10, y - 5);
    }
    
    // Draw date labels
    ctx.textAlign = 'center';
    for (let i = 0; i < 6; i++) {
      const timestamp = firstTime + (i * timeRange / 5);
      const date = new Date(timestamp * 1000);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      const x = i * canvas.width / 5;
      ctx.fillText(dateStr, x, canvas.height - 5);
    }
    
    // Draw chart line
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    
    // Move to first point
    const firstX = ((displayData[0].time - firstTime) / timeRange) * canvas.width;
    const firstY = canvas.height - ((displayData[0].value - minValue) / valueRange) * canvas.height;
    ctx.moveTo(firstX, firstY);
    
    // Draw line to each point
    for (let i = 1; i < displayData.length; i++) {
      const x = ((displayData[i].time - firstTime) / timeRange) * canvas.width;
      const y = canvas.height - ((displayData[i].value - minValue) / valueRange) * canvas.height;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw area fill
    ctx.lineTo(((displayData[displayData.length - 1].time - firstTime) / timeRange) * canvas.width, canvas.height);
    ctx.lineTo(firstX, canvas.height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fill();
    
    // Add title
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('BTC/USD Price', 10, 20);
    
  }, [data, showFull, cutoffIndex]);
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.width = chartRef.current.offsetWidth;
        chartRef.current.height = chartRef.current.offsetHeight;
        // Redraw
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Reveal function
  const revealChart = () => {
    if (!showFull) {
      setShowFull(true);
      return true;
    }
    return false;
  };
  
  // Make reveal function globally available
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
  
  return (
    <div style={{ 
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      position: 'relative',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#ffffff',
    }}>
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
        ref={chartRef} 
        width={typeof width === 'number' ? width : 800} 
        height={typeof height === 'number' ? height : 450}
        style={{ 
          width: '100%', 
          height: '100%' 
        }}
      />
    </div>
  );
} 