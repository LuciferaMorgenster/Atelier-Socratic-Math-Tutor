import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
  Eye,
  Edit3,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface ScratchpadCanvasProps {
  problemImageUrl?: string | null;
  problemTitle?: string;
}

type ToolMode = 'pen' | 'highlighter' | 'eraser';

export const ScratchpadCanvas: React.FC<ScratchpadCanvasProps> = ({
  problemImageUrl,
  problemTitle = 'Math Scratchpad',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active view tab: 'scratchpad' or 'problem'
  const [activeTab, setActiveTab] = useState<'scratchpad' | 'problem'>(
    problemImageUrl ? 'problem' : 'scratchpad'
  );

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<ToolMode>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#2A2421');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);

  // Problem view zoom
  const [photoZoom, setPhotoZoom] = useState<number>(1);

  // Color options
  const colorPalette = [
    { name: 'Ink Sepia', value: '#2A2421' },
    { name: 'Terracotta', value: '#C85A32' },
    { name: 'Indigo', value: '#1D4ED8' },
    { name: 'Sage Green', value: '#15803D' },
    { name: 'Plum', value: '#7E22CE' },
  ];

  // Initialize and resize canvas
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Save previous drawing if exists
    let previousImage: ImageData | null = null;
    const ctx = canvas.getContext('2d');
    if (ctx && canvas.width > 0 && canvas.height > 0) {
      try {
        previousImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        // ignore
      }
    }

    const width = Math.floor(rect.width) || 600;
    const height = Math.floor(rect.height) || 500;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (previousImage) {
        ctx.putImageData(previousImage, 0, 0);
      } else {
        // Initial state save
        saveHistoryState();
      }
    }
  }, []);

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas, activeTab]);

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => {
        const next = prev.slice(0, historyStep + 1);
        return [...next, data];
      });
      setHistoryStep((prev) => prev + 1);
    } catch (e) {
      console.warn('Canvas state save error:', e);
    }
  };

  const undo = () => {
    if (historyStep <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prevIndex = historyStep - 1;
    const targetState = history[prevIndex];
    if (targetState) {
      ctx.putImageData(targetState, 0, 0);
      setHistoryStep(prevIndex);
    }
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nextIndex = historyStep + 1;
    const targetState = history[nextIndex];
    if (targetState) {
      ctx.putImageData(targetState, 0, 0);
      setHistoryStep(nextIndex);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    saveHistoryState();
  };

  // Coordinate helper
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCoordinates(e);
    setLastPoint(coords);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);

    ctx.save();
    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 4;
    } else if (currentTool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = currentColor === '#2A2421' ? '#F59E0B' : currentColor;
      ctx.lineWidth = strokeWidth * 5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeWidth;
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.restore();

    setLastPoint(coords);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setLastPoint(null);
    saveHistoryState();
  };

  const downloadNotes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas with warm paper background to save
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return;

    // Fill parchment color
    tCtx.fillStyle = '#FAF7F2';
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw grid lines
    tCtx.strokeStyle = 'rgba(215, 203, 187, 0.4)';
    tCtx.lineWidth = 1;
    const gridSize = 30 * (window.devicePixelRatio || 1);
    for (let x = 0; x < tempCanvas.width; x += gridSize) {
      tCtx.beginPath();
      tCtx.moveTo(x, 0);
      tCtx.lineTo(x, tempCanvas.height);
      tCtx.stroke();
    }
    for (let y = 0; y < tempCanvas.height; y += gridSize) {
      tCtx.beginPath();
      tCtx.moveTo(0, y);
      tCtx.lineTo(tempCanvas.width, y);
      tCtx.stroke();
    }

    // Draw user ink
    tCtx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `atelier-scratchwork-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2] border border-[#E3D9CC] rounded-xl overflow-hidden shadow-sm">
      {/* Tab bar header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F2EDE4] border-b border-[#E3D9CC]">
        <div className="flex items-center gap-1.5 p-1 bg-[#E8E1D5] rounded-lg">
          {problemImageUrl && (
            <button
              onClick={() => setActiveTab('problem')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === 'problem'
                  ? 'bg-white text-[#2A2421] shadow-xs font-semibold'
                  : 'text-[#6B5E52] hover:text-[#2A2421]'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Problem Image</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('scratchpad')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              activeTab === 'scratchpad'
                ? 'bg-white text-[#2A2421] shadow-xs font-semibold'
                : 'text-[#6B5E52] hover:text-[#2A2421]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>Interactive Slate</span>
          </button>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'problem' && (
            <div className="flex items-center gap-1 bg-white/70 px-2 py-1 rounded-md border border-[#E3D9CC] text-xs text-[#52463D]">
              <button
                onClick={() => setPhotoZoom((z) => Math.max(0.7, z - 0.2))}
                className="p-1 hover:text-[#C85A32] rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1">{Math.round(photoZoom * 100)}%</span>
              <button
                onClick={() => setPhotoZoom((z) => Math.min(2.5, z + 0.2))}
                className="p-1 hover:text-[#C85A32] rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPhotoZoom(1)}
                className="p-1 hover:text-[#C85A32] rounded transition-colors"
                title="Reset Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'scratchpad' && (
            <div className="flex items-center gap-1">
              <button
                onClick={undo}
                disabled={historyStep <= 0}
                className="p-1.5 text-[#6B5E52] hover:text-[#2A2421] disabled:opacity-30 rounded hover:bg-white/60 transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={historyStep >= history.length - 1}
                className="p-1.5 text-[#6B5E52] hover:text-[#2A2421] disabled:opacity-30 rounded hover:bg-white/60 transition-colors"
                title="Redo"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={clearCanvas}
                className="p-1.5 text-[#6B5E52] hover:text-[#B91C1C] rounded hover:bg-white/60 transition-colors"
                title="Clear Slate"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={downloadNotes}
                className="p-1.5 text-[#6B5E52] hover:text-[#C85A32] rounded hover:bg-white/60 transition-colors"
                title="Download Scratchwork"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main workspace view */}
      <div ref={containerRef} className="relative flex-1 w-full overflow-hidden">
        {/* Tab 1: Problem Image Viewer */}
        {activeTab === 'problem' && problemImageUrl && (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-auto bg-[#FAF7F2]">
            <div
              className="relative transition-transform duration-150 origin-center max-w-full max-h-full shadow-md rounded-lg overflow-hidden border border-[#DED4C5]"
              style={{ transform: `scale(${photoZoom})` }}
            >
              <img
                src={problemImageUrl}
                alt={problemTitle}
                referrerPolicy="no-referrer"
                className="object-contain max-h-[500px] w-auto max-w-full select-none"
              />
            </div>
            <p className="mt-3 text-xs text-[#7A6D61] text-center">
              Inspect your problem here, or toggle to the <strong className="text-[#A84824]">Interactive Slate</strong> tab to work through intermediate equations.
            </p>
          </div>
        )}

        {/* Tab 2: Canvas Scratchpad */}
        <div
          className={`w-full h-full bg-canvas-slate cursor-crosshair touch-none ${
            activeTab === 'scratchpad' ? 'block' : 'hidden'
          }`}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full h-full block"
          />
        </div>
      </div>

      {/* Slate Tool Bar (Bottom) */}
      {activeTab === 'scratchpad' && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#F2EDE4] border-t border-[#E3D9CC]">
          {/* Tool select */}
          <div className="flex items-center gap-1 bg-[#E8E1D5] p-1 rounded-lg">
            <button
              onClick={() => setCurrentTool('pen')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                currentTool === 'pen'
                  ? 'bg-white text-[#2A2421] shadow-xs'
                  : 'text-[#6B5E52] hover:text-[#2A2421]'
              }`}
              title="Fountain Pen"
            >
              <Pen className="w-3.5 h-3.5" />
              <span>Pen</span>
            </button>
            <button
              onClick={() => setCurrentTool('highlighter')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                currentTool === 'highlighter'
                  ? 'bg-white text-[#2A2421] shadow-xs'
                  : 'text-[#6B5E52] hover:text-[#2A2421]'
              }`}
              title="Highlighter"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>Highlight</span>
            </button>
            <button
              onClick={() => setCurrentTool('eraser')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                currentTool === 'eraser'
                  ? 'bg-white text-[#2A2421] shadow-xs'
                  : 'text-[#6B5E52] hover:text-[#2A2421]'
              }`}
              title="Eraser"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Eraser</span>
            </button>
          </div>

          {/* Stroke Widths */}
          <div className="flex items-center gap-1 bg-[#E8E1D5] p-1 rounded-lg">
            {[2, 4, 8].map((size) => (
              <button
                key={size}
                onClick={() => setStrokeWidth(size)}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                  strokeWidth === size ? 'bg-white shadow-xs' : 'hover:bg-white/50'
                }`}
                title={`${size}px line`}
              >
                <div
                  className="rounded-full bg-[#2A2421]"
                  style={{ width: `${size * 1.5}px`, height: `${size * 1.5}px` }}
                />
              </button>
            ))}
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1.5">
            {colorPalette.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setCurrentColor(c.value);
                  if (currentTool === 'eraser') setCurrentTool('pen');
                }}
                className={`w-5 h-5 rounded-full transition-transform ${
                  currentColor === c.value && currentTool !== 'eraser'
                    ? 'ring-2 ring-offset-2 ring-[#C85A32] scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
