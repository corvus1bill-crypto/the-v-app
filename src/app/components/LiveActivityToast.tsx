import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, UserPlus, Trophy, Mail, Star, X } from 'lucide-react';
import { LiveEvent, LiveEventType } from '../hooks/useLiveActivity';

/* ─── Config ─────────────────────────────────────────── */
const AUTO_DISMISS_MS = 2500;

const TYPE_CONFIG: Record<LiveEventType, { bg: string; border: string; icon: JSX.Element; label: string }> = {
  like: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    icon: <Heart size={16} strokeWidth={3} className="text-red-500 fill-red-500" />,
    label: 'NEW LIKE',
  },
  comment: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    icon: <MessageCircle size={16} strokeWidth={3} className="text-blue-500" />,
    label: 'NEW COMMENT',
  },
  follow: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    icon: <UserPlus size={16} strokeWidth={3} className="text-green-600" />,
    label: 'NEW FOLLOWER',
  },
  message: {
    bg: 'bg-orange-50',
    border: 'border-background',
    icon: <Mail size={16} strokeWidth={3} className="text-background" />,
    label: 'MESSAGE',
  },
  leaderboard: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    icon: <Trophy size={16} strokeWidth={3} className="text-yellow-600" />,
    label: 'TRENDING',
  },
  milestone: {
    bg: 'bg-purple-50',
    border: 'border-purple-500',
    icon: <Star size={16} strokeWidth={3} className="text-purple-500 fill-purple-500" />,
    label: 'MILESTONE',
  },
};

/* ─── Single Toast ────────────────────────────────────── */
interface ToastItemProps {
  event: LiveEvent;
  onDismiss: (id: string) => void;
}

function ToastItem({ event, onDismiss }: ToastItemProps) {
  const cfg = TYPE_CONFIG[event.type];
  const isSystemEvent = event.type === 'leaderboard' || event.type === 'milestone';

  return (
    <motion.div
      layout
      initial={{ y: -80, opacity: 0, scale: 0.85 }}
      animate={{ y: 0,   opacity: 1, scale: 1 }}
      exit={{   y: -80, opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="w-full"
    >
      <div className={`relative flex items-center gap-3 p-3 border-4 border-black ${cfg.bg} shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] overflow-hidden`}>
        
        {/* Colored left accent */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${cfg.border.replace('border-', 'bg-')}`} />

        {/* Avatar or icon */}
        {isSystemEvent ? (
          <div className={`w-10 h-10 flex-shrink-0 border-2 border-black flex items-center justify-center bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
            <span className="text-xl">{event.emoji}</span>
          </div>
        ) : (
          <div className="relative flex-shrink-0">
            <img
              src={event.avatar}
              alt={event.username}
              className="w-10 h-10 border-2 border-black object-cover shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
            {/* Type badge */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-black bg-white flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
              {cfg.icon}
            </div>
          </div>
        )}

        {/* Text */}
        <div className="flex-1 min-w-0 pl-1">
          <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${cfg.border.replace('border-', 'text-')}`}>
            {cfg.label}
          </p>
          <p className="text-xs font-bold text-black leading-snug line-clamp-2">
            {event.message}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => onDismiss(event.id)}
          className="flex-shrink-0 w-6 h-6 border-2 border-black bg-black text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <X size={10} strokeWidth={4} />
        </button>

        {/* Progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-black"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 2.5, ease: 'linear' }}
          onAnimationComplete={() => onDismiss(event.id)}
        />
      </div>
    </motion.div>
  );
}

/* ─── Toast Container + Hook ─────────────────────────── */
interface LiveActivityToastProps {
  events: LiveEvent[];
  onDismiss: (id: string) => void;
}

export function LiveActivityToast({ events, onDismiss }: LiveActivityToastProps) {
  // Show max 2 at once, latest first
  const visible = events.slice(0, 2);

  return (
    <div
      className="absolute top-4 left-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: '380px', margin: '0 auto' }}
    >
      <AnimatePresence mode="sync">
        {visible.map((evt) => (
          <div key={evt.id} className="pointer-events-auto">
            <ToastItem event={evt} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── State manager hook ─────────────────────────────── */
export function useLiveToasts() {
  const [events, setEvents] = useState<LiveEvent[]>([]);

  const pushEvent = useCallback((evt: LiveEvent) => {
    setEvents(prev => [evt, ...prev].slice(0, 5));
    // Auto dismiss after slightly longer than bar animation
    setTimeout(() => {
      setEvents(prev => prev.filter(e => e.id !== evt.id));
    }, AUTO_DISMISS_MS + 600);
  }, []);

  const dismiss = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  return { events, pushEvent, dismiss };
}