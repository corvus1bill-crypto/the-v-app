import { useEffect, useState, useRef } from "react";
import { X, UserPlus, Heart, MessageCircle, AtSign, ThumbsDown, MessageSquare, Trophy } from "lucide-react";
import { Notification, NotificationType } from "./NotificationToast";

interface NotificationPopupProps {
  notification: Notification | null;
  onClose: () => void;
  onClick: () => void;
}

export function NotificationPopup({ notification, onClose, onClick }: NotificationPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      isClosingRef.current = false;
      // Auto-dismiss after 2 seconds per spec
      const timer = setTimeout(() => {
        handleClose();
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      isClosingRef.current = false;
    }
  }, [notification]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const handleClick = () => {
    handleClose();
    onClick();
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'follow':
        return <UserPlus size={16} strokeWidth={3} />;
      case 'like':
        return <Heart size={16} strokeWidth={3} />;
      case 'dislike':
        return <ThumbsDown size={16} strokeWidth={3} />;
      case 'comment':
        return <MessageCircle size={16} strokeWidth={3} />;
      case 'message':
        return <MessageSquare size={16} strokeWidth={3} />;
      case 'leaderboard':
        return <Trophy size={16} strokeWidth={3} />;
      default:
        return <Heart size={16} strokeWidth={3} />;
    }
  };

  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case 'follow':
        return 'bg-green-500';
      case 'like':
        return 'bg-red-500';
      case 'dislike':
        return 'bg-gray-500';
      case 'comment':
        return 'bg-blue-500';
      case 'message':
        return 'bg-background';
      case 'leaderboard':
        return 'bg-yellow-500';
      default:
        return 'bg-background';
    }
  };

  if (!notification) return null;

  return (
    <div
      className={`absolute top-4 left-4 right-4 z-[100] transition-all duration-300 ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
      style={{ maxWidth: '422px', margin: '0 auto' }} // Center within iPhone width minus padding
    >
      <div
        onClick={handleClick}
        className="w-full bg-card border-4 border-foreground shadow-[8px_8px_0px_0px_var(--foreground)] p-3 cursor-pointer group hover:shadow-[6px_6px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
      >
        <div className="flex items-start gap-3">
          {/* User Avatar with Icon Badge */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 border-2 border-foreground bg-foreground overflow-hidden">
              <img
                src={notification.userAvatar || notification.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                alt={notification.username || notification.title || ''}
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${getIconBg(notification.type)} border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)]`}>
              <div className="text-white">
                {getIcon(notification.type)}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-snug mb-1">
              <span className="font-black">{notification.username || notification.title}</span> {notification.message}
            </p>
            <p className="text-xs font-mono font-bold text-foreground/50 uppercase tracking-wide">
              just now
            </p>
          </div>

          {/* Post Thumbnail (if applicable) */}
          {notification.postImage && (
            <div className="w-12 h-12 border-2 border-foreground bg-foreground overflow-hidden flex-shrink-0">
              <img
                src={notification.postImage}
                alt="Post"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="w-6 h-6 bg-foreground border-2 border-foreground text-background flex items-center justify-center flex-shrink-0 hover:bg-background hover:text-foreground transition-colors"
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}