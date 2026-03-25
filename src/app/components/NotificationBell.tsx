import { Bell } from "lucide-react";

interface NotificationBellProps {
  count: number;
  onClick: () => void;
}

export function NotificationBell({ count, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative w-10 h-10 bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:scale-95"
    >
      <Bell className="text-foreground" size={20} strokeWidth={3} />
      {count > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-background border-2 border-foreground flex items-center justify-center px-1">
          <span className="text-[10px] font-black text-foreground leading-none">
            {count > 99 ? '99+' : count}
          </span>
        </div>
      )}
    </button>
  );
}