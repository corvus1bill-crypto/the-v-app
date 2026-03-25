import { useEffect, useState } from 'react';
import { X, MessageCircle } from 'lucide-react';

export interface MessageNotificationData {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: string;
}

interface MessageNotificationProps {
  notification: MessageNotificationData | null;
  onClose: () => void;
  onClick: () => void;
}

export function MessageNotification({ notification, onClose, onClick }: MessageNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification) {
      // Show notification
      setIsVisible(true);
      setIsExiting(false);
      
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [notification]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  if (!notification || !isVisible) return null;

  return (
    <div 
      className={`absolute top-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-md transition-all duration-300 ${
        isExiting 
          ? 'translate-y-[-120%] opacity-0' 
          : 'translate-y-0 opacity-100'
      }`}
      style={{
        animation: isExiting ? 'none' : 'slideInDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div 
        onClick={onClick}
        className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-[0.98] transition-all"
      >
        <div className="flex items-start gap-3">
          {/* Message Icon Badge */}
          <div className="relative flex-shrink-0">
            <img 
              src={notification.senderAvatar} 
              alt={notification.senderName}
              className="w-12 h-12 border-2 border-black object-cover bg-gray-200"
            />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-500 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <MessageCircle size={12} className="text-white fill-white" strokeWidth={3} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-black text-sm text-black uppercase truncate">
                {notification.senderName}
              </p>
              <span className="text-[10px] font-mono font-bold text-black/50 uppercase flex-shrink-0">
                {notification.timestamp}
              </span>
            </div>
            <p className="text-sm text-black/80 font-medium line-clamp-2 leading-snug">
              {notification.message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="flex-shrink-0 w-8 h-8 bg-white border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-black/10 border border-black/20 overflow-hidden">
          <div 
            className="h-full bg-black"
            style={{
              animation: 'progressBar 5s linear forwards'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes slideInDown {
          from {
            transform: translate(-50%, -120%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        
        @keyframes progressBar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
