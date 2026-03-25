import { ReactNode } from 'react';

interface PulsatingGlowProps {
  children: ReactNode;
  color?: string;
  intensity?: 'low' | 'medium' | 'high';
  enabled?: boolean;
}

export function PulsatingGlow({ 
  children, 
  color = '#ff7a2e', 
  intensity = 'medium',
  enabled = true 
}: PulsatingGlowProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  const intensityValues = {
    low: 8,
    medium: 16,
    high: 24,
  };

  const blur = intensityValues[intensity];

  return (
    <div className="relative">
      {/* CSS-only pulsating glow — avoids motion/react overhead */}
      <div
        className="absolute inset-0 rounded-lg animate-pulse"
        style={{
          background: color,
          filter: `blur(${blur}px)`,
          opacity: 0.3,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
