'use client';
import React, { useEffect, useRef } from 'react';

interface HelixLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  speed?: number;
  className?: string;
  centered?: boolean;
}

const sizeMap = {
  xs: { width: 48, height: 70 },
  sm: { width: 64, height: 93 },
  md: { width: 96, height: 140 },
  lg: { width: 144, height: 210 }
};

export const HelixLoader: React.FC<HelixLoaderProps> = ({
  size = 'sm',
  speed = 3,
  className = '',
  centered = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = sizeMap[size];

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const helixImg = new Image();
    helixImg.src = '/images/bulb_helix.svg';

    let animationId: number;
    let offsetY = 0;
    const scrollSpeed = 0.35; // По-бавно (беше 0.8)

    helixImg.onload = () => {
      const helixAspect = 205 / 475;
      const helixWidthRatio = 205 / 598;
      const imgWidth = width * helixWidthRatio;
      const imgHeight = imgWidth / helixAspect;

      const animate = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.save();

        const clipTop = height * 0.20;
        const clipBottom = height * 0.76;
        const clipHeight = clipBottom - clipTop;
        const fadeSize = clipHeight * 0.25; // Fade зона

        ctx.beginPath();
        ctx.rect(0, clipTop, width, clipHeight);
        ctx.clip();

        const centerX = width / 2;
        const x = centerX - imgWidth / 2;
        const loopCycle = offsetY % imgHeight;
        const startY = clipTop - loopCycle;
        const numCopies = Math.ceil((clipHeight + imgHeight) / imgHeight) + 1;

        for (let i = 0; i < numCopies; i++) {
          const y = startY + (i * imgHeight);
          ctx.drawImage(helixImg, x, y, imgWidth, imgHeight);
        }

        ctx.restore();

        // Fade in/out ефект с градиенти
        ctx.save();
        
        // Горен fade (от непрозрачно към прозрачно)
        const gradientTop = ctx.createLinearGradient(0, clipTop, 0, clipTop + fadeSize);
        gradientTop.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradientTop.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradientTop;
        ctx.fillRect(0, clipTop, width, fadeSize);

        // Долен fade (от прозрачно към непрозрачно)
        const gradientBottom = ctx.createLinearGradient(0, clipBottom - fadeSize, 0, clipBottom);
        gradientBottom.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradientBottom.addColorStop(1, 'rgba(255, 255, 255, 1)');
        ctx.fillStyle = gradientBottom;
        ctx.fillRect(0, clipBottom - fadeSize, width, fadeSize);

        ctx.restore();

        offsetY += scrollSpeed;
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
  }, [speed, width, height]);

  const content = (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div ref={containerRef} className="absolute inset-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
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
