import { motion, AnimatePresence } from 'motion/react';
import { X, Award, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Badge {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface BadgeNotificationProps {
  badges: Badge[];
  onDismiss: (badgeId: number) => void;
  onClick?: (badge: Badge) => void;
}

export function BadgeNotification({ badges, onDismiss, onClick }: BadgeNotificationProps) {
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 pointer-events-none" style={{ width: 'min(90vw, 400px)' }}>
      <AnimatePresence>
        {badges.map((badge) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              duration: 0.3 
            }}
            className="relative pointer-events-auto"
          >
            {/* Main notification card */}
            <div 
              className="border-4 border-foreground shadow-[8px_8px_0px_0px_var(--foreground)] overflow-hidden"
              style={{ backgroundColor: 'var(--background)' }}
            >
              {/* Animated sparkles background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -top-10 -left-10 text-foreground/10"
                >
                  <Sparkles size={80} strokeWidth={1} />
                </motion.div>
                <motion.div
                  animate={{
                    rotate: [360, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -bottom-10 -right-10 text-foreground/10"
                >
                  <Sparkles size={80} strokeWidth={1} />
                </motion.div>
              </div>

              {/* Content */}
              <div
                className="relative p-3 flex items-center gap-3 cursor-pointer hover:bg-foreground/5 transition-colors group"
                onClick={(e) => {
                  // Don't trigger if close button was clicked
                  if ((e.target as HTMLElement).closest('button')) return;
                  onDismiss(badge.id);
                  onClick?.(badge);
                }}
              >
                {/* Badge icon with single entrance animation */}
                <motion.div 
                  className="relative flex-shrink-0 w-10 h-10 border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] flex items-center justify-center rounded-sm"
                  style={{ backgroundColor: 'var(--background)' }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <span className="text-xl">{badge.icon}</span>
                </motion.div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground leading-tight truncate">{badge.name}</h3>
                  <p className="text-xs font-medium text-foreground/70 mt-0.5 truncate">Achievement unlocked</p>
                </div>

                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(badge.id);
                  }}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/10 border-2 border-transparent hover:border-foreground transition-all rounded-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Dismiss"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>

              {/* Progress bar animation */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="h-1 bg-foreground"
                onAnimationComplete={() => onDismiss(badge.id)}
              />
            </div>

            {/* Extra shadow effect */}
            <div className="absolute inset-0 border-4 border-foreground pointer-events-none" style={{ transform: 'translate(4px, 4px)', zIndex: -1 }} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook to manage badge notifications
export function useBadgeNotifications() {
  const [notifications, setNotifications] = useState<Badge[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<number>>(new Set());

  // Load previously earned badges from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('earnedBadges');
    if (stored) {
      try {
        const ids = JSON.parse(stored);
        setEarnedBadgeIds(new Set(ids));
      } catch (e) {
        console.error('Failed to load earned badges:', e);
      }
    }
  }, []);

  // Save earned badges to localStorage
  const saveEarnedBadges = (badgeIds: Set<number>) => {
    localStorage.setItem('earnedBadges', JSON.stringify(Array.from(badgeIds)));
  };

  // Check for new badges and trigger notifications
  const checkForNewBadges = (currentBadges: Badge[]) => {
    const newBadges = currentBadges.filter(badge => !earnedBadgeIds.has(badge.id));
    
    if (newBadges.length > 0) {
      // Only show ONE notification at a time
      const badgesToShow = newBadges.slice(0, 1);
      setNotifications(prev => {
        // If there's already a notification showing, don't add another
        if (prev.length > 0) return prev;
        return badgesToShow;
      });
      
      // Update earned badges
      const updatedEarnedBadges = new Set(earnedBadgeIds);
      newBadges.forEach(badge => updatedEarnedBadges.add(badge.id));
      setEarnedBadgeIds(updatedEarnedBadges);
      saveEarnedBadges(updatedEarnedBadges);
    }
  };

  const dismissNotification = (badgeId: number) => {
    setNotifications(prev => prev.filter(b => b.id !== badgeId));
  };

  const resetBadges = () => {
    setEarnedBadgeIds(new Set());
    localStorage.removeItem('earnedBadges');
  };

  return {
    notifications,
    checkForNewBadges,
    dismissNotification,
    resetBadges,
  };
}