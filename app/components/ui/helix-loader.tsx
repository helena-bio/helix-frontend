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
  xs: { width: 48, height: 70 },
  sm: { width: 80, height: 116 },
  md: { width: 120, height: 174 },
  lg: { width: 180, height: 262 }
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
