'use client';

import { useEffect, useRef, CSSProperties } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  width?: string | number;
  height?: string | number;
}

export default function TradingViewWidget({
  symbol = 'COINBASE:BTCUSD',
  theme = 'light',
  width = '100%',
  height = '500'
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Define the TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    
    // Define the widget configuration
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": symbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": theme,
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "withdateranges": true,
      "hide_side_toolbar": false,
      "allow_symbol_change": true,
      "details": true,
      "hotlist": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });

    // Clear any existing content and append the script
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme]); // Recreate when these props change

  return (
    <div 
      className="tradingview-widget-container" 
      ref={containerRef}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundColor: '#f3f4f6', // Light background while loading
      }}
    >
      <div className="tradingview-widget-loading" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        fontSize: '1rem',
        color: '#6b7280'
      }}>
        Loading TradingView Chart...
      </div>
    </div>
  );
}

// Add the TradingView type definition
declare global {
  interface Window {
    TradingView: any;
  }
} 