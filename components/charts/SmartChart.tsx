import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush, Treemap, Sector
} from 'recharts';
import { ChartConfig, DataPoint } from '../../types';
import ThreeDBarChart from './ThreeDBarChart';
import { getGradientColor } from '../../utils/chartRecommender';

interface Props {
  config: ChartConfig;
  data: DataPoint[];
  onDrillDown?: (data: DataPoint) => void;
}

// -- Custom Components --

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-md text-sm text-white z-50 min-w-[160px] animate-in fade-in zoom-in-95 duration-200">
        {label && <p className="font-bold mb-2 text-slate-300 border-b border-slate-700 pb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/10" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-slate-400 font-medium">{entry.name}:</span>
            </div>
            <span className="font-mono font-bold text-slate-100 tracking-wide">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomizedTreemapContent = (props: any) => {
  const { root, depth, x, y, width, height, index, colors, name, value } = props;
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: getGradientColor(index),
          stroke: '#0f172a',
          strokeWidth: 2,
          strokeOpacity: 1,
        }}
        className="opacity-80 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
      />
      {width > 50 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          fontWeight="bold"
          style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
        >
          {name}
        </text>
      )}
      {width > 50 && height > 50 && (
        <text
            x={x + width / 2}
            y={y + height / 2 + 14}
            textAnchor="middle"
            fill="rgba(255,255,255,0.7)"
            fontSize={10}
            style={{ pointerEvents: 'none' }}
        >
            {value}
        </text>
      )}
    </g>
  );
};

// Exploding Sector Shape
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, percent, value, name } = props;
  
  // Calculate the vector to shift the slice outwards
  const shiftDistance = 12;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + shiftDistance * cos;
  const sy = cy + shiftDistance * sin;

  return (
    <g className="transition-all duration-500 ease-out">
      {/* Main Sector moved outwards */}
      <Sector
        cx={sx}
        cy={sy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4} // Slight enlargement
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.5))' }} // Deep shadow for pop effect
      />
      {/* Outer Glow/Ring */}
      <Sector
        cx={sx}
        cy={sy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 10}
        fill={fill}
        fillOpacity={0.4}
      />
      {/* Label Line */}
      <path d={`M${sx + (outerRadius + 10) * cos},${sy + (outerRadius + 10) * sin}L${sx + (outerRadius + 25) * cos},${sy + (outerRadius + 25) * sin}`} stroke={fill} strokeWidth={2} fill="none" />
      <text x={sx + (outerRadius + 35) * cos} y={sy + (outerRadius + 35) * sin} dy={4} textAnchor={cos > 0 ? 'start' : 'end'} fill="#fff" fontSize={12} fontWeight="bold">
        {name}
      </text>
      <text x={sx + (outerRadius + 35) * cos} y={sy + (outerRadius + 35) * sin} dy={18} textAnchor={cos > 0 ? 'start' : 'end'} fill="#999" fontSize={10}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

// -- Main Component --

const SmartChart: React.FC<Props> = ({ config: initialConfig, data: initialData, onDrillDown }) => {
  // Navigation Stack for Drill-Down
  const [history, setHistory] = useState<{ config: ChartConfig; data: DataPoint[]; title?: string; seedColor?: string | null }[]>([]);
  
  // Current View State
  const [currentData, setCurrentData] = useState(initialData);
  const [currentConfig, setCurrentConfig] = useState(initialConfig);
  const [seedColor, setSeedColor] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1); // For Donut Selection

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationMode, setAnimationMode] = useState<'fade' | 'zoom' | 'morph'>('fade');
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
  
  // Reset when props change (e.g. category switch)
  useEffect(() => {
    setCurrentData(initialData);
    setCurrentConfig(initialConfig);
    setHistory([]);
    setSeedColor(null);
    setIsTransitioning(false);
    setActiveIndex(-1);
    setHiddenSeries([]);
  }, [initialData, initialConfig]);

  // -- Interaction Handlers --

  const executeDrillDown = (payload: any, clickedColor?: string) => {
      // Check for standard children or hidden children (used to manually control Treemap drill-down)
      const nextData = payload.children || payload._children;

      if (nextData && nextData.length > 0) {
          const isDonut = currentConfig.type === 'donut';
          // Select animation mode: 'morph' for Donut drill-down, 'zoom' for others
          setAnimationMode(isDonut ? 'morph' : 'zoom');
          
          // 1. Start Exit Transition (Fade out old chart)
          setIsTransitioning(true);

          // 2. Wait for exit animation (300ms matches CSS duration)
          setTimeout(() => {
              // Push current state to history
              setHistory(prev => [...prev, { config: currentConfig, data: currentData, title: 'Back', seedColor }]);
              
              // Update Data & Config
              setCurrentData(nextData);
              setSeedColor(clickedColor || null);
              setActiveIndex(-1);
              setHiddenSeries([]);
              
              // Logic to select next chart type
              if (currentConfig.type === 'donut') {
                  setCurrentConfig({ type: 'bar' }); // Donut -> Bar (Morph effect)
              } 
              // For Treemap, we stay in Treemap type to preserve hierarchy view
              // For others, keep same config
              
              // 3. End Transition (Trigger Entry Animation)
              // Small delay to allow React to render the new component structure
              setTimeout(() => {
                  setIsTransitioning(false);
              }, 50);
              
          }, 300);
      }
  };

  // Handler for Direct Item Clicks (Pie, Treemap, 3DBar)
  const handleDataPointClick = (dataPoint: any, index?: number) => {
    const payload = dataPoint?.payload || dataPoint; // Normalize Recharts payload vs direct object
    
    // Capture color for continuity (Morph effect)
    const clickedColor = dataPoint.fill || payload.fill || (index !== undefined ? getGradientColor(index) : undefined);

    // Notify parent (optional)
    if (onDrillDown) onDrillDown(payload);

    // Special Handling for Donut: Explode then Drill
    if (currentConfig.type === 'donut' && index !== undefined && payload.children) {
        setActiveIndex(index);
        // Delay actual drill-down to allow "Explosion" animation to be seen
        setTimeout(() => {
            executeDrillDown(payload, clickedColor);
        }, 450);
        return;
    }

    executeDrillDown(payload, clickedColor);
  };

  // Handler for Categorical Wrapper Clicks (Bar, Line, Area)
  const handleCategoricalClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
        const payload = data.activePayload[0].payload;
        const index = currentData.indexOf(payload);
        handleDataPointClick(payload, index);
    }
  };

  const handleBack = () => {
    if (history.length === 0) return;
    
    setAnimationMode('fade');
    setIsTransitioning(true);
    
    setTimeout(() => {
      const lastState = history[history.length - 1];
      setCurrentData(lastState.data);
      setCurrentConfig(lastState.config);
      setSeedColor(lastState.seedColor || null);
      setHistory(prev => prev.slice(0, -1));
      setActiveIndex(-1);
      setHiddenSeries([]);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  const toggleSeries = (e: any) => {
    // Use 'value' (the label text) as the key.
    const key = e.value; 
    if (!key) return;
    setHiddenSeries(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // -- Data Prep --

  const pieData = useMemo(() => {
    if (currentConfig.type === 'donut') {
      return currentData.filter(item => !hiddenSeries.includes(item.name));
    }
    return currentData;
  }, [currentData, hiddenSeries, currentConfig.type]);

  const getColorForEntry = (entry: DataPoint, originalData: DataPoint[]) => {
    if (seedColor) {
       return seedColor;
    }
    const index = originalData.findIndex(d => d.name === entry.name);
    return getGradientColor(index);
  };

  // -- Render Helpers --

  const commonAxisProps = {
    stroke: "#94a3b8",
    fontSize: 11,
    tickLine: false,
    axisLine: false,
    tick: { fill: '#94a3b8' },
    dy: 10
  };

  const commonGridProps = {
    strokeDasharray: "3 3",
    stroke: "#334155",
    vertical: false,
    opacity: 0.3
  };

  const commonLegendProps = {
    onClick: toggleSeries,
    wrapperStyle: { cursor: 'pointer', paddingTop: '20px', fontSize: '12px' },
    iconType: 'circle' as const,
    formatter: (value: string) => (
      <span className="select-none" style={{ 
        color: hiddenSeries.includes(value) ? '#64748b' : '#cbd5e1', 
        textDecoration: hiddenSeries.includes(value) ? 'line-through' : 'none',
        opacity: hiddenSeries.includes(value) ? 0.6 : 1,
        transition: 'all 0.2s'
      }}>
        {value}
      </span>
    )
  };

  // -- Chart Renderers --

  const renderChart = () => {
    // Force unique key to ensure animation replay on drill-down
    const chartKey = `chart-${history.length}-${currentConfig.type}`;

    if (currentConfig.type === '3d-bar') {
      return <ThreeDBarChart key={chartKey} data={currentData} onClick={handleDataPointClick} />;
    }

    if (currentConfig.type === 'treemap') {
        // Hide children from Recharts to prevent auto-nesting, enabling manual drill-down interactions.
        // We map 'children' to '_children' so we can still access them in the click handler.
        const treemapData = currentData.map(item => ({
            ...item,
            children: undefined, 
            _children: item.children
        }));

        return (
            <ResponsiveContainer key={chartKey} width="100%" height="100%">
                <Treemap
                    data={treemapData}
                    dataKey="value"
                    nameKey="name"
                    aspectRatio={4 / 3}
                    stroke="#0f172a"
                    content={<CustomizedTreemapContent />}
                    onClick={handleDataPointClick}
                    animationDuration={800}
                >
                    <Tooltip content={<CustomTooltip />} />
                </Treemap>
            </ResponsiveContainer>
        )
    }

    if (currentConfig.type === 'donut') {
      return (
        <ResponsiveContainer key={chartKey} width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              {...{ activeIndex } as any}
              activeShape={renderActiveShape}
              data={pieData}
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
              onClick={handleDataPointClick}
              cursor="pointer"
              animationDuration={800}
              animationBegin={0}
              stroke="none"
            >
              {pieData.map((entry, index) => (
                <Cell 
                    key={`cell-${entry.name}`} 
                    fill={getColorForEntry(entry, currentData)} 
                    className="hover:opacity-80 transition-opacity duration-300"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend {...commonLegendProps} verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (currentConfig.type === 'area') {
      return (
        <ResponsiveContainer key={chartKey} width="100%" height="100%">
          <AreaChart data={currentData} onClick={handleCategoricalClick} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid {...commonGridProps} />
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend {...commonLegendProps} verticalAlign="top" align="right" height={30} />
            
            <Area 
              type="monotone" 
              dataKey="value" 
              name="Current"
              stroke="#8b5cf6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorVal)" 
              animationDuration={1500}
              animationEasing="ease-in-out"
              hide={hiddenSeries.includes('Current')}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#ddd6fe', stroke: '#fff' }}
            />
            {currentData[0]?.prevValue && (
              <Area 
                  type="monotone" 
                  dataKey="prevValue" 
                  name="Previous"
                  stroke="#64748b" 
                  fill="#64748b" 
                  fillOpacity={0.05}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  hide={hiddenSeries.includes('Previous')}
                  animationDuration={1500}
              />
            )}
            <Brush 
              dataKey="name" 
              height={20} 
              stroke="#475569" 
              fill="#0f172a"
              tickFormatter={() => ''}
              travellerWidth={10}
              alwaysShowText={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (currentConfig.type === 'line') {
      return (
        <ResponsiveContainer key={chartKey} width="100%" height="100%">
          <LineChart data={currentData} onClick={handleCategoricalClick} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid {...commonGridProps} />
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
            <Legend {...commonLegendProps} verticalAlign="top" align="right" height={30} />
            
            <Line 
              type="monotone" 
              dataKey="value" 
              name="Current"
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ r: 0, fill: '#3b82f6', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#93c5fd', stroke: '#fff' }}
              animationDuration={2000}
              animationEasing="ease-out"
              hide={hiddenSeries.includes('Current')}
            />
            {currentData[0]?.prevValue && (
               <Line 
                  type="monotone" 
                  dataKey="prevValue" 
                  name="Previous"
                  stroke="#64748b" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={false} 
                  hide={hiddenSeries.includes('Previous')}
                  animationDuration={2000}
               />
            )}
            <Brush 
              dataKey="name" 
              height={20} 
              stroke="#475569" 
              fill="#0f172a"
              tickFormatter={() => ''}
              travellerWidth={10}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Default Bar
    return (
      <ResponsiveContainer key={chartKey} width="100%" height="100%">
        <BarChart data={currentData} onClick={handleCategoricalClick} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid {...commonGridProps} />
          <XAxis dataKey="name" {...commonAxisProps} />
          <YAxis {...commonAxisProps} />
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
          <Bar 
              dataKey="value" 
              name="Value"
              radius={[6, 6, 0, 0]} 
              animationDuration={1000}
              animationEasing="ease-out"
              cursor="pointer"
          >
             {currentData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  // Use seedColor if present (monochromatic palette) or default rainbow
                  fill={seedColor || getGradientColor(index)} 
                  // Vary opacity slightly if monochromatic to distinguish bars
                  fillOpacity={seedColor ? Math.max(0.4, 1 - (index * (0.6 / Math.max(1, currentData.length)))) : 1}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden group">
        {/* Transition Overlay Container */}
        <div 
            className={`w-full h-full transition-all ease-in-out ${
                isTransitioning 
                  ? 'opacity-0 scale-110 blur-sm duration-300' // Exit Phase
                  : animationMode === 'morph' 
                    ? 'opacity-100 scale-100 blur-0 animate-in slide-in-from-bottom-10 fade-in duration-700' // Enter Phase (Morph)
                    : animationMode === 'zoom'
                      ? 'opacity-100 scale-100 blur-0 animate-in zoom-in-95 duration-500' // Enter Phase (Standard)
                      : 'opacity-100 scale-100 blur-0 duration-300' // Default
            }`}
        >
            {renderChart()}
        </div>

        {/* Back Button Overlay */}
        {history.length > 0 && (
            <button
                onClick={handleBack}
                className="absolute top-4 left-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl transition-all transform hover:scale-105 flex items-center gap-2 z-30 animate-in fade-in slide-in-from-left-2"
                aria-label="Go back to parent chart"
            >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Parent
            </button>
        )}
    </div>
  );
};

export default SmartChart;