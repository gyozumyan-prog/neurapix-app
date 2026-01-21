import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface ComparisonSliderProps {
  original: string;
  result: string;
}

export function ComparisonSlider({ original, result }: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isResizing || !containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const updateImageSize = () => {
    const img = new Image();
    img.onload = () => {
      const isMobile = window.innerWidth < 768;
      const maxHeight = isMobile ? window.innerHeight * 0.5 : window.innerHeight * 0.7;
      const maxWidth = isMobile ? window.innerWidth * 0.92 : window.innerWidth * 0.6;
      
      const scaleH = maxHeight / img.height;
      const scaleW = maxWidth / img.width;
      const scale = Math.min(scaleH, scaleW, 1);
      
      setImageSize({
        width: img.width * scale,
        height: img.height * scale
      });
    };
    img.src = result;
  };

  useEffect(() => {
    updateImageSize();
    window.addEventListener('resize', updateImageSize);
    return () => window.removeEventListener('resize', updateImageSize);
  }, [result]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isResizing]);

  if (imageSize.width === 0) {
    return <div className="flex items-center justify-center h-64">Загрузка...</div>;
  }

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden select-none rounded-xl shadow-2xl ring-1 ring-white/10 cursor-ew-resize"
      style={{ width: imageSize.width, height: imageSize.height, touchAction: 'none' }}
    >
      <img
        ref={imageRef}
        src={result}
        alt="Result"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      <div
        className="absolute inset-0 w-full h-full"
        style={{
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
        }}
      >
        <img
          src={original}
          alt="Original"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-black hover:scale-110 transition-transform">
          <ArrowLeftRight className="w-4 h-4" />
        </div>
      </div>
      
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white text-xs px-2 py-1 rounded pointer-events-none">Original</div>
      <div className="absolute top-4 right-4 bg-primary/80 backdrop-blur text-white text-xs px-2 py-1 rounded pointer-events-none">Result</div>
    </div>
  );
}
