import { motion, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  className?: string;
  formatter?: (value: number) => string;
}

export function AnimatedCounter({ value, className = '', formatter }: AnimatedCounterProps) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) =>
    formatter ? formatter(Math.round(current)) : Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}

// Helper function to format large numbers
export function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
