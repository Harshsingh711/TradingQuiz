'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface ChartComponentProps {
  height?: number;
  width?: string | number;
  onReady?: (hasData: boolean) => void;
}

export default function ChartComponent({ 
  height = 450, 
  width = '100%',
  onReady
}: ChartComponentProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [allData, setAllData] = useState<any[]>([]);
  const [visibleData, setVisibleData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  
  // For storing chart instances (to avoid TypeScript errors)
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  // Generate static sample data for fallback
  const generateStaticData = () => {
    console.log('Using static test data as fallback');
    const data = [];
    const basePrice = 35000; // Base BTC price
    const now = Math.floor(Date.now() / 1000);
    const dayInSeconds = 86400;
    
    // Generate 180 days of data with more pronounced movements
    for (let i = 0; i < 180; i++) {
      // Create more dramatic price movements
      const volatility = (Math.random() - 0.5) * 1000; // Increased volatility
      const trend = Math.sin(i / 20) * 3000; // More pronounced sine wave
      
      data.push({
        time: now - (180 - i) * dayInSeconds,
        value: basePrice + trend + volatility + (i * 30) // Steeper overall uptrend
      });
    }
    return data;
  };

  // Fetch historical data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching BTC data from API...');
        
        try {
          // Try our backend API first
          const response = await axios.get('/api/quiz/btc-history?days=180');
          console.log('API Response:', response);
          
          if (response.data && response.data.data && response.data.data.length > 0) {
            const data = response.data.data;
            console.log(`Received ${data.length} data points`);
            processDataAndDisplay(data);
            return;
          } else {
            throw new Error('Invalid data format received');
          }
        } catch (apiError: any) {
          console.error('API error, falling back to direct CoinGecko fetch:', apiError);
          
          try {
            // Fallback: Fetch directly from CoinGecko
            const days = 180;
            const endTime = Math.floor(Date.now() / 1000);
            const startTime = endTime - (days * 24 * 60 * 60);
            
            const coinGeckoResponse = await axios.get(
              `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range`,
              {
                params: {
                  vs_currency: 'usd',
                  from: startTime,
                  to: endTime
                }
              }
            );
            
            if (coinGeckoResponse.data && coinGeckoResponse.data.prices) {
              const priceData = coinGeckoResponse.data.prices.map((item: [number, number]) => ({
                time: item[0] / 1000, // Convert from milliseconds to seconds
                value: item[1] // Price in USD
              }));
              
              console.log(`Received ${priceData.length} data points from CoinGecko`);
              processDataAndDisplay(priceData);
              return;
            } else {
              throw new Error('Failed to fetch data from CoinGecko');
            }
          } catch (geckoError: any) {
            console.error('CoinGecko fetch also failed:', geckoError);
            // Continue to fallback below
          }
        }
        
        // If we get here, both API attempts failed, use static data
        const staticData = generateStaticData();
        processDataAndDisplay(staticData);
        
      } catch (err: any) {
        console.error('All fetch attempts failed:', err);
        console.error('Error details:', err.response?.data || err.message);
        
        // Try the static data as a last resort
        try {
          const staticData = generateStaticData();
          processDataAndDisplay(staticData);
        } catch (finalError) {
          setError(`Failed to load chart data: ${err.response?.data?.error || err.message}`);
          if (onReady) {
            onReady(false);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    const processDataAndDisplay = (data: any[]) => {
      setAllData(data);
      
      // Generate a random cutoff point between 60% and 80% of the data
      const minCutoff = Math.floor(data.length * 0.6);
      const maxCutoff = Math.floor(data.length * 0.8);
      const randomCutoff = Math.floor(Math.random() * (maxCutoff - minCutoff + 1)) + minCutoff;
      
      console.log(`Setting cutoff at index ${randomCutoff} out of ${data.length}`);
      setVisibleData(data.slice(0, randomCutoff));
      
      if (onReady) {
        onReady(true);
      }
    };

    fetchData();
  }, [onReady]);

  // Initialize chart with enhanced visuals
  useEffect(() => {
    if (!chartContainerRef.current || !visibleData.length) return;

    // Cleanup previous chart if exists
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    let cleanupFunction: () => void = () => {};

    // Dynamic import to avoid TypeScript errors with the chart library
    import('lightweight-charts').then((module) => {
      try {
        const { createChart } = module;

        // Create the chart with improved styling
        const chart = createChart(chartContainerRef.current!, {
          width: chartContainerRef.current!.clientWidth,
          height: height,
          layout: {
            background: { color: '#ffffff' },
            textColor: '#333',
            fontSize: 12,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          grid: {
            vertLines: { color: '#f0f3fa', style: 1 },
            horzLines: { color: '#f0f3fa', style: 1 },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: '#D1D4DC',
            borderVisible: true,
            tickMarkFormatter: (timestamp: number) => {
              const date = new Date(timestamp * 1000);
              return date.getDate() + '/' + (date.getMonth() + 1);
            },
          },
          rightPriceScale: {
            borderColor: '#D1D4DC',
            borderVisible: true,
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          },
          crosshair: {
            vertLine: {
              color: 'rgba(59, 130, 246, 0.7)', // Blue for crosshair
              width: 1,
              style: 1,
              labelBackgroundColor: '#3b82f6',
            },
            horzLine: {
              color: 'rgba(59, 130, 246, 0.7)',
              width: 1,
              style: 1,
              labelBackgroundColor: '#3b82f6',
            },
            mode: 1,
          },
          handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
          },
        });

        // Create an area series instead of line for better visibility
        const series = (chart as any).addAreaSeries({
          topColor: 'rgba(59, 130, 246, 0.4)',
          bottomColor: 'rgba(59, 130, 246, 0.0)',
          lineColor: '#3b82f6',
          lineWidth: 2,
          title: 'BTC/USD',
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
        });

        // Set visible data
        series.setData(visibleData);

        // Apply price formatting
        series.applyOptions({
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
        });

        // Fit content to visible area
        setTimeout(() => {
          chart.timeScale().fitContent();
        }, 100);

        // Handle window resize
        const handleResize = () => {
          if (chartContainerRef.current) {
            chart.applyOptions({ 
              width: chartContainerRef.current.clientWidth 
            });
            chart.timeScale().fitContent();
          }
        };

        window.addEventListener('resize', handleResize);

        // Store references
        chartRef.current = chart;
        seriesRef.current = series;

        // Set up cleanup
        cleanupFunction = () => {
          window.removeEventListener('resize', handleResize);
          chart.remove();
        };
      } catch (err) {
        console.error('Error creating chart:', err);
      }
    });

    // Return cleanup function
    return () => cleanupFunction();
  }, [visibleData, height]);

  // Reveal function to show the full chart
  const revealFullChart = () => {
    if (seriesRef.current && allData.length && !isRevealed) {
      seriesRef.current.setData(allData);
      setIsRevealed(true);
      return true;
    }
    return false;
  };

  // Make reveal function available globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__revealChart = revealFullChart;
    }

    return () => {
      if (typeof window !== 'undefined') {
        (window as any).__revealChart = undefined;
      }
    };
  }, [allData, isRevealed]);

  return (
    <div className="chart-container" style={{ 
      position: 'relative',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#ffffff',
    }}>
      {isLoading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
          textAlign: 'center',
          padding: '20px',
          color: '#ef4444',
          backgroundColor: '#fef2f2',
          borderRadius: '6px',
          margin: '10px',
          border: '1px solid #fee2e2',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Error</div>
          {error}
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            Try refreshing the page to load data again.
          </div>
        </div>
      )}

      <div 
        ref={chartContainerRef} 
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: `${height}px`,
        }}
      />
    </div>
  );
} 