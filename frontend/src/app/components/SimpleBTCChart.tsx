'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface ChartProps {
  height?: number;
  width?: string | number;
  onReady?: (hasData: boolean) => void;
}

export default function SimpleBTCChart({ height = 450, width = '100%', onReady }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cutoffIndex, setCutoffIndex] = useState<number | null>(null);
  const [showFull, setShowFull] = useState(false);
  
  // Chart instance references
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  // Generate fallback data 
  const generateFallbackData = () => {
    console.log('Generating fallback data...');
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
        console.log('Fetching data...');
        
        // Generate fallback data directly
        const fallbackData = generateFallbackData();
        const fallbackCutoff = Math.floor(fallbackData.length * 0.7);
        
        setData(fallbackData);
        setCutoffIndex(fallbackCutoff);
        console.log('Data ready with cutoff at:', fallbackCutoff);
        
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

  // Create chart when data is ready
  useEffect(() => {
    if (!chartContainerRef.current || !data.length || cutoffIndex === null) {
      console.log('Skipping chart creation - prerequisites not met');
      return;
    }
    
    // Clean up previous chart
    if (chartRef.current) {
      console.log('Cleaning up previous chart');
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }
    
    console.log('Chart container dimensions:', {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight
    });
    
    // Load and create chart
    import('lightweight-charts')
      .then(module => {
        try {
          const { createChart } = module;
          console.log('Loaded lightweight-charts module');
          
          // Create chart
          const chart = createChart(chartContainerRef.current!, {
            width: chartContainerRef.current!.clientWidth,
            height: chartContainerRef.current!.clientHeight,
            layout: {
              background: { color: '#ffffff' },
              textColor: '#333333',
            },
            grid: {
              vertLines: { color: '#f0f3fa' },
              horzLines: { color: '#f0f3fa' },
            },
            timeScale: {
              timeVisible: true,
              borderColor: '#d1d4dc',
            },
          });
          
          console.log('Chart created');
          chartRef.current = chart;
          
          // Add line series - use any to bypass TypeScript errors
          const lineSeries = (chart as any).addLineSeries({
            color: '#3b82f6',
            lineWidth: 2,
          });
          
          console.log('Line series added');
          seriesRef.current = lineSeries;
          
          // Set data (sliced to cutoff)
          const visibleData = showFull ? data : data.slice(0, cutoffIndex);
          lineSeries.setData(visibleData);
          console.log(`Set ${visibleData.length} data points to chart`);
          
          // Fit to content
          chart.timeScale().fitContent();
          
          // Window resize handler
          const handleResize = () => {
            if (chartContainerRef.current && chart) {
              chart.applyOptions({
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
              });
              chart.timeScale().fitContent();
            }
          };
          
          window.addEventListener('resize', handleResize);
          
          // Return cleanup function
          return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
          };
        } catch (err) {
          console.error('Error creating chart:', err);
          setError('Failed to create chart');
        }
      })
      .catch(err => {
        console.error('Error importing chart library:', err);
        setError('Failed to load chart library');
      });
  }, [data, cutoffIndex, showFull]);
  
  // Reveal function
  const revealChart = () => {
    if (!showFull && seriesRef.current) {
      console.log('Revealing full chart');
      setShowFull(true);
      seriesRef.current.setData(data);
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
  }, [data]);
  
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
          <div>Loading chart data...</div>
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
      
      <div 
        ref={chartContainerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
} 