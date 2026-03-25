import { motion } from 'motion/react';
import { ReactNode, useState, MouseEvent, TouchEvent } from 'react';

interface TouchRippleProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  color?: string;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function TouchRipple({ children, className = '', onClick, color = '#ff7a2e' }: TouchRippleProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const createRipple = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    const newRipple = {
      id: Date.now(),
      x,
      y,
    };

    setRipples([...ripples, newRipple]);

    setTimeout(() => {
      setRipples((prevRipples) => prevRipples.filter((r) => r.id !== newRipple.id));
    }, 600);

    onClick?.();
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onClick={createRipple}
      onTouchStart={createRipple}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            backgroundColor: color,
          }}
          initial={{
            width: 0,
            height: 0,
            opacity: 0.5,
            x: '-50%',
            y: '-50%',
          }}
          animate={{
            width: 500,
            height: 500,
            opacity: 0,
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
