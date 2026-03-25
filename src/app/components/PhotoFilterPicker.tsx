import { useState } from 'react';
import { X, Sparkles, Camera } from 'lucide-react';

// ─── Filter Definitions ─────────────────────────────────────────────────────
export interface PhotoFilter {
  id: string;
  name: string;
  emoji: string;
  filter: string;
  /** Optional gradient overlay rendered with mix-blend-mode for richer color grading */
  overlay?: string;
  overlayBlend?: string;
  /** Accent color for selected state */
  accent: string;
}

export const PHOTO_FILTERS: PhotoFilter[] = [
  {
    id: 'none',
    name: 'Original',
    emoji: '✨',
    filter: 'none',
    accent: 'var(--foreground)',
  },
  {
    // Golden hour warmth — rich amber tones, sun-kissed glow
    id: 'rio',
    name: 'Rio',
    emoji: '🌴',
    filter: 'brightness(1.08) contrast(1.12) saturate(1.45) hue-rotate(-5deg)',
    overlay: 'linear-gradient(160deg, rgba(255,160,40,0.32) 0%, rgba(255,90,20,0.26) 40%, rgba(255,180,80,0.22) 100%)',
    overlayBlend: 'soft-light',
    accent: '#FF8C00',
  },
  {
    // Cold moonlit atmosphere — desaturated blue/silver, crushed blacks
    id: 'moonlight',
    name: 'Moonlight',
    emoji: '🌙',
    filter: 'brightness(0.92) contrast(1.18) saturate(0.55) hue-rotate(15deg)',
    overlay: 'linear-gradient(180deg, rgba(80,120,220,0.38) 0%, rgba(40,60,160,0.30) 50%, rgba(100,130,240,0.25) 100%)',
    overlayBlend: 'color',
    accent: '#6B8DD6',
  },
  {
    // Analog film stock — faded blacks, warm mid-tones, green-shifted shadows
    id: 'film',
    name: 'Film',
    emoji: '🎞️',
    filter: 'contrast(1.14) brightness(1.05) saturate(0.75) sepia(0.22)',
    overlay: 'linear-gradient(180deg, rgba(220,190,140,0.28) 0%, rgba(60,90,60,0.16) 60%, rgba(180,150,100,0.22) 100%)',
    overlayBlend: 'soft-light',
    accent: '#C4956A',
  },
  {
    // Neon nightlife — teal shadows, magenta highlights, high contrast
    id: 'electric',
    name: 'Electric',
    emoji: '🎆',
    filter: 'brightness(0.95) contrast(1.25) saturate(1.45) hue-rotate(-10deg)',
    overlay: 'linear-gradient(0deg, rgba(200,40,220,0.35) 0%, rgba(0,180,200,0.30) 45%, rgba(20,60,160,0.25) 100%)',
    overlayBlend: 'color',
    accent: '#00BCD4',
  },
  {
    // Hyper-vivid — cranked saturation, punchy contrast
    id: 'pop',
    name: 'Pop',
    emoji: '⚡',
    filter: 'contrast(1.28) saturate(1.6) brightness(1.06)',
    overlay: 'linear-gradient(135deg, rgba(255,50,90,0.18) 0%, rgba(140,50,255,0.16) 50%, rgba(50,200,255,0.14) 100%)',
    overlayBlend: 'soft-light',
    accent: '#E040FB',
  },
  {
    // Faded analog — muted greens, washed out, lo-fi
    id: 'retro-vhs',
    name: 'Retro',
    emoji: '📼',
    filter: 'sepia(0.28) contrast(0.84) brightness(1.12) saturate(0.65) hue-rotate(-18deg)',
    overlay: 'linear-gradient(0deg, rgba(0,180,90,0.26) 0%, rgba(40,110,70,0.20) 50%, rgba(0,160,80,0.18) 100%)',
    overlayBlend: 'color',
    accent: '#4CAF50',
  },
  {
    // Matte fade — lifted blacks, low contrast, dreamy matte look
    id: 'fade',
    name: 'Fade',
    emoji: '🌫️',
    filter: 'contrast(0.72) brightness(1.18) saturate(0.65) sepia(0.10)',
    overlay: 'linear-gradient(180deg, rgba(200,190,180,0.24) 0%, rgba(180,170,160,0.18) 50%, rgba(160,150,140,0.20) 100%)',
    overlayBlend: 'soft-light',
    accent: '#A1887F',
  },
];

export function getFilterById(id: string): PhotoFilter {
  return PHOTO_FILTERS.find(f => f.id === id) || PHOTO_FILTERS[0];
}

export function getFilterStyle(filterId?: string, _intensity?: number): string {
  if (!filterId || filterId === 'none') return 'none';
  const filter = getFilterById(filterId);
  if (filter.filter === 'none') return 'none';
  return filter.filter;
}

/** Returns overlay CSS for rendering on top of the filtered image */
export function getFilterOverlay(filterId?: string): { gradient: string; blend: string } | null {
  if (!filterId || filterId === 'none') return null;
  const filter = getFilterById(filterId);
  if (!filter.overlay) return null;
  return { gradient: filter.overlay, blend: filter.overlayBlend || 'overlay' };
}

// ─── Camera Era Definitions ─────────────────────────────────────────────────
export interface CameraEra {
  id: string;
  year: string;
  label: string;
  description: string;
  /** CSS filter for era-specific color science & sensor characteristics */
  filter: string;
  /** Vignette / lens overlay for that era's optics */
  overlay?: string;
  overlayBlend?: string;
  /** Sensor grain intensity (0–1). 0 = no grain. */
  grain?: number;
  accent: string;
}

/** SVG noise texture used for sensor grain simulation — finer frequency for realism */
const GRAIN_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E`;

export const CAMERA_ERAS: CameraEra[] = [
  {
    id: 'modern',
    year: '2020s',
    label: 'Modern',
    description: 'Computational photography, HDR, crisp detail',
    filter: 'none',
    accent: '#4FC3F7',
  },
  {
    // Early smartphone — warm white balance, lower dynamic range,
    // that distinctive "Instagram era" look with soft shadows and warmth
    id: '2010s',
    year: '2010s',
    label: 'Smartphone',
    description: 'Early smartphone cameras, warm tones, soft shadows',
    filter: 'contrast(0.82) brightness(1.1) saturate(0.78) sepia(0.14) hue-rotate(-4deg)',
    overlay: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.38) 100%)',
    overlayBlend: 'multiply',
    grain: 0.06,
    accent: '#FFB74D',
  },
  {
    // Compact digital / early camera phones — harsh flash look, washed out,
    // narrow dynamic range, heavy vignette, chunky sensor noise
    id: '2000s',
    year: '2000s',
    label: 'Digicam',
    description: 'Digital point-and-shoot, harsh flash, heavy sensor noise',
    filter: 'contrast(0.75) brightness(1.16) saturate(0.68) sepia(0.18) hue-rotate(-8deg)',
    overlay: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.55) 100%)',
    overlayBlend: 'multiply',
    grain: 0.22,
    accent: '#FF8A65',
  },
];

export function getCameraEraById(id: string): CameraEra {
  return CAMERA_ERAS.find(e => e.id === id) || CAMERA_ERAS[0];
}

/** Returns CSS filter string for a camera era (to be combined with photo filter) */
export function getCameraEraFilter(eraId?: string): string | null {
  if (!eraId || eraId === 'modern') return null;
  const era = getCameraEraById(eraId);
  if (era.filter === 'none') return null;
  return era.filter;
}

/** Returns vignette/lens overlay for the era */
export function getCameraEraOverlay(eraId?: string): { gradient: string; blend: string } | null {
  if (!eraId || eraId === 'modern') return null;
  const era = getCameraEraById(eraId);
  if (!era.overlay) return null;
  return { gradient: era.overlay, blend: era.overlayBlend || 'multiply' };
}

/** Returns grain/noise overlay info for sensor noise simulation */
export function getCameraEraGrain(eraId?: string): { backgroundImage: string; opacity: number } | null {
  if (!eraId || eraId === 'modern') return null;
  const era = getCameraEraById(eraId);
  if (!era.grain || era.grain <= 0) return null;
  const svg = GRAIN_SVG;
  return { backgroundImage: `url("${svg}")`, opacity: era.grain };
}

/** Combines photo filter + camera era into a single CSS filter string */
export function getCombinedFilterStyle(filterId?: string, eraId?: string): string {
  const photoFilter = getFilterStyle(filterId);
  const eraFilter = getCameraEraFilter(eraId);
  if (photoFilter === 'none' && !eraFilter) return 'none';
  const parts: string[] = [];
  if (photoFilter !== 'none') parts.push(photoFilter);
  if (eraFilter) parts.push(eraFilter);
  return parts.join(' ') || 'none';
}

/** Returns light leak overlay for the 1990s film era */
export function getCameraEraLightLeak(eraId?: string): { gradient: string; blend: string } | null {
  if (eraId !== '1990s') return null;
  return {
    gradient: 'linear-gradient(125deg, rgba(255,120,20,0.45) 0%, rgba(255,80,40,0.25) 15%, transparent 40%, transparent 70%, rgba(255,160,60,0.15) 90%, rgba(255,100,30,0.30) 100%)',
    blend: 'screen',
  };
}

// ─── Filter Picker Component ────────────────────────────────────────────────

interface PhotoFilterPickerProps {
  selectedFilter: string;
  onSelectFilter: (filterId: string) => void;
  previewImage?: string;
  previewVideo?: string;
  onClose?: () => void;
  intensity?: number;
  onIntensityChange?: (intensity: number) => void;
  cameraEra?: string;
  onCameraEraChange?: (eraId: string) => void;
}

export function PhotoFilterPicker({
  selectedFilter,
  onSelectFilter,
  previewImage,
  previewVideo,
  onClose,
  intensity = 100,
  onIntensityChange,
  cameraEra = 'modern',
  onCameraEraChange,
}: PhotoFilterPickerProps) {
  const [compareMode, setCompareMode] = useState(false);
  const currentEra = getCameraEraById(cameraEra);
  const eraActive = cameraEra !== 'modern';

  return (
    <div className="bg-background border-t-4 border-foreground" style={{ animation: 'fadeSlideUp 0.25s ease both' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-foreground/10">
        <div className="flex items-center gap-2">
          <Sparkles size={16} strokeWidth={3} className="text-foreground" />
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Filter</h3>
          {selectedFilter !== 'none' && (
            <span
              className="ml-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border-2"
              style={{
                borderColor: getFilterById(selectedFilter).accent,
                color: getFilterById(selectedFilter).accent,
              }}
            >
              {getFilterById(selectedFilter).name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Compare toggle */}
          {selectedFilter !== 'none' && previewImage && (
            <button
              onMouseDown={() => setCompareMode(true)}
              onMouseUp={() => setCompareMode(false)}
              onMouseLeave={() => setCompareMode(false)}
              onTouchStart={() => setCompareMode(true)}
              onTouchEnd={() => setCompareMode(false)}
              className="px-2.5 py-1 text-[10px] font-black uppercase border-2 border-foreground/30 text-foreground/60 hover:border-foreground hover:text-foreground transition-all select-none"
            >
              Hold to compare
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 bg-foreground text-background flex items-center justify-center border-2 border-foreground hover:bg-card hover:text-foreground transition-colors"
            >
              <X size={16} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* Large Preview */}
      {(previewImage || previewVideo) && (
        <div className="px-4 pt-3 pb-2">
          <div className="relative w-full aspect-[4/5] border-4 border-foreground overflow-hidden shadow-[4px_4px_0px_0px_var(--foreground)] bg-black">
            {previewVideo ? (
              <video
                src={previewVideo}
                className="w-full h-full object-cover transition-all duration-500"
                style={{
                  filter: compareMode ? 'none' : getCombinedFilterStyle(selectedFilter, cameraEra),
                }}
                muted
                playsInline
                autoPlay
                loop
                preload="metadata"
              />
            ) : (
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-cover transition-all duration-500"
                style={{
                  filter: compareMode ? 'none' : getCombinedFilterStyle(selectedFilter, cameraEra),
                }}
              />
            )}
            {/* Gradient overlay for color grading */}
            {!compareMode && selectedFilter !== 'none' && getFilterOverlay(selectedFilter) && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                style={{
                  background: getFilterOverlay(selectedFilter)!.gradient,
                  mixBlendMode: getFilterOverlay(selectedFilter)!.blend as any,
                }}
              />
            )}
            {/* Vignette/lens overlay for camera era */}
            {!compareMode && eraActive && getCameraEraOverlay(cameraEra) && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                style={{
                  background: getCameraEraOverlay(cameraEra)!.gradient,
                  mixBlendMode: getCameraEraOverlay(cameraEra)!.blend as any,
                }}
              />
            )}
            {/* Sensor grain noise overlay */}
            {!compareMode && eraActive && getCameraEraGrain(cameraEra) && (() => {
              const grain = getCameraEraGrain(cameraEra)!;
              return (
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-500"
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
            {/* Light leak overlay for 1990s film era */}
            {!compareMode && eraActive && getCameraEraLightLeak(cameraEra) && (() => {
              const lightLeak = getCameraEraLightLeak(cameraEra)!;
              return (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: lightLeak.gradient,
                    mixBlendMode: lightLeak.blend as any,
                    animation: 'lightLeakPulse 4s ease-in-out infinite',
                  }}
                />
              );
            })()}
            {/* Filter name badge */}
            {selectedFilter !== 'none' && !compareMode && (
              <div
                className="absolute bottom-3 left-3 px-3 py-1.5 backdrop-blur-md border-2"
                style={{
                  background: `${getFilterById(selectedFilter).accent}22`,
                  borderColor: `${getFilterById(selectedFilter).accent}66`,
                }}
              >
                <span className="text-white text-xs font-black uppercase tracking-wider drop-shadow-lg">
                  {getFilterById(selectedFilter).emoji} {getFilterById(selectedFilter).name}
                </span>
              </div>
            )}
            {compareMode && (
              <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 backdrop-blur-md border-2 border-white/30">
                <span className="text-white text-xs font-black uppercase tracking-wider">
                  ✨ Original
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Intensity Slider */}
      {selectedFilter !== 'none' && onIntensityChange && (
        <div className="px-4 py-2 flex items-center gap-3">
          <span className="text-[10px] font-black text-foreground/50 uppercase w-16">Intensity</span>
          <input
            type="range"
            min={0}
            max={100}
            value={intensity}
            onChange={(e) => onIntensityChange(Number(e.target.value))}
            className="flex-1 h-2 appearance-none bg-foreground/15 outline-none cursor-pointer rounded-none"
            style={{ accentColor: getFilterById(selectedFilter).accent }}
          />
          <span className="text-[10px] font-mono font-bold text-foreground w-8 text-right">{intensity}%</span>
        </div>
      )}

      {/* Filter Thumbnails — simple horizontal strip */}
      <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide pb-5">
        {PHOTO_FILTERS.map((filter, i) => {
          const isSelected = selectedFilter === filter.id;
          const overlay = filter.overlay
            ? { gradient: filter.overlay, blend: filter.overlayBlend || 'overlay' }
            : null;

          return (
            <button
              key={filter.id}
              onClick={() => onSelectFilter(filter.id)}
              className="shrink-0 flex flex-col items-center gap-2 transition-all group"
              style={{ animation: `springUp 0.35s cubic-bezier(.22,.68,0,1.2) ${i * 40}ms both` }}
            >
              {/* Thumbnail with colored ring */}
              <div
                className={`relative w-[72px] h-[72px] overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? 'scale-110 shadow-lg'
                    : 'group-hover:scale-105'
                }`}
                style={{
                  border: isSelected ? `3px solid ${filter.accent}` : '2px solid var(--foreground)',
                  opacity: isSelected ? 1 : 0.75,
                  boxShadow: isSelected
                    ? `0 0 0 2px var(--background), 0 4px 12px ${filter.accent}44`
                    : 'none',
                }}
              >
                {previewImage ? (
                  <>
                    <img
                      src={previewImage}
                      alt={filter.name}
                      className="w-full h-full object-cover"
                      style={{ filter: filter.filter === 'none' ? 'none' : filter.filter }}
                      loading="lazy"
                      draggable={false}
                    />
                    {overlay && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: overlay.gradient,
                          mixBlendMode: overlay.blend as any,
                        }}
                      />
                    )}
                  </>
                ) : (
                  /* Fallback colored gradient when no image */
                  <div
                    className="w-full h-full"
                    style={{
                      background: filter.id === 'none'
                        ? 'linear-gradient(135deg, #ddd 0%, #bbb 100%)'
                        : filter.id === 'rio'
                        ? 'linear-gradient(135deg, #FFB347 0%, #FF6B35 50%, #FF4E50 100%)'
                        : filter.id === 'moonlight'
                        ? 'linear-gradient(135deg, #667eea 0%, #3b4c8c 50%, #764ba2 100%)'
                        : filter.id === 'film'
                        ? 'linear-gradient(135deg, #D4A574 0%, #B8860B 50%, #8B7355 100%)'
                        : filter.id === 'electric'
                        ? 'linear-gradient(0deg, #9C27B0 0%, #00838F 40%, #00BCD4 65%, #0D47A1 100%)'
                        : filter.id === 'pop'
                        ? 'linear-gradient(135deg, #FF6B6B 0%, #A855F7 50%, #06B6D4 100%)'
                        : filter.id === 'retro-vhs'
                        ? 'linear-gradient(135deg, #2D5016 0%, #4CAF50 50%, #1B5E20 100%)'
                        : filter.id === 'fade'
                        ? 'linear-gradient(135deg, #A1887F 0%, #E0E0E0 50%, #BDBDBD 100%)'
                        : 'linear-gradient(135deg, #888 0%, #666 100%)',
                      filter: filter.filter === 'none' ? 'none' : filter.filter,
                    }}
                  />
                )}
                {/* Selected checkmark */}
                {isSelected && filter.id !== 'none' && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: `${filter.accent}33` }}>
                    <div
                      className="w-7 h-7 flex items-center justify-center border-2 border-white font-black text-white text-sm"
                      style={{ background: filter.accent, animation: 'badgePop 0.3s ease both' }}
                    >
                      ✓
                    </div>
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-base leading-none">{filter.emoji}</span>
                <span
                  className="text-[10px] font-black uppercase tracking-wider leading-none transition-colors"
                  style={{ color: isSelected ? filter.accent : 'var(--foreground)', opacity: isSelected ? 1 : 0.45 }}
                >
                  {filter.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Camera Era Slider ────────────────────────────────────── */}
      {onCameraEraChange && (
        <div className="px-4 pb-4 pt-1 border-t-2 border-foreground/10">
          <div className="flex items-center gap-2 mb-3">
            <Camera size={14} strokeWidth={3} className="text-foreground" />
            <span className="text-[11px] font-black text-foreground uppercase tracking-wider">Camera Era</span>
            {eraActive && (
              <span
                className="ml-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border-2 transition-all"
                style={{ borderColor: currentEra.accent, color: currentEra.accent }}
              >
                {currentEra.year} {currentEra.label}
              </span>
            )}
          </div>

          {/* Era timeline buttons */}
          <div className="flex gap-2">
            {CAMERA_ERAS.map((era) => {
              const isActive = cameraEra === era.id;
              return (
                <button
                  key={era.id}
                  onClick={() => onCameraEraChange(era.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 border-2 transition-all duration-200 ${
                    isActive
                      ? 'scale-[1.03]'
                      : 'opacity-60 hover:opacity-85'
                  }`}
                  style={{
                    borderColor: isActive ? era.accent : 'var(--foreground)',
                    background: isActive ? `${era.accent}15` : 'transparent',
                    boxShadow: isActive ? `0 2px 8px ${era.accent}33` : 'none',
                  }}
                >
                  <span className="text-lg leading-none">
                    {era.id === 'modern' ? '📱' : era.id === '2010s' ? '📷' : era.id === '2000s' ? '📸' : '🎞️'}
                  </span>
                  <span
                    className="text-[11px] font-black tracking-wider leading-none transition-colors"
                    style={{ color: isActive ? era.accent : 'var(--foreground)' }}
                  >
                    {era.year}
                  </span>
                  <span
                    className="text-[8px] font-bold uppercase tracking-wider leading-none mt-0.5"
                    style={{ color: isActive ? era.accent : 'var(--foreground)', opacity: isActive ? 0.8 : 0.4 }}
                  >
                    {era.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Era description */}
          {eraActive && (
            <p className="text-[10px] text-foreground/50 font-bold mt-2 text-center italic">
              {currentEra.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}