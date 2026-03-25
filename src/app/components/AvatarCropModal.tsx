import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, Minus, Plus } from 'lucide-react';

interface AvatarCropModalProps {
  imageUrl: string;      // blob URL or data URL of the source image
  naturalWidth: number;
  naturalHeight: number;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

const PREVIEW_SIZE = 310;  // outer container px
const CIRCLE_SIZE  = 270;  // crop circle diameter
const OUTPUT_SIZE  = 400;  // output canvas size (retina-quality for ~200px display)

export function AvatarCropModal({
  imageUrl,
  naturalWidth,
  naturalHeight,
  onConfirm,
  onCancel,
}: AvatarCropModalProps) {
  const [zoom, setZoom]     = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart,  setDragStart]  = useState({ x: 0, y: 0 });
  const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 });
  const [showHint, setShowHint]     = useState(true);

  const naturalRatio = naturalWidth / naturalHeight;

  // Base dimensions that fit the image snugly inside the crop circle
  let baseW: number, baseH: number;
  if (naturalRatio >= 1) {
    baseW = CIRCLE_SIZE;
    baseH = CIRCLE_SIZE / naturalRatio;
  } else {
    baseH = CIRCLE_SIZE;
    baseW = CIRCLE_SIZE * naturalRatio;
  }

  // Clamp offset so the crop circle is always fully covered by the image
  const clampOffset = useCallback(
    (ox: number, oy: number, z: number): { x: number; y: number } => {
      const dW = baseW * z;
      const dH = baseH * z;

      const imgLeft   = PREVIEW_SIZE / 2 - dW / 2 + ox;
      const imgTop    = PREVIEW_SIZE / 2 - dH / 2 + oy;
      const imgRight  = imgLeft + dW;
      const imgBottom = imgTop  + dH;

      const circleLeft   = PREVIEW_SIZE / 2 - CIRCLE_SIZE / 2;
      const circleTop    = PREVIEW_SIZE / 2 - CIRCLE_SIZE / 2;
      const circleRight  = PREVIEW_SIZE / 2 + CIRCLE_SIZE / 2;
      const circleBottom = PREVIEW_SIZE / 2 + CIRCLE_SIZE / 2;

      let cx = ox;
      let cy = oy;
      if (imgLeft   > circleLeft)   cx -= (imgLeft   - circleLeft);
      if (imgRight  < circleRight)  cx += (circleRight  - imgRight);
      if (imgTop    > circleTop)    cy -= (imgTop    - circleTop);
      if (imgBottom < circleBottom) cy += (circleBottom - imgBottom);

      return { x: cx, y: cy };
    },
    [baseW, baseH]
  );

  // Re-clamp whenever zoom changes
  useEffect(() => {
    setOffset(prev => clampOffset(prev.x, prev.y, zoom));
  }, [zoom, clampOffset]);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setShowHint(false);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOffsetStart({ x: offset.x, y: offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setOffset(clampOffset(offsetStart.x + dx, offsetStart.y + dy, zoom));
  }, [isDragging, dragStart, offsetStart, zoom, clampOffset]);

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  // ── Confirm: render crop to canvas ────────────────────────────────────────
  const handleConfirm = () => {
    const displayW = baseW * zoom;
    const displayH = baseH * zoom;

    const imgLeft  = PREVIEW_SIZE / 2 - displayW / 2 + offset.x;
    const imgTop   = PREVIEW_SIZE / 2 - displayH / 2 + offset.y;
    const circleLeft = PREVIEW_SIZE / 2 - CIRCLE_SIZE / 2;
    const circleTop  = PREVIEW_SIZE / 2 - CIRCLE_SIZE / 2;

    // Map circle bounds back to natural-image coordinates
    const scaleX = naturalWidth  / displayW;
    const scaleY = naturalHeight / displayH;

    const srcX = (circleLeft - imgLeft) * scaleX;
    const srcY = (circleTop  - imgTop)  * scaleY;
    const srcW = CIRCLE_SIZE * scaleX;
    const srcH = CIRCLE_SIZE * scaleY;

    const canvas = document.createElement('canvas');
    canvas.width  = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled  = true;
    ctx.imageSmoothingQuality  = 'high';

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onConfirm(dataUrl);
    };
    img.src = imageUrl;
  };

  const displayW   = baseW * zoom;
  const displayH   = baseH * zoom;
  const zoomPct    = Math.round(zoom * 100);

  return (
    <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-foreground/80 backdrop-blur-sm p-4">
      <div
        className="bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_var(--foreground)] w-full max-w-[380px] flex flex-col overflow-hidden"
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
          <h2 className="text-sm font-black uppercase tracking-tight text-background">CROP PHOTO</h2>
          <button
            type="button"
            onClick={handleConfirm}
            className="w-9 h-9 bg-accent border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--background)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Check size={18} strokeWidth={3} className="text-background" />
          </button>
        </div>

        {/* Crop preview */}
        <div className="flex items-center justify-center p-5 bg-foreground/10">
          <div
            className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Source image */}
            <img
              src={imageUrl}
              alt="Crop preview"
              draggable={false}
              style={{
                position: 'absolute',
                width: displayW,
                height: displayH,
                left: PREVIEW_SIZE / 2 - displayW / 2 + offset.x,
                top:  PREVIEW_SIZE / 2 - displayH / 2 + offset.y,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />

            {/* Dark vignette with circular transparent cutout */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle ${CIRCLE_SIZE / 2}px at 50% 50%, transparent ${CIRCLE_SIZE / 2 - 1}px, rgba(0,0,0,0.68) ${CIRCLE_SIZE / 2}px)`,
              }}
            />

            {/* Circle border */}
            <div
              className="absolute pointer-events-none"
              style={{
                borderRadius: '50%',
                width:  CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                left:   (PREVIEW_SIZE - CIRCLE_SIZE) / 2,
                top:    (PREVIEW_SIZE - CIRCLE_SIZE) / 2,
                border: '3px solid var(--accent)',
                boxShadow: '0 0 0 2px var(--foreground)',
              }}
            />

            {/* Drag hint */}
            {showHint && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-pulse">
                <div className="bg-foreground/70 px-3 py-1.5 flex items-center gap-1.5 border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)]">
                  <span className="text-[10px] font-black text-background uppercase">DRAG TO REPOSITION</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="px-4 py-3 border-t-2 border-foreground/30 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(1, parseFloat((z - 0.1).toFixed(2))))}
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
                style={{ width: `${((zoom - 1) / 2) * 100}%` }}
              />
              <input
                type="range" min={100} max={300} step={5}
                value={zoom * 100}
                onChange={e => setZoom(Number(e.target.value) / 100)}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute w-5 h-5 bg-foreground border-2 border-background shadow-[2px_2px_0px_0px_var(--foreground)] pointer-events-none -translate-x-1/2"
                style={{ left: `${((zoom - 1) / 2) * 100}%` }}
              />
            </div>
            <ZoomIn size={12} strokeWidth={2.5} className="text-foreground/40 shrink-0" />
          </div>

          <button
            type="button"
            onClick={() => setZoom(z => Math.min(3, parseFloat((z + 0.1).toFixed(2))))}
            disabled={zoom >= 3}
            className={`w-8 h-8 border-2 border-foreground flex items-center justify-center transition-all ${
              zoom >= 3
                ? 'opacity-30 cursor-not-allowed'
                : 'bg-background hover:bg-foreground hover:text-background shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'
            }`}
          >
            <Plus size={14} strokeWidth={3} />
          </button>

          <span className="text-[10px] font-mono font-black text-foreground/50 w-10 text-right">
            {zoomPct}%
          </span>
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t-2 border-foreground/20 bg-foreground/5 text-center">
          <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-wider">
            Drag · Zoom · Tap ✓ to apply
          </p>
        </div>
      </div>
    </div>
  );
}
