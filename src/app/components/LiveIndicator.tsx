import { motion } from 'motion/react';

interface LiveIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
}

export function LiveIndicator({ size = 'md', color = '#ff7a2e', label }: LiveIndicatorProps) {
  const sizeConfig = {
    sm: { dot: 6, ring: 12, text: 'text-xs' },
    md: { dot: 8, ring: 16, text: 'text-sm' },
    lg: { dot: 10, ring: 20, text: 'text-base' },
  };

  const config = sizeConfig[size];

  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative" style={{ width: config.ring, height: config.ring }}>
        {/* Pulsating rings */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color, opacity: 0.3 }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color, opacity: 0.3 }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        
        {/* Center dot */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: config.dot,
            height: config.dot,
            backgroundColor: color,
          }}
        />
      </div>
      
      {label && (
        <motion.span
          className={`font-bold ${config.text}`}
          animate={{
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
}
