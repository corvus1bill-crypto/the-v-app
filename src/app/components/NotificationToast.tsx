import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, MessageCircle, UserPlus, Trophy, ThumbsDown, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';

export type NotificationType = 'like' | 'dislike' | 'comment' | 'follow' | 'message' | 'leaderboard';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  avatar?: string;
  timestamp: number;
  read: boolean;
  postId?: string;
  userId?: string;
  // Extended fields for popup banner display
  username?: string;
  userAvatar?: string;
  postImage?: string;
}

interface NotificationToastProps {
  notifications: Notification[];
  onDismiss: (notificationId: string) => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationToast({ notifications, onDismiss, onNotificationClick }: NotificationToastProps) {
  // Safety check to ensure notifications is always an array
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return <Heart size={20} strokeWidth={3} className="text-red-500" fill="#EF4444" />;
      case 'dislike':
        return <ThumbsDown size={20} strokeWidth={3} className="text-purple-500" />;
      case 'comment':
        return <MessageCircle size={20} strokeWidth={3} className="text-blue-500" />;
      case 'follow':
        return <UserPlus size={20} strokeWidth={3} className="text-green-500" />;
      case 'message':
        return <MessageSquare size={20} strokeWidth={3} className="text-background" />;
      case 'leaderboard':
        return <Trophy size={20} strokeWidth={3} className="text-yellow-500" fill="#EAB308" />;
      default:
        return null;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return '#FEE2E2';
      case 'dislike':
        return '#F3E8FF';
      case 'comment':
        return '#DBEAFE';
      case 'follow':
        return '#D1FAE5';
      case 'message':
        return '#FFEDD5';
      case 'leaderboard':
        return '#FEF3C7';
      default:
        return '#F3F4F6';
    }
  };

  return (
    <div className="absolute top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none" style={{ width: 'min(90vw, 320px)' }}>
      <AnimatePresence mode="wait">
        {safeNotifications.slice(0, 1).map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25,
              duration: 0.3 
            }}
            className="relative pointer-events-auto cursor-pointer"
            onClick={() => onNotificationClick?.(notification)}
          >
            {/* Main notification card */}
            <div 
              className="bg-card border-3 border-foreground shadow-[6px_6px_0px_0px_var(--foreground)] overflow-hidden hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0px_0px_var(--foreground)] transition-all"
              style={{ backgroundColor: getNotificationColor(notification.type) }}
            >
              {/* Content */}
              <div className="relative p-3 flex items-center gap-2">
                {/* Avatar or Icon */}
                {notification.avatar ? (
                  <div className="flex-shrink-0 w-10 h-10 border-2 border-foreground overflow-hidden shadow-[2px_2px_0px_0px_var(--foreground)]">
                    <img 
                      src={notification.avatar} 
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-10 h-10 border-2 border-foreground bg-card shadow-[2px_2px_0px_0px_var(--foreground)] flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                )}

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-black text-foreground uppercase leading-tight mb-0.5">{notification.title}</h3>
                  <p className="text-[11px] font-bold text-foreground/70 line-clamp-1">{notification.message}</p>
                </div>

                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(notification.id);
                  }}
                  className="flex-shrink-0 w-6 h-6 bg-foreground text-background border-2 border-foreground hover:bg-card hover:text-foreground transition-colors shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                >
                  <X size={12} strokeWidth={3} className="mx-auto" />
                </button>
              </div>

              {/* Progress bar animation */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
                className="h-1 bg-foreground"
                onAnimationComplete={() => onDismiss(notification.id)}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Hook to manage notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('vibe_notifications');
        if (stored) {
          const parsed = JSON.parse(stored);
          setNotifications(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && notifications.length > 0) {
        localStorage.setItem('vibe_notifications', JSON.stringify(notifications));
      }
    } catch (e) {
      console.error('Failed to save notifications:', e);
    }
  }, [notifications]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
    };

    // Add to main notifications list
    setNotifications(prev => [newNotification, ...prev].slice(0, 100)); // Keep max 100 notifications

    // Add to toast notifications (will auto-dismiss)
    setToastNotifications(prev => [newNotification, ...prev]);
  };

  const dismissToast = (notificationId: string) => {
    setToastNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setToastNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAll = () => {
    setNotifications([]);
    setToastNotifications([]);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('vibe_notifications');
      }
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    toastNotifications,
    unreadCount,
    addNotification,
    dismissToast,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}