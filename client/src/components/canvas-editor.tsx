import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import useImage from 'use-image';
import { Loader2 } from 'lucide-react';
import { KonvaEventObject } from 'konva/lib/Node';

interface CanvasEditorProps {
  imageUrl: string;
  width: number;
  height: number;
  brushSize: number;
  isDrawingEnabled: boolean;
  zoom?: number;
  onDrawEnd?: () => void;
  onClear?: () => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  children?: React.ReactNode;
}

export interface CanvasEditorRef {
  getMaskBlob: () => Promise<Blob | null>;
  clearMask: () => void;
}

export const CanvasEditor = forwardRef<CanvasEditorRef, CanvasEditorProps>(({
  imageUrl,
  width,
  height,
  brushSize,
  isDrawingEnabled,
  zoom = 1,
  onDrawEnd,
  onClear,
  onSizeChange,
  children
}, ref) => {
  const [image, status] = useImage(imageUrl, 'anonymous');
  const [lines, setLines] = useState<any[]>([]);
  const isDrawing = useRef(false);
  const stageRef = useRef<any>(null);
  const maskLayerRef = useRef<any>(null);

  // Resize logic to fit container while maintaining aspect ratio
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Combine base scale with user zoom
  const scale = baseScale * zoom;

  useEffect(() => {
    const updateSize = () => {
      if (!image) return;
      
      // Get container dimensions - use more space on mobile
      const isMobile = window.innerWidth < 768;
      const containerW = containerRef.current?.clientWidth || (isMobile ? window.innerWidth * 0.95 : window.innerWidth * 0.6);
      const containerH = isMobile ? window.innerHeight * 0.55 : window.innerHeight * 0.75;

      // Calculate scale to fit image into container
      const scaleW = containerW / image.width;
      const scaleH = containerH / image.height;
      
      // Use the smaller scale to fit within both dimensions, max 2x upscale
      const newBaseScale = Math.min(scaleW, scaleH, 2);
      
      setBaseScale(newBaseScale);
    };

    const timeout = setTimeout(updateSize, 50);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      clearTimeout(timeout);
    };
  }, [image]);

  // Update stage size when zoom or base scale changes
  useEffect(() => {
    if (!image) return;
    const newSize = {
      width: image.width * scale,
      height: image.height * scale
    };
    setStageSize(newSize);
    onSizeChange?.(newSize);
  }, [scale, image, onSizeChange]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getMaskBlob: async () => {
      if (!stageRef.current || !image || stageSize.width <= 0 || stageSize.height <= 0) return null;

      // Create mask with STAGE dimensions (what user sees on screen)
      // Server will resize this mask to match the actual image
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(stageSize.width);
      canvas.height = Math.round(stageSize.height);
      
      console.log('Creating mask:', canvas.width, 'x', canvas.height);
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Fill with black (area to keep)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw white strokes (area to remove)
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Points are stored in stage coordinates (already scaled)
      for (const line of lines) {
        if (line.points.length < 2) continue;
        
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(line.points[0], line.points[1]);
        
        for (let i = 2; i < line.points.length; i += 2) {
          ctx.lineTo(line.points[i], line.points[i + 1]);
        }
        ctx.stroke();
      }

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    },
    clearMask: () => {
      setLines([]);
      onClear?.();
    }
  }));

  // Drawing handlers - store points in STAGE coordinates (not divided by scale)
  const handleMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawingEnabled) return;
    
    isDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    // Store in stage coordinates directly
    setLines([...lines, { tool: 'eraser', points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing.current || !isDrawingEnabled) return;
    
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    // Store in stage coordinates directly
    let lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    onDrawEnd?.();
  };

  if (status === 'loading') {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center bg-card/50 rounded-xl border border-white/5">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 canvas-container" style={{ width: stageSize.width || 'auto', height: stageSize.height || 'auto' }}>
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        ref={stageRef}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              width={stageSize.width}
              height={stageSize.height}
              name="base-image"
            />
          )}
        </Layer>
        <Layer ref={maskLayerRef}>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="#ff0000"
              strokeWidth={brushSize}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              opacity={0.5}
            />
          ))}
        </Layer>
      </Stage>
      {children}
    </div>
  );
});

CanvasEditor.displayName = "CanvasEditor";
