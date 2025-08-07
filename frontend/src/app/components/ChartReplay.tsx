import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
  onQuizComplete?: (result: {
    totalPercentGain: number,
    finalBalance: number,
    eloChange: number,
    newElo: number,
    quizDuration: number,
    candlesUsed: number,
    reason: 'timeLimit' | 'candleLimit' | 'manual'
  }) => void;
  isQuizMode?: boolean;
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
  onTradeComplete,
  onQuizComplete,
  isQuizMode = false
}: ChartReplayProps) {
  // Get auth context for ELO updates
  const { user, updateUserElo, token } = useAuth();
  
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
  
  // State for chart scaling and panning
  const [chartScale, setChartScale] = useState({
    timeScale: 1, // Horizontal zoom level
    priceScale: 1, // Vertical zoom level
    priceOffset: 0, // Vertical pan offset
    visibleCandles: 80 // Number of candles to show
  });
  
  // State for hover tooltip
  const [hoverInfo, setHoverInfo] = useState<{
    visible: boolean;
    x: number;
    y: number;
    candle: CandlestickData | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    candle: null
  });
  
  // Quiz-specific state
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(600); // 10 minutes in seconds
  const [candlePointsUsed, setCandlePointsUsed] = useState(0);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [playerElo, setPlayerElo] = useState(() => {
    // Load ELO from user profile first, then localStorage, or default to 1200
    if (user?.eloScore) {
      return user.eloScore;
    }
    if (typeof window !== 'undefined') {
      const savedElo = localStorage.getItem('tradingQuizElo');
      return savedElo ? parseInt(savedElo, 10) : 1200;
    }
    return 1200;
  });
  const [initialBalance, setInitialBalance] = useState(100000);
  const [quizStartIndex, setQuizStartIndex] = useState(0);
  
  // Update playerElo when user profile changes
  useEffect(() => {
    if (user?.eloScore && user.eloScore !== playerElo) {
      setPlayerElo(user.eloScore);
    }
  }, [user?.eloScore]);

  // Generate sample candle data with proper structure
  const generateCandleData = (): CandlestickData[] => {
    const data: CandlestickData[] = [];
    const basePrice = 104000; // Current BTC price range (around $104k as shown in the image)
    const now = Math.floor(Date.now() / 1000);
    
    // Determine interval based on timeframe
    let interval = 3600; // Default to 1h
    if (timeframe === '1m') interval = 60;
    if (timeframe === '5m') interval = 300;
    if (timeframe === '15m') interval = 900;
    if (timeframe === '30m') interval = 1800;
    
    // Create 1000 candles with realistic market movements
    let currentPrice = basePrice;
    let trend = 0; // -1 to 1, represents current market trend
    let trendStrength = 0;
    let volatility = 0.015; // Base volatility (1.5% for more realistic BTC movements)
    
    for (let i = 0; i < 1000; i++) {
      const timestamp = now - ((1000 - i) * interval);
      
      // Create realistic market cycles and trend changes
      if (i % 30 === 0 || Math.random() < 0.03) {
        // Change trend every ~30 candles or randomly (3% chance)
        trend = (Math.random() - 0.5) * 2; // Random trend between -1 and 1
        trendStrength = Math.random() * 0.3 + 0.1; // Trend strength 0.1 to 0.4
        volatility = Math.random() * 0.02 + 0.01; // Volatility 1% to 3%
      }
      
      // Calculate price movement for this candle
      const trendMove = trend * trendStrength * (Math.random() * 0.7 + 0.3); // 30-100% of trend
      const randomMove = (Math.random() - 0.5) * volatility * 2; // Random noise
      const priceChange = (trendMove + randomMove) / 100; // Convert to percentage
      
      // Calculate open price (close to previous close with small gap)
      const prevClose = i > 0 ? data[i-1].close : currentPrice;
      const gapSize = (Math.random() - 0.5) * 0.001; // Very small gap between candles
      const open = prevClose * (1 + gapSize);
      
      // Calculate close price based on trend and volatility
      const close = open * (1 + priceChange);
      
      // Generate realistic high and low with proper wick behavior
      const bodySize = Math.abs(close - open);
      const wickMultiplier = Math.random() * 1.5 + 0.3; // Wicks 0.3x to 1.8x body size
      
      // Create asymmetric wicks (more realistic)
      const upperWick = bodySize * wickMultiplier * Math.random();
      const lowerWick = bodySize * wickMultiplier * Math.random();
      
      const high = Math.max(open, close) + upperWick;
      const low = Math.min(open, close) - lowerWick;
      
      // Ensure high >= max(open, close) and low <= min(open, close)
      const finalHigh = Math.max(high, Math.max(open, close));
      const finalLow = Math.min(low, Math.min(open, close));
      
      // Generate volume that correlates with price movement and volatility
      const priceMovement = Math.abs(close - open) / open;
      const baseVolume = 800 + Math.random() * 1200; // Base volume range
      const volumeMultiplier = 1 + (priceMovement * 8) + (volatility * 4);
      const volume = baseVolume * volumeMultiplier;
      
      data.push({
        time: timestamp,
        open: Math.max(0, open),
        high: Math.max(0, finalHigh),
        low: Math.max(0, finalLow),
        close: Math.max(0, close),
        volume: Math.floor(volume)
      });
      
      currentPrice = close;
    }
    
    return data;
  };

  // Fetch or generate data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // For now, let's use our improved simulated data that looks realistic
        // We can add real API integration later with proper OHLC endpoints
        console.log(`Generating realistic Bitcoin data for ${timeframe} timeframe`);
        const simulatedData = generateCandleData();
        setCandleData(simulatedData);
        
        // Set the initial position to show a good amount of historical data
        // Start at 80% through the data to ensure we have history to look back on
        const initialPosition = Math.floor(simulatedData.length * 0.8);
        setCurrentIndex(initialPosition);
        
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

  // Candle point values based on timeframe
  const getCandlePoints = (timeframe: string): number => {
    switch (timeframe) {
      case '1m': return 1;
      case '5m': return 5;
      case '15m': return 15;
      case '30m': return 30;
      case '1h': return 60;
      default: return 1;
    }
  };

  // Start quiz
  const startQuiz = () => {
    if (!isQuizMode) return;
    
    setIsQuizActive(true);
    setQuizStartTime(Date.now());
    setQuizTimeRemaining(600); // 10 minutes
    setCandlePointsUsed(0);
    setInitialBalance(balance);
    setQuizStartIndex(currentIndex);
    setPositions([]); // Clear previous trades
    setCurrentPosition(null);
  };

  // Function to update ELO in database
  const updateEloInDatabase = async (newElo: number) => {
    console.log('Attempting to update ELO in database:', { newElo, token: !!token, user: user?.username });
    
    if (!token) {
      console.warn('No authentication token available, skipping database ELO update');
      return;
    }
    
    if (!user) {
      console.warn('No user available, skipping database ELO update');
      return;
    }
    
    try {
      console.log('Making PUT request to /api/profile/elo');
      const response = await axios.put('/api/profile/elo', 
        { eloScore: newElo },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('ELO updated successfully in database:', response.data);
    } catch (error) {
      console.error('Error updating ELO in database:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        console.error('Request headers:', error.config?.headers);
      }
    }
  };

  // End quiz
  const endQuiz = async (reason: 'timeLimit' | 'candleLimit' | 'manual') => {
    if (!isQuizActive || !quizStartTime) return;
    
    const quizDuration = (Date.now() - quizStartTime) / 1000; // in seconds
    const totalPercentGain = ((balance - initialBalance) / initialBalance) * 100;
    
    // Calculate ELO change based on performance
    // Positive gain = ELO increase, negative = ELO decrease
    // Scale: every 1% gain/loss = 10 ELO points, capped at ±100
    const eloChange = Math.max(-100, Math.min(100, Math.round(totalPercentGain * 10)));
    const newElo = playerElo + eloChange;
    
    // Update ELO in auth context (this will update navigation and profile)
    await updateUserElo(newElo);
    
    // Update ELO in database
    updateEloInDatabase(newElo);
    
    // Also save to localStorage for backwards compatibility
    if (typeof window !== 'undefined') {
      localStorage.setItem('tradingQuizElo', newElo.toString());
    }
    
    setPlayerElo(newElo);
    setIsQuizActive(false);
    setIsPlaying(false); // Stop playback
    
    console.log('Quiz completed - ELO change:', eloChange, 'New ELO:', newElo, 'Performance:', totalPercentGain + '%');
    
    if (onQuizComplete) {
      onQuizComplete({
        totalPercentGain,
        finalBalance: balance,
        eloChange,
        newElo,
        quizDuration,
        candlesUsed: candlePointsUsed,
        reason
      });
    }
  };

  // Quiz timer effect
  useEffect(() => {
    if (!isQuizActive || !isQuizMode) return;
    
    const timer = setInterval(() => {
      setQuizTimeRemaining(prev => {
        if (prev <= 1) {
          endQuiz('timeLimit').catch(console.error);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isQuizActive, isQuizMode]);

  // Check candle limit
  useEffect(() => {
    if (isQuizActive && candlePointsUsed >= 5000) {
      endQuiz('candleLimit').catch(console.error);
    }
  }, [candlePointsUsed, isQuizActive]);

  // Handle playing through chart data (modified for quiz)
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
        
        // Track candle points used in quiz mode
        if (isQuizActive && isQuizMode) {
          setCandlePointsUsed(prev => prev + getCandlePoints(timeframe));
        }
        
        // Check if we've reached the end
        if (newIndex >= candleData.length - 1) {
          setIsPlaying(false);
          return candleData.length - 1;
        }
        
        return newIndex;
      });
    }, delay);
    
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, candleData.length, timeframe, playbackSpeed, isQuizActive, isQuizMode]);

  // Add mouse interaction for dragging the chart and scaling
  useEffect(() => {
    if (!canvasRef.current || candleData.length === 0) return;
    
    const canvas = canvasRef.current;
    let isDragging = false;
    let isDraggingPrice = false;
    let isDraggingChart = false;
    let lastX = 0;
    let lastY = 0;
    let dragAccumulator = 0;
    let initialMouseY = 0;
    let initialPriceRange = 0;
    
    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if clicking on price axis (right side) - make the hit area larger
      if (x > canvas.offsetWidth - 85) { // Increased hit area from 80 to 85
        isDraggingPrice = true;
        canvas.style.cursor = 'ns-resize';
        initialMouseY = e.clientY;
        // Store initial price range for scaling calculations
        const visibleCount = chartScale.visibleCandles;
        const startIdx = Math.max(0, currentIndex - visibleCount + 1);
        const visibleData = candleData.slice(startIdx, currentIndex + 1);
        let minPrice = Number.MAX_VALUE;
        let maxPrice = Number.MIN_VALUE;
        for (const candle of visibleData) {
          if (candle.low < minPrice) minPrice = candle.low;
          if (candle.high > maxPrice) maxPrice = candle.high;
        }
        initialPriceRange = maxPrice - minPrice;
      } else if (e.shiftKey) {
        // Shift + drag for vertical chart movement
        isDraggingChart = true;
        canvas.style.cursor = 'move';
      } else {
        // Regular horizontal dragging
        isDragging = true;
        canvas.style.cursor = 'grabbing';
      }
      
      lastX = e.clientX;
      lastY = e.clientY;
      dragAccumulator = 0;
      
      // Hide tooltip when dragging
      setHoverInfo(prev => ({ ...prev, visible: false }));
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update cursor based on position and keys
      if (!isDragging && !isDraggingPrice && !isDraggingChart) {
        if (x > canvas.offsetWidth - 85) { // Increased hit area
          canvas.style.cursor = 'ns-resize';
        } else if (e.shiftKey) {
          canvas.style.cursor = 'move';
        } else {
          canvas.style.cursor = 'grab';
        }
        
        // Handle hover tooltip when not dragging
        const margin = { top: 30, right: 80, bottom: 60, left: 60 };
        if (x >= margin.left && x <= canvas.offsetWidth - margin.right && 
            y >= margin.top && y <= canvas.offsetHeight - margin.bottom) {
          
          // Calculate which candle we're hovering over
          const visibleCount = chartScale.visibleCandles;
          const startIdx = Math.max(0, currentIndex - visibleCount + 1);
          const visibleData = candleData.slice(startIdx, currentIndex + 1);
          const chartWidth = canvas.offsetWidth - margin.left - margin.right;
          const candleWidth = chartWidth / Math.max(visibleData.length, 1);
          const candleIndex = Math.floor((x - margin.left) / candleWidth);
          
          if (candleIndex >= 0 && candleIndex < visibleData.length) {
            const candle = visibleData[candleIndex];
            setHoverInfo({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              candle: candle
            });
          } else {
            setHoverInfo(prev => ({ ...prev, visible: false }));
          }
        } else {
          setHoverInfo(prev => ({ ...prev, visible: false }));
        }
      }
      
      if (isDraggingPrice) {
        const deltaY = e.clientY - initialMouseY;
        
        // Calculate new price scale based on mouse movement
        // Moving up = zoom in (increase scale), moving down = zoom out (decrease scale)
        const sensitivity = 300; // Increased sensitivity for better control
        const scaleFactor = 1 - (deltaY / sensitivity); // Inverted for natural feel
        const newPriceScale = Math.max(0.1, Math.min(10, scaleFactor));
        
        setChartScale(prev => ({
          ...prev,
          priceScale: newPriceScale
        }));
      } else if (isDraggingChart) {
        const deltaY = e.clientY - lastY;
        lastY = e.clientY;
        
        // Vertical chart movement (shift + drag)
        setChartScale(prev => ({
          ...prev,
          priceOffset: prev.priceOffset - deltaY * 2 // Inverted for natural feel
        }));
      } else if (isDragging) {
        const deltaX = e.clientX - lastX;
        lastX = e.clientX;
        
        // Accumulate small movements to prevent jittery updates
        dragAccumulator += deltaX;
        
        // Only update when we have accumulated enough movement
        if (Math.abs(dragAccumulator) > 10) {
          const direction = dragAccumulator > 0 ? -1 : 1;
          const step = Math.ceil(Math.abs(dragAccumulator) / 10);
          
          setCurrentIndex(prevIndex => {
            const newIndex = prevIndex + (direction * step);
            // Ensure we stay within bounds
            return Math.min(
              candleData.length - 10, 
              Math.max(chartScale.visibleCandles, newIndex)
            );
          });
          
          // Reset accumulator after applying movement
          dragAccumulator = 0;
        }
      }
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      isDraggingPrice = false;
      isDraggingChart = false;
      dragAccumulator = 0;
      canvas.style.cursor = 'grab';
    };
    
    const handleMouseLeave = () => {
      isDragging = false;
      isDraggingPrice = false;
      isDraggingChart = false;
      dragAccumulator = 0;
      canvas.style.cursor = 'grab';
      setHoverInfo(prev => ({ ...prev, visible: false }));
    };
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const isOverPriceAxis = x > canvas.offsetWidth - 85; // Match the improved hit area
      
      if (e.ctrlKey || e.metaKey || isOverPriceAxis) {
        // Vertical zoom (price axis)
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        setChartScale(prev => ({
          ...prev,
          priceScale: Math.max(0.1, Math.min(10, prev.priceScale * zoomFactor))
        }));
      } else if (e.shiftKey) {
        // Vertical panning with shift + scroll
        setChartScale(prev => ({
          ...prev,
          priceOffset: prev.priceOffset + (e.deltaY * 0.5)
        }));
      } else {
        // Horizontal zoom (time axis)
        const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
        setChartScale(prev => {
          const newVisibleCandles = Math.max(20, Math.min(200, prev.visibleCandles * zoomFactor));
          return {
            ...prev,
            visibleCandles: Math.floor(newVisibleCandles)
          };
        });
      }
    };
    
    // Set initial cursor style
    canvas.style.cursor = 'grab';
    
    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    // Cleanup
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [candleData, chartScale, currentIndex]);

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
    
    // Calculate visible range using chartScale
    const visibleCount = chartScale.visibleCandles;
    const startIdx = Math.max(0, currentIndex - visibleCount + 1);
    const visibleData = candleData.slice(startIdx, currentIndex + 1);
    
    // Find min and max values for scaling
    let minPrice = Number.MAX_VALUE;
    let maxPrice = Number.MIN_VALUE;
    
    for (const candle of visibleData) {
      if (candle.low < minPrice) minPrice = candle.low;
      if (candle.high > maxPrice) maxPrice = candle.high;
    }
    
    // Ensure we have a reasonable price range
    if (minPrice === maxPrice) {
      const basePrice = minPrice || 35000;
      minPrice = basePrice * 0.99;
      maxPrice = basePrice * 1.01;
    }
    
    // Apply price scaling and offset
    const priceRange = (maxPrice - minPrice) / chartScale.priceScale;
    const centerPrice = (maxPrice + minPrice) / 2;
    minPrice = centerPrice - priceRange / 2 + (chartScale.priceOffset * priceRange / 100);
    maxPrice = centerPrice + priceRange / 2 + (chartScale.priceOffset * priceRange / 100);
    
    // Calculate dimensions and chart area
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const margin = { top: 30, right: 80, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#1e1e30';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#2a2a3c';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (price levels)
    const priceSteps = 8;
    for (let i = 0; i <= priceSteps; i++) {
      const y = margin.top + (i / priceSteps) * chartHeight;
      
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }
    
    // Draw price axis background first
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(width - margin.right, 0, margin.right, height);
    
    // Draw price axis border
    ctx.strokeStyle = '#2a2a3c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width - margin.right, 0);
    ctx.lineTo(width - margin.right, height);
    ctx.stroke();
    
    // Draw price labels on the RIGHT side (after background)
    for (let i = 0; i <= priceSteps; i++) {
      const y = margin.top + (i / priceSteps) * chartHeight;
      const price = maxPrice - (i / priceSteps) * (maxPrice - minPrice);
      
      ctx.fillStyle = '#f0f0f0';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(
        '$' + price.toLocaleString(undefined, { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 0 
        }), 
        width - margin.right + 8, 
        y + 4
      );
    }
    
    // Vertical grid lines (time intervals)
    const candleWidth = chartWidth / Math.max(visibleData.length, 1);
    const timeSteps = Math.max(5, Math.min(10, Math.floor(visibleData.length / 8)));
    
    for (let i = 0; i < visibleData.length; i += Math.max(1, Math.floor(visibleData.length / timeSteps))) {
      const x = margin.left + i * candleWidth + candleWidth / 2; // Center on candle
      
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, height - margin.bottom);
      ctx.stroke();
      
      // Time labels - improved formatting
      if (i < visibleData.length) {
        const candle = visibleData[i];
        const date = new Date(candle.time * 1000);
        let timeLabel;
        
        if (timeframe === '1m') {
          timeLabel = date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        } else if (timeframe === '5m' || timeframe === '15m') {
          timeLabel = date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        } else if (timeframe === '30m' || timeframe === '1h') {
          timeLabel = date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
          }) + ' ' + date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            hour12: false
          });
        } else {
          timeLabel = date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
          });
        }
        
        ctx.fillStyle = '#a0a0a0';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(timeLabel, x, height - margin.bottom + 15);
      }
    }
    
    // Draw volume histogram
    const maxVolume = Math.max(...visibleData.map(c => c.volume || 0));
    const volumeScale = maxVolume > 0 ? (chartHeight * 0.15) / maxVolume : 0;
    
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
        Math.max(candleWidth * 0.8, 1), 
        volumeHeight
      );
    }
    
    // Draw candlesticks
    for (let i = 0; i < visibleData.length; i++) {
      const candle = visibleData[i];
      const x = margin.left + i * candleWidth;
      
      // Scale price to y-coordinate
      const priceToY = (price: number) => {
        return margin.top + ((maxPrice - price) / (maxPrice - minPrice)) * chartHeight;
      };
      
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      
      const isGreen = candle.close >= candle.open;
      
      // Draw wick
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.strokeStyle = isGreen ? '#4CAF50' : '#FF5252';
      ctx.lineWidth = Math.max(1, candleWidth * 0.1);
      ctx.stroke();
      
      // Draw body
      const candleBodyWidth = Math.max(candleWidth * 0.7, 2);
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
      ctx.fillRect(width - margin.right + 1, priceY - 10, 70, 20);
      
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
      ctx.lineWidth = 2;
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
    
    // Draw scale indicators
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${chartScale.visibleCandles} bars`, width / 2, height - 5);
    ctx.fillText(`${(chartScale.priceScale * 100).toFixed(0)}%`, width - 40, height - 5);
    
    // Add visual indicator for price axis dragging area
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(width - margin.right, margin.top, margin.right, chartHeight);
    
    // Add small grip lines in the price axis area
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const gripY = margin.top + chartHeight / 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(width - 50, gripY + (i * 4));
      ctx.lineTo(width - 30, gripY + (i * 4));
      ctx.stroke();
    }
  }, [candleData, currentIndex, timeframe, currentPosition, chartScale]);

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

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      {/* Quiz Header (only show in quiz mode) */}
      {isQuizMode && (
        <div style={{
          display: 'flex',
          padding: '8px 12px',
          borderBottom: '1px solid #2a2a3c',
          backgroundColor: '#1a1a2e',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          minHeight: '40px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              color: quizTimeRemaining <= 60 ? '#FF5252' : '#f0f0f0', 
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              Time: {formatTime(quizTimeRemaining)}
            </div>
            <div style={{ 
              color: candlePointsUsed >= 4500 ? '#FF5252' : '#f0f0f0', 
              fontWeight: 'bold'
            }}>
              Candles: {candlePointsUsed}/5000
            </div>
            <div style={{ color: '#a0a0a0', fontSize: '14px' }}>
              ELO: {playerElo}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isQuizActive ? (
              <button
                onClick={startQuiz}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#4CAF50',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                Start Quiz
              </button>
            ) : (
              <button
                onClick={async () => await endQuiz('manual')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#FF5252',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                End Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        padding: '8px 12px',
        borderBottom: '1px solid #2a2a3c',
        backgroundColor: '#1e1e30',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
        minHeight: '40px',
      }}>
        {/* Timeframe selector */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['1m', '5m', '15m', '30m', '1h'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              disabled={isQuizActive} // Disable during quiz
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: timeframe === tf ? '#3b82f6' : '#2a2a3c',
                color: '#ffffff',
                cursor: isQuizActive ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: isQuizActive ? 0.6 : 1,
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
            disabled={isQuizActive} // Disable manual navigation during quiz
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#2a2a3c',
              color: '#ffffff',
              cursor: isQuizActive ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              opacity: isQuizActive ? 0.6 : 1,
            }}
          >
            ⏪
          </button>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!isQuizActive && isQuizMode} // In quiz mode, only allow play when quiz is active
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#2a2a3c',
              color: '#ffffff',
              cursor: (!isQuizActive && isQuizMode) ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              opacity: (!isQuizActive && isQuizMode) ? 0.6 : 1,
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <button
            onClick={() => setCurrentIndex(Math.min(candleData.length - 1, currentIndex + 10))}
            disabled={isQuizActive} // Disable manual navigation during quiz
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#2a2a3c',
              color: '#ffffff',
              cursor: isQuizActive ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              opacity: isQuizActive ? 0.6 : 1,
            }}
          >
            ⏩
          </button>
          
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            disabled={!isQuizActive && isQuizMode} // In quiz mode, only allow speed change when quiz is active
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#2a2a3c',
              color: '#ffffff',
              cursor: (!isQuizActive && isQuizMode) ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              opacity: (!isQuizActive && isQuizMode) ? 0.6 : 1,
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
        
        {/* Balance with P&L indicator */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isQuizMode && isQuizActive && (
            <div style={{ 
              fontSize: '12px',
              color: balance >= initialBalance ? '#4CAF50' : '#FF5252',
              fontWeight: 'bold'
            }}>
              P&L: {((balance - initialBalance) / initialBalance * 100).toFixed(2)}%
            </div>
          )}
          <div style={{ color: '#f0f0f0', fontSize: '14px', fontWeight: 'bold' }}>
            ${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
      
      {/* Chart area */}
      <div style={{ 
        flex: 1, 
        position: 'relative',
        minHeight: 0, // Allow flex item to shrink below content size
        overflow: 'hidden'
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
            display: 'block', // Remove any inline spacing
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
        flexShrink: 0, // Prevent trading controls from shrinking
        minHeight: '50px', // Ensure minimum height for buttons
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
        
        {/* Chart controls help text */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '12px',
          fontSize: '10px',
          color: '#666',
          textAlign: 'right',
        }}>
          <div>Drag: Pan • Shift+Drag: Vertical • Scroll: Zoom • Shift+Scroll: Vertical Pan</div>
        </div>
      </div>
      
      {/* OHLC Hover Tooltip */}
      {hoverInfo.visible && hoverInfo.candle && (
        <div style={{
          position: 'fixed',
          left: hoverInfo.x + 10,
          top: hoverInfo.y - 10,
          backgroundColor: '#2a2a3c',
          border: '1px solid #3a3a4c',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '12px',
          color: '#f0f0f0',
          zIndex: 1000,
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          minWidth: '120px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ffffff' }}>
            {new Date(hoverInfo.candle.time * 1000).toLocaleString()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ color: '#a0a0a0' }}>Open:</span>
            <span>${hoverInfo.candle.open.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ color: '#a0a0a0' }}>High:</span>
            <span style={{ color: '#4CAF50' }}>${hoverInfo.candle.high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ color: '#a0a0a0' }}>Low:</span>
            <span style={{ color: '#FF5252' }}>${hoverInfo.candle.low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ color: '#a0a0a0' }}>Close:</span>
            <span style={{ color: hoverInfo.candle.close >= hoverInfo.candle.open ? '#4CAF50' : '#FF5252' }}>
              ${hoverInfo.candle.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {hoverInfo.candle.volume && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #3a3a4c' }}>
              <span style={{ color: '#a0a0a0' }}>Volume:</span>
              <span>{hoverInfo.candle.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 