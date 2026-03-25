import { motion } from 'motion/react';

interface ShimmerLoaderProps {
  width?: string;
  height?: string;
  className?: string;
}

export function ShimmerLoader({ width = '100%', height = '100%', className = '' }: ShimmerLoaderProps) {
  return (
    <div 
      className={`relative overflow-hidden bg-foreground/10 ${className}`}
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/20 to-transparent"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export function ShimmerCard() {
  return (
    <div className="border-4 border-black p-4 space-y-3">
      <div className="flex items-center gap-3">
        <ShimmerLoader width="48px" height="48px" className="rounded-full" />
        <div className="flex-1 space-y-2">
          <ShimmerLoader width="40%" height="16px" />
          <ShimmerLoader width="60%" height="12px" />
        </div>
      </div>
      <ShimmerLoader width="100%" height="300px" />
      <div className="space-y-2">
        <ShimmerLoader width="80%" height="12px" />
        <ShimmerLoader width="60%" height="12px" />
      </div>
    </div>
  );
}
