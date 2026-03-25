import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface GlitchTextProps {
  children: ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export function GlitchText({ children, className = '', intensity = 'low' }: GlitchTextProps) {
  const intensityConfig = {
    low: { distance: 2, duration: 0.1, repeatDelay: 8 },
    medium: { distance: 4, duration: 0.15, repeatDelay: 5 },
    high: { distance: 6, duration: 0.2, repeatDelay: 3 },
  };

  const config = intensityConfig[intensity];

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Main text */}
      <motion.span
        className="relative z-10"
        animate={{
          x: [0, -config.distance, config.distance, 0],
          y: [0, config.distance, -config.distance, 0],
        }}
        transition={{
          duration: config.duration,
          repeat: Infinity,
          repeatDelay: config.repeatDelay,
        }}
      >
        {children}
      </motion.span>
      
      {/* Red glitch layer */}
      <motion.span
        className="absolute top-0 left-0 text-red-500 opacity-70 mix-blend-multiply"
        style={{ clipPath: 'inset(0 0 80% 0)' }}
        animate={{
          x: [-config.distance, config.distance, -config.distance, 0],
        }}
        transition={{
          duration: config.duration,
          repeat: Infinity,
          repeatDelay: config.repeatDelay,
        }}
      >
        {children}
      </motion.span>
      
      {/* Blue glitch layer */}
      <motion.span
        className="absolute top-0 left-0 text-blue-500 opacity-70 mix-blend-multiply"
        style={{ clipPath: 'inset(80% 0 0 0)' }}
        animate={{
          x: [config.distance, -config.distance, config.distance, 0],
        }}
        transition={{
          duration: config.duration,
          repeat: Infinity,
          repeatDelay: config.repeatDelay,
        }}
      >
        {children}
      </motion.span>
    </div>
  );
}
