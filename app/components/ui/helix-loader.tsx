'use client';

import React from 'react';

interface HelixLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  speed?: number;
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-20 h-28', helix: 'w-10 h-20' },
  md: { container: 'w-32 h-44', helix: 'w-16 h-32' },
  lg: { container: 'w-48 h-64', helix: 'w-24 h-48' }
};

export const HelixLoader: React.FC<HelixLoaderProps> = ({ 
  size = 'md',
  speed = 3,
  className = ''
}) => {
  const sizes = sizeMap[size];
  
  return (
    <div className={`relative inline-flex items-center justify-center ${sizes.container} ${className}`}>
      {/* Helix - rotating in background */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: '1000px' }}
      >
        <img
          src="/images/bulb_helix.png"
          alt="DNA Helix"
          className={`${sizes.helix}`}
          style={{
            animation: `spin3d ${speed}s linear infinite`,
            transformStyle: 'preserve-3d'
          }}
        />
      </div>
      
      {/* Bulb - static overlay */}
      <img
        src="/images/bulb.png"
        alt="Light Bulb"
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />
      
      <style jsx>{`
        @keyframes spin3d {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
      `}</style>
    </div>
  );
};
