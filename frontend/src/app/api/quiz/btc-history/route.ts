import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Generate static sample data as fallback
const generateStaticData = () => {
  console.log('Using static test data in API route');
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

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = searchParams.get('days') || '180';
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value;
    
    console.log('API route called with days:', days);
    console.log('Token present:', !!token);
    
    // Create axios instance with increased timeout
    const axiosInstance = axios.create({
      timeout: 8000, // 8 second timeout
    });
    
    // Try CoinGecko API directly
    try {
      console.log('Fetching from CoinGecko directly');
      // Calculate time range
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - (parseInt(days) * 24 * 60 * 60);
      
      const coinGeckoResponse = await axiosInstance.get(
        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range`,
        {
          params: {
            vs_currency: 'usd',
            from: startTime,
            to: endTime
          },
          headers: {
            // Add user agent and accept headers to avoid rate limiting
            'User-Agent': 'TradingQuiz/1.0',
            'Accept': 'application/json',
          }
        }
      );
      
      // Process data
      const priceData = coinGeckoResponse.data.prices.map((item: [number, number]) => {
        return {
          time: item[0] / 1000, // Convert from milliseconds to seconds
          value: item[1] // Price in USD
        };
      });
      
      console.log(`Successfully fetched ${priceData.length} data points from CoinGecko`);
      
      return NextResponse.json({
        symbol: 'BTCUSD',
        data: priceData,
        source: 'coingecko'
      });
    } catch (coinGeckoError: any) {
      console.error('CoinGecko request failed:', coinGeckoError.message);
      
      // Check if the error is related to rate limiting (status 429)
      const isRateLimited = coinGeckoError.response?.status === 429;
      if (isRateLimited) {
        console.warn('CoinGecko rate limit reached, using static data');
        return NextResponse.json({
          symbol: 'BTCUSD',
          data: generateStaticData(),
          source: 'static-data'
        });
      }
      
      // Only try the backend if we have a token
      if (token) {
        try {
          // Try backend as fallback
          console.log('Trying backend API as fallback');
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/quiz/btc-history`;
          
          const response = await axiosInstance.get(apiUrl, {
            params: { days },
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          console.log('Backend response succeeded');
          return NextResponse.json({
            ...response.data,
            source: 'backend'
          });
        } catch (backendError: any) {
          console.error('Backend request also failed:', backendError.message);
          
          // Generate static data if all external sources fail
          console.log('All external sources failed, using static data');
          return NextResponse.json({
            symbol: 'BTCUSD',
            data: generateStaticData(),
            source: 'static-data'
          });
        }
      } else {
        // No token for backend, use static data
        console.log('No token available, using static data');
        return NextResponse.json({
          symbol: 'BTCUSD',
          data: generateStaticData(),
          source: 'static-data'
        });
      }
    }
  } catch (error: any) {
    console.error('Error in BTC history API route:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }
    
    // Always return some data, even in error cases
    return NextResponse.json({
      symbol: 'BTCUSD',
      data: generateStaticData(),
      source: 'static-data-error-fallback'
    });
  }
} 