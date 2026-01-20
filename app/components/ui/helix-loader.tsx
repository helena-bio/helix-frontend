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

    const scrollSpeed = 1.5;
    const rotationSpeed = (2 * Math.PI) / (speed * 60);

    helixImg.onload = () => {
      const imgWidth = width * 0.65;
      const imgHeight = (helixImg.height / helixImg.width) * imgWidth;

      const animate = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.save();

        // Променени клипинг границите - започва по-високо (25%) и свършва по-рано (75%)
        const clipTop = height * 0.25;  // Беше 0.15, сега 0.25 - по-високо
        const clipBottom = height * 0.75;  // Беше 0.85, сега 0.75 - по-ниско
        const clipHeight = clipBottom - clipTop;

        ctx.beginPath();
        ctx.rect(0, clipTop, width, clipHeight);
        ctx.clip();

        const centerX = width / 2;
        const centerY = height / 2;

        ctx.translate(centerX, centerY);
        
        const scaleX = Math.abs(Math.cos(rotation));
        const minScale = 0.3;
        const actualScaleX = minScale + (1 - minScale) * scaleX;
        
        // Добавям вертикално сплескване (scaleY)
        const scaleY = 0.8;  // Сплесква я на 80% от оригиналната височина
        
        ctx.scale(actualScaleX, scaleY);
        ctx.translate(-centerX, -centerY);

        const x = centerX - imgWidth / 2;
        const loopCycle = offsetY % imgHeight;
        const startY = clipTop - loopCycle;
        const numCopies = Math.ceil((clipHeight + imgHeight) / imgHeight) + 1;
        
        for (let i = 0; i < numCopies; i++) {
          const y = startY + (i * imgHeight);
          ctx.drawImage(helixImg, x, y, imgWidth, imgHeight);
        }

        ctx.restore();

        offsetY += scrollSpeed;
        rotation += rotationSpeed;

        if (offsetY >= imgHeight) {
          offsetY = offsetY % imgHeight;
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
      <div ref={containerRef} className="absolute inset-0">
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
