import { useState, useEffect, useRef } from 'react';
import { getFilterOverlay, getCameraEraOverlay, getCameraEraFilter, getCameraEraGrain, getCameraEraLightLeak } from './PhotoFilterPicker';

interface ProgressiveImageProps {
  thumbnailSrc?: string;
  masterSrc: string;
  alt: string;
  className?: string;
  filterStyle?: string;
  filterId?: string;
  cameraEra?: string;
}

/**
 * Progressive image loading component.
 * Shows a blurred thumbnail immediately, then fades in the full-resolution master.
 * If no thumbnail is provided, shows the master with a shimmer placeholder.
 */
export function ProgressiveImage({ thumbnailSrc, masterSrc, alt, className = '', filterStyle, filterId, cameraEra }: ProgressiveImageProps) {
  const [masterLoaded, setMasterLoaded] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const masterRef = useRef<HTMLImageElement>(null);

  // Check if master is already cached
  useEffect(() => {
    setMasterLoaded(false);
    setThumbnailLoaded(false);
    const img = new Image();
    img.src = masterSrc;
    if (img.complete) {
      setMasterLoaded(true);
    }
  }, [masterSrc]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Shimmer placeholder (visible until something loads) */}
      {!masterLoaded && !thumbnailLoaded && (
        <div className="absolute inset-0 bg-black/10 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,122,46,0.08) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'progressiveShimmer 1.5s ease-in-out infinite',
            }}
          />
          <style>{`
            @keyframes progressiveShimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>
      )}

      {/* Thumbnail layer — shown blurred while master loads */}
      {thumbnailSrc && !masterLoaded && (
        <img
          src={thumbnailSrc}
          alt=""
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${
            thumbnailLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ filter: 'blur(12px)', transform: 'scale(1.05)' }}
          onLoad={() => setThumbnailLoaded(true)}
          draggable={false}
        />
      )}

      {/* Master image — fades in over thumbnail */}
      <img
        ref={masterRef}
        src={masterSrc}
        alt={alt}
        className={`relative z-10 w-full h-full object-contain bg-background transition-opacity duration-500 ${
          masterLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={filterStyle ? { filter: [filterStyle, getCameraEraFilter(cameraEra)].filter(Boolean).join(' ') || filterStyle } : cameraEra && getCameraEraFilter(cameraEra) ? { filter: getCameraEraFilter(cameraEra)! } : undefined}
        onLoad={() => setMasterLoaded(true)}
        loading="lazy"
        draggable={false}
      />
      {/* Filter color overlay gradient */}
      {filterId && masterLoaded && (() => {
        const overlay = getFilterOverlay(filterId);
        if (!overlay) return null;
        return (
          <div
            className="absolute inset-0 pointer-events-none z-[11]"
            style={{ background: overlay.gradient, mixBlendMode: overlay.blend as any }}
          />
        );
      })()}
      {/* Camera era vignette overlay */}
      {cameraEra && masterLoaded && (() => {
        const eraOverlay = getCameraEraOverlay(cameraEra);
        if (!eraOverlay) return null;
        return (
          <div
            className="absolute inset-0 pointer-events-none z-[12]"
            style={{ background: eraOverlay.gradient, mixBlendMode: eraOverlay.blend as any }}
          />
        );
      })()}
      {/* Camera era sensor grain overlay */}
      {cameraEra && masterLoaded && (() => {
        const grain = getCameraEraGrain(cameraEra);
        if (!grain) return null;
        return (
          <div
            className="absolute inset-0 pointer-events-none z-[13]"
            style={{
              backgroundImage: grain.backgroundImage,
              backgroundSize: '300px 300px',
              opacity: grain.opacity,
              mixBlendMode: 'overlay',
              animation: 'grainDrift 0.8s steps(4) infinite',
            }}
          />
        );
      })()}
      {/* Camera era light leak overlay */}
      {cameraEra && masterLoaded && (() => {
        const lightLeak = getCameraEraLightLeak(cameraEra);
        if (!lightLeak) return null;
        return (
          <div
            className="absolute inset-0 pointer-events-none z-[14]"
            style={{
              background: lightLeak.gradient,
              mixBlendMode: lightLeak.blend as any,
              animation: 'lightLeakPulse 4s ease-in-out infinite',
            }}
          />
        );
      })()}
    </div>
  );
}