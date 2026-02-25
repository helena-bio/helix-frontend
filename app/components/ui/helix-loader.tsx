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
  xs: { width: 40, height: 58 },
  sm: { width: 64, height: 93 },
  md: { width: 96, height: 140 },
  lg: { width: 144, height: 210 }
};

export const HelixLoader: React.FC<HelixLoaderProps> = ({
  size = 'sm',
  className = '',
  centered = false,
}) => {
  const { width, height } = sizeMap[size];

  const content = (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <img
        src="/images/logos/loader_helena.gif"
        alt="Loading"
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
