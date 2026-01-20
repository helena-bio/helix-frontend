'use client';

import React, { useEffect, useRef } from 'react';

interface HelixLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  speed?: number;
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-16 h-20' },
  md: { container: 'w-24 h-32' },
  lg: { container: 'w-36 h-48' }
};

export const HelixLoader: React.FC<HelixLoaderProps> = ({
  size = 'md',
  speed = 3,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sizes = sizeMap[size];
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    const width = rect.width;
    const height = rect.height;
    
    const helixImg = new Image();
    helixImg.src = '/images/bulb_helix.png';
    
    let animationId: number;
    let offsetY = 0;
    let rotation = 0;
    
    const scrollSpeed = 0.8;
    const rotationSpeed = (2 * Math.PI) / (speed * 60);
    
    helixImg.onload = () => {
      const imgWidth = width * 0.7;
      const imgHeight = (helixImg.height / helixImg.width) * imgWidth;
      
      const animate = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.translate(centerX, centerY);
        
        const scaleX = Math.abs(Math.cos(rotation));
        const minScale = 0.3;
        const actualScaleX = minScale + (1 - minScale) * scaleX;
        ctx.scale(actualScaleX, 1);
        
        ctx.translate(-centerX, -centerY);
        
        // Seamless loop calculation
        const normalizedOffset = offsetY % imgHeight;
        const startY = -normalizedOffset;
        
        // Draw enough copies to fill screen + buffer
        const numCopies = Math.ceil(height / imgHeight) + 2;
        
        for (let i = 0; i < numCopies; i++) {
          const y = startY + (i * imgHeight);
          const x = centerX - imgWidth / 2;
          
          // Only draw if visible
          if (y + imgHeight >= 0 && y <= height) {
            ctx.drawImage(helixImg, x, y, imgWidth, imgHeight);
          }
        }
        
        ctx.restore();
        
        // Update offsets
        offsetY += scrollSpeed;
        rotation += rotationSpeed;
        
        // Reset offset when it completes one full cycle
        if (offsetY >= imgHeight) {
          offsetY = 0;
        }
        
        animationId = requestAnimationFrame(animate);
      };
      
      animate();
    };
    
    helixImg.onerror = () => {
      console.error('Failed to load helix image');
    };
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [speed]);
  
  return (
    <div className={`relative inline-flex items-center justify-center ${sizes.container} ${className}`}>
      <div ref={containerRef} className="absolute inset-0 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
      
      <img
        src="/images/bulb.png"
        alt="Light Bulb"
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />
    </div>
  );
};
