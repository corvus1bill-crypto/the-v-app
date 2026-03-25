import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Move, RotateCcw, ZoomIn, ZoomOut, Minus, Plus } from 'lucide-react';
import {
  AspectRatioKey,
  ASPECT_RATIOS,
  CropRect,
  getCenterCropRect,
} from '../utils/imageProcessing';

interface CropModalData {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  ratio: number;
  needsCrop: boolean;
  suggestedRatio: AspectRatioKey;
}

interface AspectRatioCropModalProps {
  data: CropModalData;
  onConfirm: (ratio: AspectRatioKey, cropRect: CropRect) => void;
  onCancel: () => void;
}

// Visual ratio icon shapes
function RatioIcon({ ratio, active }: { ratio: AspectRatioKey; active: boolean }) {
  const border = active ? 'border-background' : 'border-foreground';
  const sizeMap: Record<AspectRatioKey, { w: string; h: string }> = {
    '1:1': { w: 'w-3.5', h: 'h-3.5' },
    '4:5': { w: 'w-3', h: 'h-[15px]' },
    '9:16': { w: 'w-2.5', h: 'h-4' },
    '1.91:1': { w: 'w-[18px]', h: 'h-2.5' },
    'original': { w: 'w-3.5', h: 'h-3' },
  };
  const size = sizeMap[ratio];

  return (
    <div className={`${size.w} ${size.h} border-2 ${border} ${ratio === 'original' ? 'border-dashed' : ''}`} />
  );
}

export function AspectRatioCropModal({
  data,
  onConfirm,
  onCancel,
}: AspectRatioCropModalProps) {
  const { dataUrl: imageDataUrl, width: naturalWidth, height: naturalHeight, needsCrop, suggestedRatio } = data;
  const naturalRatio = naturalWidth / naturalHeight;
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioKey>(suggestedRatio);
  const [cropRect, setCropRect] = useState<CropRect>(() =>
    computeCrop(suggestedRatio, naturalWidth, naturalHeight)
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [showDragHint, setShowDragHint] = useState(true);
  const [zoom, setZoom] = useState(1); // 1 = default crop, >1 = zoomed in
  const previewRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  // Available ratios
  const availableRatios: AspectRatioKey[] = needsCrop
    ? ['1:1', '4:5', '9:16', '1.91:1']
    : ['1:1', '4:5', '9:16', '1.91:1', 'original'];

  function computeCrop(ratio: AspectRatioKey, w: number, h: number): CropRect {
    if (ratio === 'original') {
      return { x: 0, y: 0, width: 1, height: 1 };
    }
    const targetRatio = ASPECT_RATIOS[ratio].value;
    return getCenterCropRect(w, h, targetRatio);
  }

  // Get the base (unzoomed) crop for the current ratio
  function getBaseCrop(): CropRect {
    return computeCrop(selectedRatio, naturalWidth, naturalHeight);
  }

  // Apply zoom to a base crop rect — shrinks dimensions, keeps centered
  function applyZoom(baseCrop: CropRect, z: number): CropRect {
    if (z <= 1 || selectedRatio === 'original') return baseCrop;

    const newW = baseCrop.width / z;
    const newH = baseCrop.height / z;

    // Keep centered relative to previous crop center
    const centerX = baseCrop.x + baseCrop.width / 2;
    const centerY = baseCrop.y + baseCrop.height / 2;

    const newX = Math.max(0, Math.min(1 - newW, centerX - newW / 2));
    const newY = Math.max(0, Math.min(1 - newH, centerY - newH / 2));

    return { x: newX, y: newY, width: newW, height: newH };
  }

  useEffect(() => {
    const base = computeCrop(selectedRatio, naturalWidth, naturalHeight);
    setCropRect(applyZoom(base, zoom));
    setShowDragHint(true);
  }, [selectedRatio, naturalWidth, naturalHeight]);

  // When zoom changes, re-apply to current crop center
  useEffect(() => {
    if (selectedRatio === 'original') return;
    const baseCrop = getBaseCrop();

    // Preserve current center
    const currentCenterX = cropRect.x + cropRect.width / 2;
    const currentCenterY = cropRect.y + cropRect.height / 2;

    const newW = baseCrop.width / zoom;
    const newH = baseCrop.height / zoom;

    const newX = Math.max(0, Math.min(1 - newW, currentCenterX - newW / 2));
    const newY = Math.max(0, Math.min(1 - newH, currentCenterY - newH / 2));

    setCropRect({ x: newX, y: newY, width: newW, height: newH });
  }, [zoom]);

  // Hide drag hint after first interaction
  useEffect(() => {
    if (isDragging) setShowDragHint(false);
  }, [isDragging]);

  // Drag to pan crop rect
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (selectedRatio === 'original') return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setCropStart({ x: cropRect.x, y: cropRect.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [cropRect, selectedRatio]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStart.x) / rect.width;
    const dy = (e.clientY - dragStart.y) / rect.height;

    const newX = Math.max(0, Math.min(1 - cropRect.width, cropStart.x + dx));
    const newY = Math.max(0, Math.min(1 - cropRect.height, cropStart.y + dy));

    setCropRect(prev => ({ ...prev, x: newX, y: newY }));
  }, [isDragging, dragStart, cropStart, cropRect.width, cropRect.height]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetCrop = () => {
    setZoom(1);
    setCropRect(computeCrop(selectedRatio, naturalWidth, naturalHeight));
  };

  const handleZoomIn = () => setZoom(z => Math.min(4, z + 0.25));
  const handleZoomOut = () => setZoom(z => Math.max(1, z - 0.25));

  // Compute display dimensions
  const maxPreviewH = 360;
  const maxPreviewW = 380;
  let displayW: number, displayH: number;
  if (naturalRatio > maxPreviewW / maxPreviewH) {
    displayW = maxPreviewW;
    displayH = maxPreviewW / naturalRatio;
  } else {
    displayH = maxPreviewH;
    displayW = maxPreviewH * naturalRatio;
  }

  // Compute output dimensions for info display
  const cropW = Math.round(cropRect.width * naturalWidth);
  const cropH = Math.round(cropRect.height * naturalHeight);

  const canZoom = selectedRatio !== 'original';
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-foreground/80 backdrop-blur-sm p-4">
      <div
        className="bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_var(--foreground)] w-full max-w-[420px] max-h-[90%] flex flex-col overflow-hidden"
        style={{ animation: 'scaleIn 0.3s cubic-bezier(.22,.68,0,1.2) both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-4 border-foreground bg-foreground">
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--background)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <X size={18} strokeWidth={3} className="text-foreground" />
          </button>
          <div className="text-center">
            <h2 className="text-sm font-black uppercase tracking-tight text-background">
              {needsCrop ? 'CROP REQUIRED' : 'CROP IMAGE'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onConfirm(selectedRatio, cropRect)}
            className="w-9 h-9 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--background)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Check size={18} strokeWidth={3} className="text-foreground" />
          </button>
        </div>

        {/* Warning if crop is mandatory */}
        {needsCrop && (
          <div className="px-4 py-1.5 bg-destructive text-white text-[10px] font-black uppercase tracking-wider text-center border-b-2 border-foreground">
            ⚠ IMAGE TOO TALL — SELECT A CROP
          </div>
        )}

        {/* Preview area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-foreground/10 overflow-hidden min-h-0">
          <div
            ref={previewRef}
            className="relative select-none cursor-grab active:cursor-grabbing border-2 border-foreground"
            style={{ width: displayW, height: displayH }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Full image (dimmed) */}
            <img
              src={imageDataUrl}
              alt="Crop preview"
              className="absolute inset-0 w-full h-full object-cover opacity-25"
              draggable={false}
            />

            {/* Crop window (bright) */}
            <div
              className="absolute overflow-hidden border-2 border-foreground shadow-[0_0_0_1px_var(--background),0_0_0_3px_var(--foreground)]"
              style={{
                left: `${cropRect.x * 100}%`,
                top: `${cropRect.y * 100}%`,
                width: `${cropRect.width * 100}%`,
                height: `${cropRect.height * 100}%`,
                transition: isDragging ? 'none' : 'all 0.15s ease-out',
              }}
            >
              <img
                src={imageDataUrl}
                alt="Crop area"
                draggable={false}
                className="absolute"
                style={{
                  width: `${100 / cropRect.width}%`,
                  height: `${100 / cropRect.height}%`,
                  left: `${(-cropRect.x / cropRect.width) * 100}%`,
                  top: `${(-cropRect.y / cropRect.height) * 100}%`,
                }}
              />

              {/* Rule of thirds grid */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-foreground/30" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-foreground/30" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-foreground/30" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-foreground/30" />
              </div>

              {/* Corner handles */}
              {selectedRatio !== 'original' && (
                <>
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-foreground pointer-events-none" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-foreground pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-foreground pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-foreground pointer-events-none" />
                </>
              )}

              {/* Drag hint — fades after first drag */}
              {selectedRatio !== 'original' && showDragHint && !isDragging && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-pulse">
                  <div className="bg-foreground/70 px-3 py-1.5 flex items-center gap-1.5 border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)]">
                    <Move size={12} className="text-background" strokeWidth={3} />
                    <span className="text-[10px] font-black text-background uppercase">DRAG</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        {canZoom && (
          <div className="px-4 py-2.5 border-t-2 border-foreground/30 flex items-center gap-3">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className={`w-8 h-8 border-2 border-foreground flex items-center justify-center transition-all ${
                zoom <= 1
                  ? 'opacity-30 cursor-not-allowed'
                  : 'bg-background hover:bg-foreground hover:text-background shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'
              }`}
            >
              <Minus size={14} strokeWidth={3} />
            </button>

            <div className="flex-1 flex items-center gap-2">
              <ZoomOut size={12} strokeWidth={2.5} className="text-foreground/40 shrink-0" />
              <div className="flex-1 relative h-8 flex items-center">
                <div className="absolute inset-x-0 h-1 bg-foreground/15 border border-foreground/20" />
                <div
                  className="absolute h-1 bg-foreground border border-foreground"
                  style={{ width: `${((zoom - 1) / 3) * 100}%` }}
                />
                <input
                  ref={sliderRef}
                  type="range"
                  min={100}
                  max={400}
                  step={5}
                  value={zoom * 100}
                  onChange={(e) => setZoom(Number(e.target.value) / 100)}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
                {/* Custom thumb */}
                <div
                  className="absolute w-5 h-5 bg-foreground border-2 border-background shadow-[2px_2px_0px_0px_var(--foreground)] pointer-events-none -translate-x-1/2"
                  style={{ left: `${((zoom - 1) / 3) * 100}%` }}
                />
              </div>
              <ZoomIn size={12} strokeWidth={2.5} className="text-foreground/40 shrink-0" />
            </div>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className={`w-8 h-8 border-2 border-foreground flex items-center justify-center transition-all ${
                zoom >= 4
                  ? 'opacity-30 cursor-not-allowed'
                  : 'bg-background hover:bg-foreground hover:text-background shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'
              }`}
            >
              <Plus size={14} strokeWidth={3} />
            </button>

            <span className="text-[10px] font-mono font-black text-foreground/50 w-10 text-right">
              {zoomPercent}%
            </span>
          </div>
        )}

        {/* Aspect Ratio Picker */}
        <div className="px-3 py-3 border-t-4 border-foreground bg-foreground/5">
          <div className="flex items-center gap-1.5">
            {availableRatios.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => { setSelectedRatio(key); setZoom(1); }}
                className={`flex-1 flex flex-col items-center gap-1 py-2 border-2 border-foreground font-black uppercase text-[10px] tracking-wider transition-all ${
                  selectedRatio === key
                    ? 'bg-foreground text-background shadow-[3px_3px_0px_0px_var(--background)]'
                    : 'bg-background text-foreground shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'
                }`}
              >
                <RatioIcon ratio={key} active={selectedRatio === key} />
                <span>{key === 'original' ? 'FREE' : key}</span>
              </button>
            ))}

            {/* Reset button */}
            <button
              type="button"
              onClick={resetCrop}
              className="w-10 h-full flex flex-col items-center justify-center gap-1 py-2 border-2 border-foreground bg-background text-foreground shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              title="Reset"
            >
              <RotateCcw size={14} strokeWidth={3} />
              <span className="text-[8px] font-black uppercase">RST</span>
            </button>
          </div>
        </div>

        {/* Bottom info bar */}
        <div className="px-4 py-2 border-t-2 border-foreground/20 bg-foreground/5 flex items-center justify-between">
          <span className="text-[9px] font-mono font-bold text-foreground/40">
            {naturalWidth} × {naturalHeight}
          </span>
          <span className="text-[9px] font-mono font-black text-foreground/60 uppercase">
            {selectedRatio !== 'original'
              ? `${ASPECT_RATIOS[selectedRatio].label} (${selectedRatio})`
              : 'Original'}
          </span>
          <span className="text-[9px] font-mono font-bold text-foreground/40">
            {cropW} × {cropH}
          </span>
        </div>
      </div>
    </div>
  );
}
