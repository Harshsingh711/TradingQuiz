import { useEffect, useRef, useState, CSSProperties } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, Time, UTCTimestamp } from 'lightweight-charts';

interface TradingChartProps {
  height: number;
  width: number;
  historical?: boolean;
}

// Sample BTC/USD historical data
const sampleData: LineData[] = [
  { time: 1647734400 as UTCTimestamp, value: 41791.42 },
  { time: 1647820800 as UTCTimestamp, value: 41246.57 },
  { time: 1647907200 as UTCTimestamp, value: 42358.81 },
  { time: 1647993600 as UTCTimestamp, value: 42892.96 },
  { time: 1648080000 as UTCTimestamp, value: 43960.93 },
  { time: 1648166400 as UTCTimestamp, value: 44348.73 },
  { time: 1648252800 as UTCTimestamp, value: 44506.90 },
  { time: 1648339200 as UTCTimestamp, value: 46827.76 },
  { time: 1648425600 as UTCTimestamp, value: 47128.00 },
  { time: 1648512000 as UTCTimestamp, value: 47465.67 },
  { time: 1648598400 as UTCTimestamp, value: 47062.69 },
  { time: 1648684800 as UTCTimestamp, value: 45538.68 },
  { time: 1648771200 as UTCTimestamp, value: 46281.64 },
  { time: 1648857600 as UTCTimestamp, value: 45868.95 },
  { time: 1648944000 as UTCTimestamp, value: 46453.80 },
  { time: 1649030400 as UTCTimestamp, value: 46622.67 },
  { time: 1649116800 as UTCTimestamp, value: 45555.99 },
  { time: 1649203200 as UTCTimestamp, value: 45496.71 },
  { time: 1649289600 as UTCTimestamp, value: 43204.34 },
  { time: 1649376000 as UTCTimestamp, value: 42287.66 },
  { time: 1649462400 as UTCTimestamp, value: 42782.14 },
  { time: 1649548800 as UTCTimestamp, value: 42207.67 },
  { time: 1649635200 as UTCTimestamp, value: 39521.92 },
  { time: 1649721600 as UTCTimestamp, value: 40127.18 },
  { time: 1649808000 as UTCTimestamp, value: 41166.73 },
  { time: 1649894400 as UTCTimestamp, value: 39935.42 },
  { time: 1649980800 as UTCTimestamp, value: 40552.26 },
  { time: 1650067200 as UTCTimestamp, value: 40407.29 },
  { time: 1650153600 as UTCTimestamp, value: 39716.95 },
  { time: 1650240000 as UTCTimestamp, value: 40826.21 },
];

export default function TradingChart({ height, width, historical = true }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<"Line"> | null>(null);
  const [currentData, setCurrentData] = useState<LineData[]>([]);
  const [visibleRange, setVisibleRange] = useState({
    from: 0,
    to: historical ? sampleData.length - 1 : 10
  });

  // Create chart on mount
  useEffect(() => {
    if (chartContainerRef.current) {
      const newChart = createChart(chartContainerRef.current, {
        width,
        height,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f3fa' },
          horzLines: { color: '#f0f3fa' },
        },
        timeScale: {
          borderColor: '#d1d5db',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: 0, // Disabled for mobile compatibility
        },
        rightPriceScale: {
          borderColor: '#d1d5db',
        },
      });

      const newSeries = newChart.addAreaSeries({
        lineColor: '#2563eb',
        topColor: 'rgba(37, 99, 235, 0.4)',
        bottomColor: 'rgba(37, 99, 235, 0.0)',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
        title: 'BTC/USD',
      });

      // Add visible range changed handler
      newChart.timeScale().subscribeVisibleTimeRangeChange(() => {
        const logicalRange = newChart.timeScale().getVisibleLogicalRange();
        if (logicalRange !== null) {
          setVisibleRange({
            from: Math.max(0, Math.floor(logicalRange.from)),
            to: Math.min(sampleData.length - 1, Math.ceil(logicalRange.to))
          });
        }
      });

      setChart(newChart);
      setSeries(newSeries);

      // Set data initially
      if (historical) {
        setCurrentData(sampleData);
      } else {
        // For non-historical mode, only show first 10 data points
        setCurrentData(sampleData.slice(0, 10));
      }

      return () => {
        newChart.remove();
      };
    }
  }, [height, width, historical]);

  // Update series data when currentData changes
  useEffect(() => {
    if (series && currentData.length > 0) {
      series.setData(currentData);
      
      if (chart) {
        // Fit the content
        chart.timeScale().fitContent();
      }
    }
  }, [series, currentData, chart]);

  // Styles
  const containerStyle: CSSProperties = {
    position: 'relative',
    height: `${height}px`,
    width: `${width}px`,
  };

  const chartInfoStyle: CSSProperties = {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: 'rgba(255, 255, 255, 0.8)',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    zIndex: 2,
    color: '#333',
  };

  // If in historical mode, allow scrolling back but not forward
  const handleScrollForward = () => {
    if (visibleRange.to < sampleData.length - 1) {
      const newTo = Math.min(sampleData.length - 1, visibleRange.to + 3);
      const newFrom = Math.min(visibleRange.from + 3, newTo - 5);
      
      if (chart) {
        chart.timeScale().setVisibleLogicalRange({
          from: newFrom,
          to: newTo,
        });
      }
    }
  };

  const handleScrollBack = () => {
    if (visibleRange.from > 0) {
      const newFrom = Math.max(0, visibleRange.from - 3);
      const newTo = Math.max(visibleRange.to - 3, newFrom + 5);
      
      if (chart) {
        chart.timeScale().setVisibleLogicalRange({
          from: newFrom,
          to: newTo,
        });
      }
    }
  };

  const controlButtonStyle: CSSProperties = {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    margin: '0 5px',
    cursor: 'pointer',
    fontSize: '12px',
  };

  const controlsContainerStyle: CSSProperties = {
    position: 'absolute',
    bottom: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    zIndex: 2,
  };

  return (
    <div style={containerStyle}>
      <div style={chartInfoStyle}>BTC/USD</div>
      <div ref={chartContainerRef} />
      
      {historical && (
        <div style={controlsContainerStyle}>
          <button style={controlButtonStyle} onClick={handleScrollBack}>
            ◀ Look Back
          </button>
          <button style={controlButtonStyle} onClick={handleScrollForward}>
            Look Forward ▶
          </button>
        </div>
      )}
    </div>
  );
} 