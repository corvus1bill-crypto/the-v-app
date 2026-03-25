import { useEffect, useRef, useCallback, memo, useState } from 'react';

/**
 * VHS Night Vision Filter Overlay
 * ────────────────────────────────
 * Replicates a 1990s analog camcorder in low-light / night-mode conditions.
 *
 * Layers (bottom → top):
 *  1. Chromatic aberration — R/B channel offset via blended duplicates
 *  2. CSS filter on <video> — green tint, lifted blacks, soft glow
 *  3. Canvas noise/grain — animated static
 *  4. Scan lines — horizontal CSS repeating-gradient
 *  5. Flicker — CSS opacity animation on a tinted overlay
 *  6. Vignette — radial gradient darkening corners
 *  7. VHS HUD — REC indicator, timestamp, tracking bar
 *
 * All children are rendered inside the container — typically a single <video>.
 */

// ─── VHS Filter ID constant ────────────────────────────────────────────────
export const VHS_NIGHT_VISION_ID = 'vhs-night-vision';

export function isVHSFilter(filterId?: string): boolean {
  return filterId === VHS_NIGHT_VISION_ID;
}

// ─── Grain canvas ───────────────────────────────────────────────────────────
const GrainCanvas = memo(function GrainCanvas({ intensity = 0.12 }: { intensity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const lastFrameRef = useRef(0);

  const draw = useCallback((time: number) => {
    // Throttle to ~18 fps for authentic VHS choppiness
    if (time - lastFrameRef.current < 55) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }
    lastFrameRef.current = time;

    const canvas = canvasRef.current;
    if (!canvas) { animRef.current = requestAnimationFrame(draw); return; }

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) { animRef.current = requestAnimationFrame(draw); return; }

    // Use a small resolution canvas and let CSS scale it up (intentional pixelation = VHS feel)
    const w = 128;
    const h = 96;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    // Noise with slight green bias
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 255;
      data[i]     = noise * 0.7;          // R — slightly dimmed
      data[i + 1] = noise;                // G — full brightness
      data[i + 2] = noise * 0.8;          // B — slightly dimmed
      data[i + 3] = Math.random() * 255 * intensity; // A — sparse
    }

    // Occasional horizontal glitch line
    if (Math.random() < 0.08) {
      const y = Math.floor(Math.random() * h);
      const lineWidth = 1 + Math.floor(Math.random() * 3);
      for (let row = y; row < Math.min(y + lineWidth, h); row++) {
        const offset = Math.floor(Math.random() * 6) - 3; // horizontal shift
        for (let x = 0; x < w; x++) {
          const srcX = Math.min(Math.max(x + offset, 0), w - 1);
          const idx = (row * w + x) * 4;
          const srcIdx = (row * w + srcX) * 4;
          data[idx]     = data[srcIdx]     || 0;
          data[idx + 1] = data[srcIdx + 1] || 0;
          data[idx + 2] = data[srcIdx + 2] || 0;
          data[idx + 3] = 100 + Math.random() * 80;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    animRef.current = requestAnimationFrame(draw);
  }, [intensity]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
      style={{
        mixBlendMode: 'overlay',
        opacity: 0.55,
        imageRendering: 'pixelated',
      }}
    />
  );
});

// ─── VHS Timestamp HUD ─────────────────────────────────────────────────────
function VHSTimestamp() {
  const [time, setTime] = useState(() => new Date());
  const [showRec, setShowRec] = useState(true);

  useEffect(() => {
    const t1 = setInterval(() => setTime(new Date()), 1000);
    const t2 = setInterval(() => setShowRec(v => !v), 800);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="absolute top-0 left-0 right-0 z-[8] pointer-events-none p-3 flex items-start justify-between"
      style={{ fontFamily: "'Courier New', 'Courier', monospace" }}>
      {/* REC indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full transition-opacity duration-150 ${showRec ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundColor: '#ff2020', boxShadow: '0 0 6px 2px rgba(255,32,32,0.6)' }} />
        <span className="text-[11px] font-bold tracking-widest"
          style={{ color: '#e0e0e0', textShadow: '0 0 4px rgba(0,255,100,0.5)' }}>
          REC
        </span>
      </div>

      {/* Timestamp */}
      <div className="text-right">
        <div className="text-[10px] font-bold tracking-wider"
          style={{ color: '#c0ffc0', textShadow: '0 0 4px rgba(0,255,100,0.4)' }}>
          {pad(time.getMonth() + 1)}/{pad(time.getDate())}/{String(time.getFullYear()).slice(-2)}
        </div>
        <div className="text-[11px] font-bold tracking-widest"
          style={{ color: '#e0ffe0', textShadow: '0 0 6px rgba(0,255,100,0.5)' }}>
          {pad(time.getHours())}:{pad(time.getMinutes())}:{pad(time.getSeconds())}
        </div>
      </div>
    </div>
  );
}

// ─── Tracking bar distortion ────────────────────────────────────────────────
function TrackingBar() {
  const [pos, setPos] = useState(-10);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const trigger = () => {
      if (Math.random() < 0.3) {
        setVisible(true);
        setPos(Math.random() * 80 + 5);
        setTimeout(() => setVisible(false), 150 + Math.random() * 300);
      }
    };
    const interval = setInterval(trigger, 2000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="absolute left-0 right-0 z-[7] pointer-events-none"
      style={{
        top: `${pos}%`,
        height: `${2 + Math.random() * 4}px`,
        background: `linear-gradient(90deg, 
          transparent 0%, 
          rgba(0,255,100,0.15) 10%, 
          rgba(255,255,255,0.12) 30%, 
          rgba(0,255,100,0.2) 50%, 
          rgba(255,255,255,0.08) 70%, 
          rgba(0,255,100,0.15) 90%, 
          transparent 100%)`,
        boxShadow: '0 0 12px 2px rgba(0,255,100,0.1)',
      }}
    />
  );
}

// ─── Main Overlay Component ─────────────────────────────────────────────────

interface VHSNightVisionOverlayProps {
  children: React.ReactNode;
  /** Show the full HUD (REC, timestamp). Default true */
  showHUD?: boolean;
  /** Overall intensity 0-100. Default 100 */
  intensity?: number;
  /** Extra className for the wrapper */
  className?: string;
  /** Extra style for the wrapper */
  style?: React.CSSProperties;
}

export const VHSNightVisionOverlay = memo(function VHSNightVisionOverlay({
  children,
  showHUD = true,
  intensity = 100,
  className = '',
  style,
}: VHSNightVisionOverlayProps) {
  const intensityScale = intensity / 100;

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {/* ── Layer 0: Chromatic aberration — duplicate content with color channel offsets ── */}
      {/* We achieve this by putting CSS filter on the content container */}

      {/* ── Layer 1: The actual video/content with green color grading ── */}
      <div
        className="relative w-full h-full"
        style={{
          filter: [
            // Green/teal color cast — hue-rotate toward green, boost saturation
            `hue-rotate(${85 * intensityScale}deg)`,
            // Reduce contrast, lift blacks (faded shadows)
            `contrast(${1 - 0.2 * intensityScale})`,
            // Slight brightness boost (overexposed highlights)
            `brightness(${1 + 0.15 * intensityScale})`,
            // Desaturate slightly for washed look
            `saturate(${1 - 0.15 * intensityScale})`,
            // Soft blur (loss of sharpness)
            `blur(${0.4 * intensityScale}px)`,
            // Slight sepia for warmth in the green channel
            `sepia(${0.08 * intensityScale})`,
          ].join(' '),
        }}
      >
        {children}
      </div>

      {/* ── Layer 2: Chromatic aberration — thin colored edge overlays ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: `linear-gradient(90deg, 
            rgba(255,0,0,${0.04 * intensityScale}) 0%, 
            transparent 3%, 
            transparent 97%, 
            rgba(0,100,255,${0.05 * intensityScale}) 100%)`,
          mixBlendMode: 'screen',
        }}
      />

      {/* ── Layer 3: Green tint overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[4]"
        style={{
          background: `radial-gradient(ellipse at center,
            rgba(0,255,80,${0.06 * intensityScale}) 0%,
            rgba(0,200,60,${0.1 * intensityScale}) 50%,
            rgba(0,150,40,${0.15 * intensityScale}) 100%)`,
          mixBlendMode: 'color',
        }}
      />

      {/* ── Layer 4: Animated grain noise ── */}
      <GrainCanvas intensity={0.12 * intensityScale} />

      {/* ── Layer 5: Scan lines ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[6]"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 2px,
            rgba(0,0,0,${0.12 * intensityScale}) 2px,
            rgba(0,0,0,${0.12 * intensityScale}) 4px
          )`,
          opacity: 0.7 * intensityScale,
        }}
      />

      {/* ── Layer 6: Flicker overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[6]"
        style={{
          background: `rgba(0,255,80,${0.03 * intensityScale})`,
          animation: 'vhsFlicker 0.15s infinite alternate',
          opacity: intensityScale,
        }}
      />

      {/* ── Layer 7: Vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[7]"
        style={{
          background: `radial-gradient(ellipse at center,
            transparent 40%,
            rgba(0,0,0,${0.3 * intensityScale}) 75%,
            rgba(0,0,0,${0.6 * intensityScale}) 100%)`,
        }}
      />

      {/* ── Layer 8: Tracking bar distortion ── */}
      <TrackingBar />

      {/* ── Layer 9: VHS HUD ── */}
      {showHUD && <VHSTimestamp />}

      {/* ── Layer 10: Bottom VHS status bar ── */}
      {showHUD && (
        <div className="absolute bottom-0 left-0 right-0 z-[8] pointer-events-none p-3 flex items-end justify-between"
          style={{ fontFamily: "'Courier New', 'Courier', monospace" }}>
          <div className="text-[9px] font-bold tracking-widest"
            style={{ color: '#a0ffa0', textShadow: '0 0 4px rgba(0,255,100,0.4)', opacity: 0.7 }}>
            SP ▸ PLAY
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-[2px]">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-[3px] bg-green-400/60"
                  style={{ height: `${4 + Math.random() * 8}px` }} />
              ))}
            </div>
            <span className="text-[9px] font-bold tracking-wider"
              style={{ color: '#a0ffa0', textShadow: '0 0 4px rgba(0,255,100,0.4)', opacity: 0.7 }}>
              NIGHT
            </span>
          </div>
        </div>
      )}

      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes vhsFlicker {
          0%   { opacity: ${0.02 * intensityScale}; }
          20%  { opacity: ${0.05 * intensityScale}; }
          40%  { opacity: ${0.01 * intensityScale}; }
          60%  { opacity: ${0.06 * intensityScale}; }
          80%  { opacity: ${0.03 * intensityScale}; }
          100% { opacity: ${0.04 * intensityScale}; }
        }
      `}</style>
    </div>
  );
});

// ─── Compact preview for filter picker ──────────────────────────────────────
export function VHSFilterPreviewBadge({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex flex-col items-center gap-1.5 transition-all ${
        selected ? 'scale-105' : 'hover:scale-102'
      }`}
    >
      <div className={`relative w-[68px] h-[68px] overflow-hidden transition-all ${
        selected
          ? 'border-4 border-foreground shadow-[3px_3px_0px_0px_var(--foreground)]'
          : 'border-2 border-foreground/40'
      }`}>
        {/* Mini VHS preview */}
        <div className="w-full h-full relative"
          style={{
            background: 'linear-gradient(135deg, #0a1a0a 0%, #0d2a10 40%, #102010 70%, #061206 100%)',
          }}>
          {/* Mini scan lines */}
          <div className="absolute inset-0"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,255,100,0.08) 1px, rgba(0,255,100,0.08) 2px)',
            }} />
          {/* Mini noise dots */}
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, rgba(0,255,100,0.3) 1px, transparent 1px)`,
            backgroundSize: '4px 4px',
            opacity: 0.5,
          }} />
          {/* Mini REC dot */}
          <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-red-500"
            style={{ boxShadow: '0 0 3px rgba(255,0,0,0.6)', animation: 'vhsRecBlink 0.8s infinite alternate' }} />
          {/* Mini vignette */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)' }} />
        </div>
        {selected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-6 h-6 bg-foreground text-background flex items-center justify-center border-2 border-background"
              style={{ animation: 'badgePop 0.3s ease both' }}>
              <span className="text-xs font-black">&#10003;</span>
            </div>
          </div>
        )}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-wide leading-none ${
        selected ? 'text-foreground' : 'text-foreground/50'
      }`}>
        VHS Night
      </span>
      <style>{`
        @keyframes vhsRecBlink {
          0% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </button>
  );
}
