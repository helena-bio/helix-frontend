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

export const HelixLoader: React.FC<HelixLoaderProps> = ({
  size = 'sm',
  className = '',
  centered = false,
  animated = true,
}) => {
  const { width, height } = sizeMap[size];

  // Static PNG when not loading, animated GIF when loading
  const imageSrc = animated
    ? '/images/logos/loader_helena.gif'
    : '/images/logos/logo_helena_woman.png';

  const content = (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <img
        src={imageSrc}
        alt={animated ? 'Loading' : 'Helena'}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          objectFit: 'contain',
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
