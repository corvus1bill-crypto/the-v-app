import { useState, useEffect, memo } from 'react';
import { getFilterOverlay, getCameraEraOverlay, getCameraEraFilter, getCameraEraGrain, getCameraEraLightLeak } from './PhotoFilterPicker';

interface PostFeedImageProps {
  thumbnailSrc?: string;
  masterSrc: string;
  alt: string;
  onClick?: (e: React.MouseEvent) => void;
  swipeStyle?: React.CSSProperties;
  filterStyle?: string;
  filterId?: string;
  cameraEra?: string;
}

/**
 * Progressive image loader for the post feed.
 * Shows blurred thumbnail first, then cross-fades in the full master image.
 * All opacity transitions run on the GPU compositor (will-change: opacity).
 * Memoized to prevent unnecessary re-renders.
 */
export const PostFeedImage = memo(function PostFeedImage({
  thumbnailSrc,
  masterSrc,
  alt,
  onClick,
  swipeStyle,
  filterStyle,
  filterId,
  cameraEra,
}: PostFeedImageProps) {
  const [masterLoaded, setMasterLoaded]     = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  // Reset on src change
  useEffect(() => {
    setMasterLoaded(false);
    setThumbnailLoaded(false);
  }, [masterSrc]);

  const combinedFilter = [
    filterStyle,
    getCameraEraFilter(cameraEra),
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* ── Shimmer placeholder ──────────────────────────────────── */}
      {!masterLoaded && !thumbnailLoaded && (
        <div
          className="absolute inset-0 z-0 overflow-hidden"
          style={{ background: 'var(--card)' }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,122,46,0.08) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* ── Blurred thumbnail — cheap LQIP while master loads ────── */}
      {thumbnailSrc && !masterLoaded && (
        <img
          src={thumbnailSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover z-[1]"
          style={{
            filter: 'blur(12px)',
            transform: 'scale(1.06)', // hide blur edge artifact
            opacity: thumbnailLoaded ? 1 : 0,
            transition: 'opacity 0.18s ease-out',
            willChange: 'opacity',
            backfaceVisibility: 'hidden',
          }}
          onLoad={() => setThumbnailLoaded(true)}
          draggable={false}
          decoding="async"
        />
      )}

      {/* ── Master image ─────────────────────────────────────────── */}
      <img
        src={masterSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        fetchPriority={thumbnailSrc ? 'low' : 'high'}
        className="w-full h-full object-cover cursor-pointer z-[2] relative"
        style={{
          ...swipeStyle,
          opacity: masterLoaded ? 1 : 0,
          transition: 'opacity 0.25s ease-out',
          willChange: 'opacity, transform',
          backfaceVisibility: 'hidden',
          ...(combinedFilter ? { filter: combinedFilter } : {}),
        }}
        onClick={onClick}
        onLoad={() => setMasterLoaded(true)}
        draggable={false}
      />

      {/* ── Filter colour overlay (blend mode layer) ─────────────── */}
      {filterId && masterLoaded && (() => {
        const overlay = getFilterOverlay(filterId);
        if (!overlay) return null;
        return (
          <div
            className="absolute inset-0 pointer-events-none z-[3]"
            style={{ background: overlay.gradient, mixBlendMode: overlay.blend as any }}
          />
        );
      })()}

      {/* ── Camera-era vignette overlay ──────────────────────────── */}
      {cameraEra && masterLoaded && (() => {
        const eraOverlay = getCameraEraOverlay(cameraEra);
        if (!eraOverlay) return null;
        return (
          <div
            className="absolute inset-0 pointer-events-none z-[4]"
            style={{ background: eraOverlay.gradient, mixBlendMode: eraOverlay.blend as any }}
          />
        );
      })()}

      {/* ── Camera-era sensor grain overlay ─────────────────────── */}
      {cameraEra && masterLoaded && (() => {
        const grain = getCameraEraGrain(cameraEra);
        if (!grain) return null;
        return (
          <div
            className="absolute inset-0 pointer-events-none z-[5]"
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

      {/* ── Camera-era light leak overlay ────────────────────────── */}
      {cameraEra && masterLoaded && (() => {
        const lightLeak = getCameraEraLightLeak(cameraEra);
        if (!lightLeak) return null;
        return (
          <div
            className="absolute inset-0 pointer-events-none z-[6]"
            style={{
              background: lightLeak.gradient,
              mixBlendMode: lightLeak.blend as any,
              animation: 'lightLeakPulse 4s ease-in-out infinite',
            }}
          />
        );
      })()}
    </>
  );
});
