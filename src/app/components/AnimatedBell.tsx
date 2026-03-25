import { motion, AnimatePresence } from 'motion/react';
import { Bell } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface AnimatedBellProps {
  count: number;
  onClick: () => void;
  hasNewActivity?: boolean;
}

export function AnimatedBell({ count, onClick, hasNewActivity }: AnimatedBellProps) {
  const prevCountRef = useRef(count);
  const isNew = hasNewActivity || count > prevCountRef.current;

  useEffect(() => {
    prevCountRef.current = count;
  }, [count]);

  return (
    <motion.button
      onClick={onClick}
      className="relative w-10 h-10 bg-background border-2 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_var(--color-foreground)] rounded-md"
      whileTap={{ scale: 0.9, x: 2, y: 2, boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)' }}
      animate={
        isNew
          ? {
              rotate: [0, -18, 16, -12, 10, -6, 0],
              transition: { duration: 0.7, ease: 'easeInOut' },
            }
          : {}
      }
    >
      <Bell className="text-foreground" size={20} strokeWidth={3} />

      {/* Badge */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            key={count}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-red-500 border-2 border-foreground flex items-center justify-center text-[10px] font-black text-white rounded-full"
          >
            {count > 99 ? '99+' : count}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple on new activity */}
      {isNew && (
        <motion.div
          className="absolute inset-0 rounded-md border-2 border-red-500 dark:border-primary"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
    </motion.button>
  );
}