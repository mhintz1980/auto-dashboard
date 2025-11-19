
import React from 'react';
import { DataPoint } from '../../types';

interface Props {
  data: DataPoint[];
  color?: string;
  onClick?: (item: DataPoint) => void;
  depth?: number; // Configurable depth in pixels
}

const ThreeDBarChart: React.FC<Props> = ({ data, onClick, depth = 24 }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="w-full h-full flex items-end justify-around px-4 pb-12 iso-bar-container pt-12 overflow-visible perspective-[1000px]">
      {data.map((item, idx) => {
        const heightPercent = Math.max(5, (item.value / maxValue) * 100);
        const hue = (210 + idx * 25) % 360;
        
        // Enhanced Lighting Palette
        // Base: The main color
        // Dark: The shaded side
        // Light: The illuminated top
        const baseColor = `hsla(${hue}, 80%, 60%, 1)`;
        const darkColor = `hsla(${hue}, 80%, 40%, 1)`; 
        const lightColor = `hsla(${hue}, 80%, 80%, 1)`; 
        
        // Staggered animation delay
        const delay = `${idx * 100}ms`;

        return (
          <div 
            key={idx}
            className="group relative w-10 sm:w-14 md:w-16 cursor-pointer transition-all duration-500 hover:-translate-y-2"
            style={{ 
              height: `${heightPercent}%`,
              transformStyle: 'preserve-3d'
            }}
            onClick={() => onClick && onClick(item)}
          >
             {/* Bar Body Container - Animates in */}
             <div 
                className="w-full h-full absolute bottom-0 left-0 preserve-3d animate-in slide-in-from-bottom duration-1000" 
                style={{ 
                    animationDelay: delay, 
                    transformStyle: 'preserve-3d',
                }}
             >
                {/* Front Face (Main) */}
                <div 
                  className="absolute w-full h-full rounded-sm flex items-end justify-center pb-2 z-20 border-t border-white/20"
                  style={{ 
                    background: `linear-gradient(160deg, ${baseColor}, ${darkColor})`, // Subtle gradient for roundness/sheen
                    boxShadow: 'inset 0 0 15px rgba(0,0,0,0.1)', // Inner depth
                    backfaceVisibility: 'hidden'
                  }}
                >
                   <span className="text-[10px] sm:text-xs text-white font-bold drop-shadow-md opacity-90 group-hover:scale-110 transition-transform">
                     {item.value}
                   </span>
                </div>
                
                {/* Side Face (Right) - Shadow Side */}
                <div 
                  className="absolute h-full origin-right brightness-90"
                  style={{ 
                    background: `linear-gradient(to left, ${darkColor}, ${baseColor})`, // Shadow gradient
                    width: `${depth}px`,
                    right: 0,
                    transform: `rotateY(90deg)`, // Folds back 90deg
                  }} 
                />
                
                {/* Top Face - Highlight Cap */}
                <div 
                  className="absolute w-full origin-top flex items-center justify-center overflow-hidden border-t border-white/40"
                  style={{ 
                    background: lightColor,
                    height: `${depth}px`,
                    top: 0,
                    transform: `rotateX(-90deg)`, // Folds back 90deg
                  }} 
                >
                    {/* Specular Highlight */}
                    <div className="w-full h-full bg-gradient-to-tr from-white/40 to-transparent" />
                </div>

                {/* Left Face (Optional, for completeness in extreme rotations) */}
                 <div 
                  className="absolute h-full origin-left brightness-110"
                  style={{ 
                    background: baseColor,
                    width: `${depth}px`,
                    left: 0,
                    transform: `rotateY(-90deg)`,
                  }} 
                />
             </div>

            {/* Floor Shadow (Cast Shadow) */}
            <div 
                className="absolute bottom-0 left-0 w-full h-6 bg-black/30 blur-md rounded-[50%] transition-all duration-300 group-hover:w-[120%] group-hover:-left-[10%] group-hover:bg-black/20"
                style={{
                    transform: `translateY(${depth / 2}px) rotateX(90deg) scale(0.8)`,
                    zIndex: -1,
                    opacity: 0.6
                }}
            />

            {/* Label below */}
            <div 
                className="absolute -bottom-10 w-[160%] -left-[30%] text-center text-[10px] sm:text-xs text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis font-medium transition-colors group-hover:text-white"
                style={{ transform: 'translateZ(20px)' }} 
            >
              {item.name}
            </div>
            
            {/* Hover Tooltip */}
            <div className="absolute bottom-full mb-8 left-1/2 -translate-x-1/2 bg-slate-800/90 border border-slate-600 text-white text-xs py-2 px-3 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none backdrop-blur-sm transform translate-z-[50px]">
              <div className="font-bold text-sm mb-0.5">{item.name}</div>
              <div className="text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: baseColor }}></span>
                Value: {item.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ThreeDBarChart;
