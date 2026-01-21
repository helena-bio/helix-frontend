'use client';
import React from 'react';

interface HelixLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  speed?: number;
  className?: string;
  centered?: boolean;
  animated?: boolean;  // NEW: controls if helix is moving
}

const sizeMap = {
  xs: { width: 40, height: 58 },
  sm: { width: 64, height: 93 },
  md: { width: 96, height: 140 },
  lg: { width: 144, height: 210 }
};

export const HelixLoader: React.FC<HelixLoaderProps> = ({
  size = 'sm',
  speed = 3,
  className = '',
  centered = false,
  animated = true  // Default to animated for backwards compatibility
}) => {
  const { width, height } = sizeMap[size];
  
  const clipTop = 0.20;
  const clipBottom = 0.76;
  const clipHeight = (clipBottom - clipTop) * height;
  const clipTopPx = clipTop * height;
  
  // Helix sizing (same ratios as before)
  const helixWidthRatio = 205 / 598;
  const helixAspect = 205 / 475;
  const helixWidth = width * helixWidthRatio;
  const helixHeight = helixWidth / helixAspect;

  // Animation duration based on speed
  const duration = 8 / speed;

  const content = (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Helix animation container */}
      <div 
        className="absolute overflow-hidden"
        style={{ 
          top: `${clipTopPx}px`,
          height: `${clipHeight}px`,
          width: `${helixWidth}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          // Fade in/out mask - transparent at top edge, visible below
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 100%)',
        }}
      >
        <div
          style={{
            animation: animated ? `scrollHelix ${duration}s linear infinite` : 'none',
          }}
        >
          {/* Multiple copies for seamless loop */}
          {[0, 1, 2, 3].map((i) => (
            <img
              key={i}
              src="/images/bulb_helix.svg"
              alt=""
              style={{
                width: `${helixWidth}px`,
                height: `${helixHeight}px`,
                display: 'block'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Bulb overlay */}
      <img
        src="/images/bulb.svg"
        alt="Loading"
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />
    </div>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center w-full py-8">
        {content}
      </div>
    );
  }

  return content;
};
