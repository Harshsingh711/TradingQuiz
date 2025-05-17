'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

// Remove explicit imports to avoid version mismatches
// import type { IChartApi, DeepPartial, ChartOptions, CandlestickSeriesOptions, HistogramSeriesOptions } from 'lightweight-charts';

interface ChartProps {
  height?: number;
  width?: string | number;
  onReady?: (hasData: boolean) => void;
}

type CandlestickData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type TimeFrame = '1h' | '4h' | '1d' | '1w';

export default function AdvancedBTCChart({ height = 450, width = '100%', onReady }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cutoffIndex, setCutoffIndex] = useState<number | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeFrame>('1d');
  
  // References to store chart instances
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const toolbarRef = useRef<any>(null);

  // Generate fallback candle data
  const generateFallbackData = () => {
    const fallbackData: CandlestickData[] = [];
    const basePrice = 35000;
    const now = Math.floor(Date.now() / 1000);
    const dayInSeconds = 86400;
    
    for (let i = 0; i < 180; i++) {
      const dayOffset = 179 - i; // Reverse order for older -> newer
      const timestamp = now - (dayOffset * dayInSeconds);
      
      const volatility = Math.random() * 1000;
      const trend = Math.sin(i / 20) * 3000;
      const baseForDay = basePrice + trend + (i * 30);
      
      const open = baseForDay + (Math.random() - 0.5) * volatility;
      const close = baseForDay + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      
      fallbackData.push({
        time: timestamp,
        open,
        high,
        low,
        close
      });
    }
    
    return fallbackData;
  };

  // Transform line data to candlestick data
  const transformLineDataToCandlestick = (lineData: any[]) => {
    // Sort data by time
    lineData.sort((a, b) => a.time - b.time);
    
    // Group data into days
    const dayGroups: Record<string, number[]> = {};
    
    lineData.forEach(point => {
      const date = new Date(point.time * 1000);
      const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      
      if (!dayGroups[dayKey]) {
        dayGroups[dayKey] = [];
      }
      
      dayGroups[dayKey].push(point.value);
    });
    
    // Convert each day's data into a candlestick
    const candlesticks: CandlestickData[] = [];
    
    Object.entries(dayGroups).forEach(([dayKey, values]) => {
      if (values.length < 2) return; // Need at least 2 data points
      
      const open = values[0];
      const close = values[values.length - 1];
      const high = Math.max(...values);
      const low = Math.min(...values);
      
      // Convert day key back to timestamp
      const [year, month, day] = dayKey.split('-').map(Number);
      const time = new Date(year, month - 1, day).getTime() / 1000;
      
      candlesticks.push({ time, open, high, low, close });
    });
    
    return candlesticks;
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
            // Transform line data to candlestick data
            const candleData = transformLineDataToCandlestick(response.data.data);
            
            if (candleData.length > 0) {
              // Generate cutoff index
              const minCutoff = Math.floor(candleData.length * 0.6);
              const maxCutoff = Math.floor(candleData.length * 0.8);
              const randomCutoff = Math.floor(Math.random() * (maxCutoff - minCutoff + 1)) + minCutoff;
              
              setCandleData(candleData);
              setCutoffIndex(randomCutoff);
              
              if (onReady) onReady(true);
              return;
            }
          }
          throw new Error('Invalid data format or insufficient data points');
        } catch (e) {
          console.error("API fetch failed, using fallback data", e);
        }
        
        // Use fallback data if API fails
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
  }, [onReady]);

  // Initialize and manage chart
  useEffect(() => {
    if (!chartContainerRef.current || !candleData.length || cutoffIndex === null) {
      console.log('Chart initialization skipped due to missing data or refs', { 
        hasContainer: !!chartContainerRef.current, 
        candleDataLength: candleData.length, 
        cutoffIndex 
      });
      return;
    }
    
    console.log('Initializing chart with data', { 
      containerWidth: chartContainerRef.current.clientWidth,
      containerHeight: chartContainerRef.current.clientHeight,
      dataPoints: candleData.length,
      cutoffIndex
    });
    
    // Clean up any existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }
    
    // Dynamically import the library
    import('lightweight-charts').then(module => {
      try {
        console.log('Lightweight charts module loaded', module);
        const { createChart } = module;
        
        // Display data (sliced if not showing full)
        const displayData = showFull ? candleData : candleData.slice(0, cutoffIndex);
        console.log('Chart display data prepared', { 
          points: displayData.length,
          firstPoint: displayData[0],
          lastPoint: displayData[displayData.length - 1] 
        });
        
        // Use any type to bypass TypeScript errors
        const chartOptions: any = {
          width: chartContainerRef.current!.clientWidth,
          height: chartContainerRef.current!.clientHeight,
          layout: {
            background: { type: 'solid', color: '#ffffff' },
            textColor: '#333333',
            fontSize: 12,
            fontFamily: 'Trebuchet MS, Roboto, Ubuntu, sans-serif',
          },
          grid: {
            vertLines: { color: '#f0f3fa' },
            horzLines: { color: '#f0f3fa' },
          },
          crosshair: {
            mode: 1,
            vertLine: {
              color: 'rgba(59, 130, 246, 0.5)',
              width: 1,
              style: 1,
              labelBackgroundColor: '#3b82f6',
            },
            horzLine: {
              color: 'rgba(59, 130, 246, 0.5)',
              width: 1,
              style: 1,
              labelBackgroundColor: '#3b82f6',
            },
          },
          timeScale: {
            rightOffset: 5,
            barSpacing: 10,
            fixLeftEdge: true,
            lockVisibleTimeRangeOnResize: true,
            rightBarStaysOnScroll: true,
            borderVisible: true,
            borderColor: '#d1d4dc',
            visible: true,
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            borderColor: '#d1d4dc',
            borderVisible: true,
            scaleMargins: {
              top: 0.1,
              bottom: 0.2,
            },
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: true,
          },
          handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
          },
        };
        
        // Cast chart as any to avoid TypeScript errors
        const chart = createChart(chartContainerRef.current!, chartOptions) as any;
        console.log('Chart instance created successfully', chart);
        
        // Store the chart instance
        chartRef.current = chart;
        
        // Add candlestick series
        const candlestickOptions: any = {
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        };
        
        const candlestickSeries = chart.addCandlestickSeries(candlestickOptions);
        
        candlestickSeriesRef.current = candlestickSeries;
        candlestickSeries.setData(displayData);
        
        // Calculate volume data from candles
        const volumeData = displayData.map(candle => {
          const volumeValue = Math.abs(candle.close - candle.open) * 1000000; // Simulated volume based on price movement
          return {
            time: candle.time,
            value: volumeValue,
            color: candle.close > candle.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
          };
        });
        
        // Add volume histogram
        const volumeOptions: any = {
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',
          scaleMargins: {
            top: 0.82,
            bottom: 0,
          },
        };
        
        const volumeSeries = chart.addHistogramSeries(volumeOptions);
        
        volumeSeriesRef.current = volumeSeries;
        volumeSeries.setData(volumeData);
        
        // Add timeframe label
        const timeframeLabel = document.createElement('div');
        timeframeLabel.style.position = 'absolute';
        timeframeLabel.style.top = '10px';
        timeframeLabel.style.right = '10px';
        timeframeLabel.style.padding = '5px 10px';
        timeframeLabel.style.backgroundColor = 'rgba(250, 250, 250, 0.6)';
        timeframeLabel.style.borderRadius = '3px';
        timeframeLabel.style.fontSize = '12px';
        timeframeLabel.style.fontWeight = 'bold';
        timeframeLabel.style.color = '#333';
        timeframeLabel.textContent = `Timeframe: ${timeframe}`;
        chartContainerRef.current!.appendChild(timeframeLabel);
        
        // Fit the visible range to the data
        chart.timeScale().fitContent();
        
        // Handle resize
        const handleResize = () => {
          if (chartContainerRef.current && chartRef.current) {
            chart.applyOptions({
              width: chartContainerRef.current.clientWidth,
              height: chartContainerRef.current.clientHeight,
            });
          }
        };
        
        window.addEventListener('resize', handleResize);
        
        // Return cleanup function
        return () => {
          window.removeEventListener('resize', handleResize);
          if (chartRef.current) {
            chart.remove();
            chartRef.current = null;
            candlestickSeriesRef.current = null;
            volumeSeriesRef.current = null;
          }
          if (timeframeLabel.parentNode) {
            timeframeLabel.parentNode.removeChild(timeframeLabel);
          }
        };
      } catch (err) {
        console.error('Error creating chart:', err);
        console.error('Chart container details:', {
          width: chartContainerRef.current?.clientWidth,
          height: chartContainerRef.current?.clientHeight,
          offsetWidth: chartContainerRef.current?.offsetWidth,
          offsetHeight: chartContainerRef.current?.offsetHeight
        });
        setError('Failed to create chart');
      }
    }).catch(err => {
      console.error('Error importing lightweight-charts:', err);
      setError('Failed to load chart library');
    });
  }, [candleData, cutoffIndex, showFull, timeframe]);

  // Create timeframe selector
  useEffect(() => {
    if (!controlsRef.current) return;
    
    const controlsDiv = controlsRef.current;
    controlsDiv.innerHTML = '';
    
    const timeframes: TimeFrame[] = ['1h', '4h', '1d', '1w'];
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '5px';
    buttonsContainer.style.padding = '5px';
    
    timeframes.forEach(tf => {
      const button = document.createElement('button');
      button.textContent = tf;
      button.style.padding = '3px 8px';
      button.style.cursor = 'pointer';
      button.style.border = '1px solid #d1d4dc';
      button.style.borderRadius = '3px';
      button.style.backgroundColor = tf === timeframe ? '#3b82f6' : '#ffffff';
      button.style.color = tf === timeframe ? '#ffffff' : '#333333';
      button.style.fontSize = '12px';
      button.style.fontWeight = 'bold';
      
      button.addEventListener('click', () => {
        setTimeframe(tf);
      });
      
      buttonsContainer.appendChild(button);
    });
    
    controlsDiv.appendChild(buttonsContainer);
    
    // Drawing tools button
    const drawingButton = document.createElement('button');
    drawingButton.textContent = '📝 Draw';
    drawingButton.style.padding = '3px 8px';
    drawingButton.style.cursor = 'pointer';
    drawingButton.style.border = '1px solid #d1d4dc';
    drawingButton.style.borderRadius = '3px';
    drawingButton.style.backgroundColor = '#ffffff';
    drawingButton.style.color = '#333333';
    drawingButton.style.fontSize = '12px';
    drawingButton.style.fontWeight = 'bold';
    drawingButton.style.marginLeft = '10px';
    
    drawingButton.addEventListener('click', () => {
      alert('Drawing tools are a premium feature - coming soon!');
    });
    
    buttonsContainer.appendChild(drawingButton);
    
  }, [timeframe]);

  // Reveal function
  const revealChart = () => {
    if (!showFull && candlestickSeriesRef.current) {
      setShowFull(true);
      candlestickSeriesRef.current.setData(candleData);
      
      // Update volume data
      if (volumeSeriesRef.current) {
        const volumeData = candleData.map(candle => {
          const volumeValue = Math.abs(candle.close - candle.open) * 1000000;
          return {
            time: candle.time,
            value: volumeValue,
            color: candle.close > candle.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
          };
        });
        
        volumeSeriesRef.current.setData(volumeData);
      }
      
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
  }, [candleData]);
  
  return (
    <div style={{ 
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      position: 'relative',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Chart controls */}
      <div 
        ref={controlsRef} 
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          padding: '5px 10px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          height: '32px',
        }}
      />
      
      {/* Chart container */}
      <div 
        ref={chartContainerRef}
        style={{
          flex: 1,
          position: 'relative',
        }}
      />
      
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
    </div>
  );
} 