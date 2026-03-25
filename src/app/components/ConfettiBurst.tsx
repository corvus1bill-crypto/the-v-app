import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  distance: number;
  rotate: number;
  shape: 'square' | 'circle' | 'diamond';
}

const COLORS = ['#ff7a2e', '#000000', '#ffffff', '#ef4444', '#facc15', '#34d399', '#60a5fa'];

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 0,
    y: 0,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 8 + 5,
    angle: (i / count) * 360 + Math.random() * 30 - 15,
    distance: Math.random() * 80 + 40,
    rotate: Math.random() * 360,
    shape: (['square', 'circle', 'diamond'] as const)[Math.floor(Math.random() * 3)],
  }));
}

interface ConfettiBurstProps {
  active: boolean;
  originX?: number; // % from left
  originY?: number; // % from top
  count?: number;
}

export function ConfettiBurst({ active, originX = 50, originY = 50, count = 18 }: ConfettiBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setParticles(makeParticles(count));
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 900);
      return () => clearTimeout(t);
    }
  }, [active, count]);

  const shapeClass = (shape: Particle['shape']) => {
    if (shape === 'circle') return 'rounded-full';
    if (shape === 'diamond') return 'rotate-45';
    return '';
  };

  return (
    <AnimatePresence>
      {visible && (
        <div
          className="absolute pointer-events-none z-[999]"
          style={{ left: `${originX}%`, top: `${originY}%` }}
        >
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const tx = Math.cos(rad) * p.distance;
            const ty = Math.sin(rad) * p.distance;

            return (
              <motion.div
                key={p.id}
                className={`absolute ${shapeClass(p.shape)}`}
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  left: -p.size / 2,
                  top: -p.size / 2,
                  border: p.color === '#ffffff' ? '1.5px solid #000' : undefined,
                }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{
                  x: tx,
                  y: ty,
                  opacity: 0,
                  rotate: p.rotate,
                  scale: 0.3,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── Hook ───────────────────────────────────────────── */
export function useConfetti() {
  const [burst, setBurst] = useState<{ active: boolean; x: number; y: number }>({ active: false, x: 50, y: 50 });

  const trigger = (e?: React.MouseEvent) => {
    const x = e ? (e.clientX / window.innerWidth) * 100 : 50;
    const y = e ? (e.clientY / window.innerHeight) * 100 : 50;
    setBurst({ active: true, x, y });
    setTimeout(() => setBurst(b => ({ ...b, active: false })), 50);
  };

  return { burst, trigger };
}