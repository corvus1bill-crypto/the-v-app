import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

const ONLINE_USERS = [
  { id: 'u1', username: 'TravelDreamer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', action: 'just posted' },
  { id: 'u4', username: 'NaturePhotos',  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', action: 'is live now' },
  { id: 'u6', username: 'FitnessLife',   avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', action: 'viewing stories' },
  { id: 'u5', username: 'PortraitPro',   avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop', action: 'online' },
  { id: 'u2', username: 'FoodieHeaven',  avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop', action: 'online' },
  { id: 'u9', username: 'ArtisticSoul',  avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=100&h=100&fit=crop', action: 'just liked' },
];

interface Props {
  onViewProfile?: (userId: string) => void;
}

export function OnlineNowBanner({ onViewProfile }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentIdx(i => (i + 1) % ONLINE_USERS.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-black border-b-4 border-black overflow-x-auto [&::-webkit-scrollbar]:hidden">
      {/* Live label */}
      <div className="flex-shrink-0 flex items-center gap-1.5 pr-2 border-r-2 border-white/20">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Live Now</span>
      </div>

      {/* Avatars - using CSS transitions instead of motion animations */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {ONLINE_USERS.map((user, i) => (
          <button
            key={user.id}
            onClick={() => onViewProfile?.(user.id)}
            className="flex-shrink-0 relative active:scale-90 transition-transform"
          >
            <div className={`w-7 h-7 border-2 overflow-hidden transition-all duration-300 ${
              i === currentIdx ? 'border-background shadow-[0_0_0_2px_color-mix(in_srgb,var(--background)_40%,transparent)] scale-110' : 'border-white/40'
            }`}>
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border border-black" />
          </button>
        ))}

        {/* Activity ticker - CSS animation instead of motion */}
        <div className="flex-1 min-w-0 overflow-hidden ml-1">
          <p
            key={currentIdx}
            className="text-[10px] font-bold text-white/70 truncate animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <span className="text-background font-black">{ONLINE_USERS[currentIdx].username}</span>
            {' '}
            {ONLINE_USERS[currentIdx].action}
          </p>
        </div>
      </div>

      {/* Count badge */}
      <div className="flex-shrink-0 flex items-center gap-1 pl-2 border-l-2 border-white/20">
        <Zap size={10} className="text-background" fill="var(--background)" />
        <span className="text-[10px] font-black text-white/60">{ONLINE_USERS.length + 247}</span>
      </div>
    </div>
  );
}