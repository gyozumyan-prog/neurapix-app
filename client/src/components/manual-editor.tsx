import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Rect, Ellipse, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import { Loader2 } from 'lucide-react';
import Konva from 'konva';

type ToolMode = 'select' | 'crop' | 'brush' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line';

interface ManualEditorProps {
  imageUrl: string;
  width: number;
  height: number;
  tool: ToolMode;
  brushSize: number;
  brushColor: string;
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  textToAdd?: string;
  onCropChange?: (crop: { x: number; y: number; width: number; height: number } | null) => void;
  onTextAdded?: () => void;
}

export interface ManualEditorRef {
  getEditedImage: () => Promise<Blob | null>;
  addText: (text: string) => void;
  resetTransforms: () => void;
  applyCrop: () => void;
}

interface DrawLine {
  tool: 'brush' | 'eraser';
  points: number[];
  color: string;
  size: number;
}

interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  color: string;
  text?: string;
  fontSize?: number;
}

export const ManualEditor = forwardRef<ManualEditorRef, ManualEditorProps>(({
  imageUrl,
  width,
  height,
  tool,
  brushSize,
  brushColor,
  brightness,
  contrast,
  saturation,
  rotation,
  textToAdd,
  onCropChange,
  onTextAdded
}, ref) => {
  const [image, status] = useImage(imageUrl, 'anonymous');
  const [lines, setLines] = useState<DrawLine[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newShapeStart, setNewShapeStart] = useState<{ x: number; y: number } | null>(null);
  
  const stageRef = useRef<Konva.Stage>(null);
  const imageLayerRef = useRef<Konva.Layer>(null);
  const imageRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current || !image) return;
      const containerW = containerRef.current.clientWidth;
      const containerH = window.innerHeight * 0.70;
      const scaleW = containerW / image.width;
      const scaleH = containerH / image.height;
      const newScale = Math.min(scaleW, scaleH, 3);
      setScale(newScale);
      setStageSize({
        width: image.width * newScale,
        height: image.height * newScale
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [image]);

  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const selectedNode = stageRef.current.findOne('#' + selectedId);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedId]);

  useEffect(() => {
    if (imageRef.current && image) {
      imageRef.current.cache();
      imageRef.current.getLayer()?.batchDraw();
    }
  }, [image, brightness, contrast, saturation]);

  const getPointerPosition = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return { x: pos.x / scale, y: pos.y / scale };
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const pos = getPointerPosition();
    
    if (tool === 'select') {
      const clickedOnEmpty = e.target === e.target.getStage() || e.target.className === 'Image';
      if (clickedOnEmpty) {
        setSelectedId(null);
      }
      return;
    }
    
    if (tool === 'brush' || tool === 'eraser') {
      setIsDrawing(true);
      setLines([...lines, { 
        tool: tool, 
        points: [pos.x, pos.y], 
        color: tool === 'eraser' ? '#ffffff' : brushColor,
        size: brushSize 
      }]);
      return;
    }
    
    if (tool === 'crop') {
      setIsDrawing(true);
      setNewShapeStart(pos);
      setCropRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
      return;
    }
    
    if (tool === 'rectangle' || tool === 'circle' || tool === 'line') {
      setIsDrawing(true);
      setNewShapeStart(pos);
      return;
    }
    
    if (tool === 'text' && textToAdd && textToAdd.trim()) {
      const newShape: Shape = {
        id: 'text-' + Date.now(),
        type: 'text',
        x: pos.x,
        y: pos.y,
        color: brushColor,
        text: textToAdd.trim(),
        fontSize: brushSize * 2
      };
      setShapes([...shapes, newShape]);
      setSelectedId(newShape.id);
      onTextAdded?.();
    }
  };

  const handleMouseMove = () => {
    if (!isDrawing) return;
    const pos = getPointerPosition();
    
    if (tool === 'brush' || tool === 'eraser') {
      const lastLine = lines[lines.length - 1];
      lastLine.points = lastLine.points.concat([pos.x, pos.y]);
      setLines([...lines.slice(0, -1), lastLine]);
      return;
    }
    
    if (tool === 'crop' && newShapeStart) {
      setCropRect({
        x: Math.min(newShapeStart.x, pos.x),
        y: Math.min(newShapeStart.y, pos.y),
        width: Math.abs(pos.x - newShapeStart.x),
        height: Math.abs(pos.y - newShapeStart.y)
      });
      onCropChange?.(cropRect);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const pos = getPointerPosition();
    
    if ((tool === 'rectangle' || tool === 'circle' || tool === 'line') && newShapeStart) {
      const newShape: Shape = {
        id: tool + '-' + Date.now(),
        type: tool,
        x: Math.min(newShapeStart.x, pos.x),
        y: Math.min(newShapeStart.y, pos.y),
        width: Math.abs(pos.x - newShapeStart.x),
        height: Math.abs(pos.y - newShapeStart.y),
        radius: Math.max(Math.abs(pos.x - newShapeStart.x), Math.abs(pos.y - newShapeStart.y)) / 2,
        points: [newShapeStart.x, newShapeStart.y, pos.x, pos.y],
        color: brushColor
      };
      if (newShape.width! > 5 || newShape.height! > 5) {
        setShapes([...shapes, newShape]);
      }
    }
    
    setNewShapeStart(null);
  };

  const getImageFilters = () => {
    if (!image) return undefined;
    if (brightness === 0 && contrast === 0 && saturation === 0) return undefined;
    return [Konva.Filters.Brighten, Konva.Filters.Contrast, Konva.Filters.HSL];
  };

  useImperativeHandle(ref, () => ({
    getEditedImage: async () => {
      if (!stageRef.current || !image) return null;
      
      const exportPixelRatio = image.width / stageSize.width;
      
      let exportX = 0;
      let exportY = 0;
      let exportWidth = stageSize.width;
      let exportHeight = stageSize.height;
      
      if (cropRect && cropRect.width > 0 && cropRect.height > 0) {
        exportX = cropRect.x * scale;
        exportY = cropRect.y * scale;
        exportWidth = cropRect.width * scale;
        exportHeight = cropRect.height * scale;
      }
      
      return new Promise<Blob | null>((resolve) => {
        try {
          const dataUrl = stageRef.current!.toDataURL({ 
            pixelRatio: exportPixelRatio,
            x: exportX,
            y: exportY,
            width: exportWidth,
            height: exportHeight,
            mimeType: 'image/png',
            quality: 1
          });
          
          fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => resolve(blob))
            .catch(() => resolve(null));
        } catch (error) {
          console.error('Export error:', error);
          resolve(null);
        }
      });
    },
    
    addText: (text: string) => {
      const newShape: Shape = {
        id: 'text-' + Date.now(),
        type: 'text',
        x: (image?.width || 200) / 2,
        y: (image?.height || 200) / 2,
        color: brushColor,
        text: text,
        fontSize: brushSize * 2
      };
      setShapes([...shapes, newShape]);
      setSelectedId(newShape.id);
    },
    
    resetTransforms: () => {
      setLines([]);
      setShapes([]);
      setCropRect(null);
      setSelectedId(null);
    },
    
    applyCrop: () => {
      if (cropRect && cropRect.width > 0 && cropRect.height > 0) {
        onCropChange?.(cropRect);
      }
    }
  }));

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === 'failed' || !image) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Не удалось загрузить изображение
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{ 
          cursor: tool === 'brush' || tool === 'eraser' ? 'crosshair' : 
                  tool === 'crop' ? 'crop' :
                  tool === 'text' ? 'text' : 'default'
        }}
      >
        <Layer ref={imageLayerRef}>
          <KonvaImage
            ref={imageRef}
            image={image}
            x={rotation !== 0 ? image.width / 2 : 0}
            y={rotation !== 0 ? image.height / 2 : 0}
            width={image.width}
            height={image.height}
            rotation={rotation}
            offsetX={rotation !== 0 ? image.width / 2 : 0}
            offsetY={rotation !== 0 ? image.height / 2 : 0}
            filters={getImageFilters()}
            brightness={brightness / 100}
            contrast={contrast}
            saturation={Math.max(-1, Math.min(1, saturation / 100))}
          />
        </Layer>
        
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.size}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}
          
          {shapes.map((shape) => {
            if (shape.type === 'rectangle') {
              return (
                <Rect
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  stroke={shape.color}
                  strokeWidth={2}
                  draggable={tool === 'select'}
                  onClick={() => tool === 'select' && setSelectedId(shape.id)}
                  onTap={() => tool === 'select' && setSelectedId(shape.id)}
                />
              );
            }
            if (shape.type === 'circle') {
              return (
                <Ellipse
                  key={shape.id}
                  id={shape.id}
                  x={shape.x + (shape.width || 0) / 2}
                  y={shape.y + (shape.height || 0) / 2}
                  radiusX={(shape.width || 0) / 2}
                  radiusY={(shape.height || 0) / 2}
                  stroke={shape.color}
                  strokeWidth={2}
                  draggable={tool === 'select'}
                  onClick={() => tool === 'select' && setSelectedId(shape.id)}
                  onTap={() => tool === 'select' && setSelectedId(shape.id)}
                />
              );
            }
            if (shape.type === 'line') {
              return (
                <Line
                  key={shape.id}
                  id={shape.id}
                  points={shape.points || []}
                  stroke={shape.color}
                  strokeWidth={2}
                  draggable={tool === 'select'}
                  onClick={() => tool === 'select' && setSelectedId(shape.id)}
                  onTap={() => tool === 'select' && setSelectedId(shape.id)}
                />
              );
            }
            if (shape.type === 'text') {
              return (
                <Text
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  text={shape.text}
                  fontSize={shape.fontSize}
                  fill={shape.color}
                  draggable={tool === 'select'}
                  onClick={() => tool === 'select' && setSelectedId(shape.id)}
                  onTap={() => tool === 'select' && setSelectedId(shape.id)}
                />
              );
            }
            return null;
          })}
          
          {cropRect && cropRect.width > 0 && cropRect.height > 0 && (
            <>
              <Rect
                x={0}
                y={0}
                width={image.width}
                height={image.height}
                fill="rgba(0,0,0,0.5)"
              />
              <Rect
                x={cropRect.x}
                y={cropRect.y}
                width={cropRect.width}
                height={cropRect.height}
                fill="transparent"
                stroke="#fff"
                strokeWidth={2}
                dash={[10, 5]}
                globalCompositeOperation="destination-out"
              />
              <Rect
                x={cropRect.x}
                y={cropRect.y}
                width={cropRect.width}
                height={cropRect.height}
                stroke="#fff"
                strokeWidth={2}
                dash={[10, 5]}
              />
            </>
          )}
          
          {selectedId && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
});

ManualEditor.displayName = 'ManualEditor';
