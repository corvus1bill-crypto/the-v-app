import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function AnimatedButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  type = 'button'
}: AnimatedButtonProps) {
  const baseStyles = 'relative overflow-hidden font-bold transition-all duration-200';
  
  const variantStyles = {
    primary: 'bg-primary text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    secondary: 'bg-black text-primary border-4 border-primary shadow-[4px_4px_0px_0px_var(--primary)]',
    ghost: 'bg-transparent text-foreground border-4 border-foreground/20 hover:border-foreground/40',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      whileHover={!disabled ? { 
        scale: 1.02,
        boxShadow: variant === 'primary' 
          ? '6px 6px 0px 0px rgba(0,0,0,1)'
          : '6px 6px 0px 0px var(--primary)'
      } : {}}
      whileTap={!disabled ? { 
        scale: 0.98,
        boxShadow: variant === 'primary'
          ? '2px 2px 0px 0px rgba(0,0,0,1)'
          : '2px 2px 0px 0px var(--primary)'
      } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Ripple effect on tap */}
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ scale: 0, opacity: 1 }}
        whileTap={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 5,
          ease: "easeInOut",
        }}
      />
      
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
