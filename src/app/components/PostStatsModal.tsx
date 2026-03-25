import { X, TrendingUp, Eye, Heart, MessageCircle, Share2, Users } from 'lucide-react';
import { Post } from '../types';

interface PostStatsModalProps {
  post: Post;
  onClose: () => void;
}

// Generate mock hourly data based on post stats
function generateHourlyData(maxLikes: number) {
  const hours = ['6h ago', '5h', '4h', '3h', '2h', '1h', 'Now'];
  const curve = [0.05, 0.15, 0.35, 0.65, 0.85, 0.95, 1.0];
  return hours.map((h, i) => ({ hour: h, likes: Math.floor(maxLikes * curve[i]) }));
}

export function PostStatsModal({ post, onClose }: PostStatsModalProps) {
  const hourlyData = generateHourlyData(post.likes);
  const maxVal = hourlyData[hourlyData.length - 1].likes;
  const reach = Math.floor(post.likes * 4.2);
  const impressions = Math.floor(post.likes * 8.7);
  const saves = post.isSaved ? Math.floor(post.likes * 0.08) : Math.floor(post.likes * 0.06);

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div className="absolute inset-0 z-[100] flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card border-4 border-foreground shadow-[0px_-6px_0px_0px_var(--foreground)] pb-8"
        style={{ animation: 'scaleIn 0.25s cubic-bezier(.22,.68,0,1.2) both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b-4 border-foreground">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-foreground border-2 border-foreground shadow-[2px_2px_0px_0px_var(--background)]">
              <TrendingUp size={16} className="text-background" strokeWidth={3} />
            </div>
            <h2 className="text-lg font-black uppercase text-foreground">Post Insights</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 border-2 border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors">
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Reach', value: fmt(reach), icon: <Users size={14} strokeWidth={3} />, color: '#ff7a2e' },
              { label: 'Impressions', value: fmt(impressions), icon: <Eye size={14} strokeWidth={3} />, color: '#3b82f6' },
              { label: 'Saves', value: fmt(saves), icon: <Heart size={14} strokeWidth={3} />, color: '#ec4899' },
              { label: 'Likes', value: fmt(post.likes), icon: <Heart size={14} strokeWidth={3} />, color: '#ef4444' },
              { label: 'Comments', value: fmt(post.comments), icon: <MessageCircle size={14} strokeWidth={3} />, color: '#8b5cf6' },
              { label: 'Shares', value: fmt(post.shares), icon: <Share2 size={14} strokeWidth={3} />, color: '#10b981' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="border-2 border-foreground p-2 text-center"
                style={{ animation: `fadeSlideUp 0.3s ease ${i * 50}ms both` }}
              >
                <div className="flex justify-center mb-1" style={{ color: stat.color }}>{stat.icon}</div>
                <p className="text-base font-black text-foreground">{stat.value}</p>
                <p className="text-[9px] font-black text-foreground/50 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Likes over time chart */}
          <div className="border-2 border-foreground p-3">
            <p className="text-xs font-black text-foreground uppercase mb-3 tracking-wide">Likes Over Time</p>
            <div className="flex items-end gap-1 h-16">
              {hourlyData.map((d, i) => {
                const h = maxVal > 0 ? Math.max(8, (d.likes / maxVal) * 56) : 8;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-background border-2 border-foreground transition-all"
                      style={{ height: h, animation: `fadeSlideUp 0.4s ease ${i * 60}ms both` }}
                    />
                    <span className="text-[8px] font-mono text-foreground/50 whitespace-nowrap">{d.hour}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Engagement rate */}
          <div className="border-2 border-foreground p-3 bg-foreground text-background flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-background/60">Engagement Rate</p>
              <p className="text-2xl font-black">{reach > 0 ? ((post.likes / reach) * 100).toFixed(1) : '0.0'}%</p>
            </div>
            <div className="text-4xl font-black text-background">
              {post.likes / (reach || 1) > 0.15 ? '🔥' : post.likes / (reach || 1) > 0.08 ? '⚡' : '📊'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}