'use client';
import React from 'react';

interface HelixLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  speed?: number;
  className?: string;
  centered?: boolean;
  animated?: boolean;
}

const sizeMap = {
  xs: { width: 64, height: 93 },
  sm: { width: 112, height: 163 },
  md: { width: 160, height: 233 },
  lg: { width: 224, height: 326 }
};

// Preload GIF on module load so it is cached before first use
const GIF_SRC = '/images/logos/loader_helena_white.gif';
const SVG_SRC = '/images/logos/logo_helena_woman.svg';

if (typeof window !== 'undefined') {
  const img = new Image();
  img.src = GIF_SRC;
}

export const HelixLoader: React.FC<HelixLoaderProps> = ({
  size = 'sm',
  className = '',
  centered = false,
  animated = true,
}) => {
  const { width, height } = sizeMap[size];

  const content = (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Both images always rendered, toggle visibility to avoid reload flash */}
      <img
        src={GIF_SRC}
        alt="Loading"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          objectFit: 'contain',
          display: animated ? 'block' : 'none',
        }}
      />
      <img
        src={SVG_SRC}
        alt="Helena"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          objectFit: 'contain',
          display: animated ? 'none' : 'block',
        }}
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
