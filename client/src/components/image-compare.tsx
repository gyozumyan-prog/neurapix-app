import { useState, useRef, useCallback } from "react";

interface ImageCompareProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function ImageCompare({
  beforeImage,
  afterImage,
  beforeLabel = "До",
  afterLabel = "После",
  className = "",
}: ImageCompareProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInteracting = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  }, [handleMove]);

  const handleMouseLeave = useCallback(() => {
    setPosition(50);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl cursor-ew-resize select-none shadow-2xl ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setPosition(50)}
      data-testid="image-compare"
    >
      <img
        src={afterImage}
        alt={afterLabel}
        className="w-full h-full object-cover"
        draggable={false}
      />
      
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
        style={{ left: `${position}%`, transform: 'translateX(-50%)', willChange: 'left' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
            <path d="M18 8L22 12L18 16" />
            <path d="M6 8L2 12L6 16" />
          </svg>
        </div>
      </div>

      <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-sm font-medium rounded-full">
        {beforeLabel}
      </div>
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-900 text-sm font-medium rounded-full">
        {afterLabel}
      </div>
    </div>
  );
}
