'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface HistoricalBTCChartProps {
  height?: number;
  width?: string | number;
  onReady?: (hasData: boolean) => void;
}

export default function HistoricalBTCChart({ 
  height = 450, 
  width = '100%',
  onReady
}: HistoricalBTCChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<any | null>(null);
  const [series, setSeries] = useState<any | null>(null);
  const [allData, setAllData] = useState<any[]>([]);
  const [visibleData, setVisibleData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Fetch historical data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/quiz/btc-history?days=180');
        
        if (response.data && response.data.data && response.data.data.length > 0) {
          const data = response.data.data;
          setAllData(data);
          
          // Generate a random cutoff point between 60% and 80% of the data
          const minCutoff = Math.floor(data.length * 0.6);
          const maxCutoff = Math.floor(data.length * 0.8);
          const randomCutoff = Math.floor(Math.random() * (maxCutoff - minCutoff + 1)) + minCutoff;
          
          setVisibleData(data.slice(0, randomCutoff));
          
          if (onReady) {
            onReady(true);
          }
        } else {
          setError('No data available');
          if (onReady) {
            onReady(false);
          }
        }
      } catch (err) {
        console.error('Error fetching BTC data:', err);
        setError('Failed to load chart data');
        if (onReady) {
          onReady(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [onReady]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !visibleData.length) return;

    // Dynamically import lightweight-charts
    import('lightweight-charts').then((module) => {
      const { createChart } = module;

      // Set up the chart
      const chart = createChart(chartContainerRef.current!, {
        width: chartContainerRef.current!.clientWidth,
        height: height,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f3fa' },
          horzLines: { color: '#f0f3fa' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: '#D1D4DC',
        },
        rightPriceScale: {
          borderColor: '#D1D4DC',
        },
      });

      // Create the line series
      const lineSeries = chart.addLineSeries({
        color: '#2962FF',
        lineWidth: 2,
        title: 'BTC/USD',
      });

      // Set the data
      lineSeries.setData(visibleData);

      // Handle window resize
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ 
            width: chartContainerRef.current.clientWidth 
          });
        }
      };

      window.addEventListener('resize', handleResize);

      // Save instances for later use
      setChartInstance(chart);
      setSeries(lineSeries);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
        setChartInstance(null);
        setSeries(null);
      };
    });
  }, [visibleData, height]);

  // Reveal the full chart when triggered
  const revealFullChart = () => {
    if (series && allData.length && !isRevealed) {
      series.setData(allData);
      setIsRevealed(true);
      return true;
    }
    return false;
  };

  return (
    <div className="historical-chart-container">
      {isLoading && (
        <div className="loading-overlay" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 10,
        }}>
          <div>Loading chart data...</div>
        </div>
      )}

      {error && (
        <div className="error-message" style={{
          textAlign: 'center',
          padding: '20px',
          color: 'red',
        }}>
          {error}
        </div>
      )}

      <div 
        ref={chartContainerRef} 
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: `${height}px`,
          position: 'relative',
        }}
      >
        {/* Chart will be rendered here */}
      </div>

      {/* Expose reveal function to parent components */}
      {typeof window !== 'undefined' && (window as any).__revealChart = revealFullChart}
    </div>
  );
} 