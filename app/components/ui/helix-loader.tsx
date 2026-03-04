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
  xs: { width: 68, height: 99 },
  sm: { width: 112, height: 163 },
  md: { width: 160, height: 233 },
  lg: { width: 224, height: 326 }
};

const GIF_SRC = '/images/logos/loader_helena.gif';
const SVG_SRC = '/images/logos/logo_helena_woman.svg';

// Preload GIF on module load so it is cached before first use
if (typeof window !== 'undefined') {
  const img = new Image();
  img.src = GIF_SRC;
  const svg = new Image();
  svg.src = SVG_SRC;
}

export const HelixLoader: React.FC<HelixLoaderProps> = ({
  size = 'sm',
  className = '',
  centered = false,
  animated = true,
}) => {
  const { width, height } = sizeMap[size];

  const imgStyle = (visible: boolean): React.CSSProperties => ({
    width: `${width}px`,
    height: `${height}px`,
    objectFit: 'contain',
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
  });

  const content = (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <img src={GIF_SRC} alt="Loading" style={imgStyle(animated)} />
      <img src={SVG_SRC} alt="Helena" style={imgStyle(!animated)} />
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
