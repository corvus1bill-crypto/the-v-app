import { ArrowLeft, UserPlus, Heart, MessageCircle, Trophy, ThumbsDown, MessageSquare, Trash2 } from "lucide-react";
import { Notification, NotificationType } from "./NotificationToast";

interface NotificationsPageProps {
  notifications: Notification[];
  onBack: () => void;
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onClearAll: () => void;
}

export function NotificationsPage({
  notifications,
  onBack,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
}: NotificationsPageProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'follow':
        return <UserPlus size={20} strokeWidth={3} />;
      case 'like':
        return <Heart size={20} strokeWidth={3} fill="currentColor" />;
      case 'dislike':
        return <ThumbsDown size={20} strokeWidth={3} />;
      case 'comment':
        return <MessageCircle size={20} strokeWidth={3} />;
      case 'message':
        return <MessageSquare size={20} strokeWidth={3} />;
      case 'leaderboard':
        return <Trophy size={20} strokeWidth={3} fill="currentColor" />;
    }
  };

  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case 'follow':
        return 'bg-green-500';
      case 'like':
        return 'bg-red-500';
      case 'dislike':
        return 'bg-purple-500';
      case 'comment':
        return 'bg-blue-500';
      case 'message':
        return 'bg-background';
      case 'leaderboard':
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 z-40 bg-background border-b-4 border-foreground shadow-[0px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_10%,transparent)]" style={{
        paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right))',
        paddingTop: '1rem',
        paddingBottom: '1rem'
      }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:scale-95"
            >
              <ArrowLeft className="text-foreground" size={20} strokeWidth={3} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-foreground uppercase italic tracking-tight"
                style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) both' }}>
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-xs font-bold text-foreground/50 uppercase tracking-wide"
                  style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) 0.1s both' }}>
                  {unreadCount} New
                </p>
              )}
            </div>
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="px-3 py-2 bg-foreground text-background border-2 border-foreground font-black text-xs uppercase shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:scale-95"
                >
                  Read All
                </button>
              )}
              <button
                onClick={onClearAll}
                className="px-3 py-2 bg-red-600 text-white border-2 border-foreground font-black text-xs uppercase shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:scale-95"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4" style={{
        paddingBottom: 'calc(80px + 1rem + env(safe-area-inset-bottom))'
      }}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6"
            style={{ animation: 'cardEntrance 0.6s cubic-bezier(.22,.68,0,1.2) both' }}>
            <div className="w-24 h-24 bg-secondary border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] flex items-center justify-center mb-6 animate-gentle-wobble">
              <MessageCircle size={48} strokeWidth={2} className="text-foreground/20" />
            </div>
            <h2 className="text-xl font-black text-foreground uppercase mb-2">No Notifications</h2>
            <p className="text-sm font-bold text-foreground/50 text-center">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                onClick={() => {
                  onMarkAsRead(notification.id);
                  onNotificationClick(notification);
                }}
                className={`border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] hover:shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer group ${
                  notification.read ? 'bg-background' : 'bg-orange-50'
                }`}
                style={{ animation: `springUp 0.45s cubic-bezier(.22,.68,0,1.2) ${index * 60}ms both` }}
              >
                <div className="p-4 flex items-start gap-4">
                  {/* Avatar or Icon */}
                  {notification.avatar ? (
                    <div className="flex-shrink-0 w-14 h-14 border-4 border-foreground overflow-hidden shadow-[2px_2px_0px_0px_var(--foreground)] bg-background">
                      <img 
                        src={notification.avatar} 
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`flex-shrink-0 w-14 h-14 border-4 border-foreground ${getIconBg(notification.type)} shadow-[2px_2px_0px_0px_var(--foreground)] flex items-center justify-center text-white`}>
                      {getIcon(notification.type)}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-foreground uppercase mb-1">{notification.title}</h3>
                    <p className="text-xs font-bold text-foreground/70 mb-2">{notification.message}</p>
                    <p className="text-[10px] font-mono font-bold text-foreground/40 uppercase">
                      {getTimeAgo(notification.timestamp)}
                    </p>
                    {!notification.read && (
                      <div className="inline-block mt-2 px-2 py-1 bg-background border-2 border-foreground text-white text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_var(--foreground)]">
                        New
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNotification(notification.id);
                    }}
                    className="flex-shrink-0 w-10 h-10 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}