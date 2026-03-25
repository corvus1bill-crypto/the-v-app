import { X, Eye, Users, Bookmark, Share2, UserPlus, TrendingUp } from 'lucide-react';
import { PostInsights } from '../types';

interface PostInsightsModalProps {
  postId: string;
  insights: PostInsights;
  onClose: () => void;
}

export function PostInsightsModal({ postId, insights, onClose }: PostInsightsModalProps) {
  const stats = [
    { 
      icon: Eye, 
      label: 'Views', 
      value: insights.views.toLocaleString(), 
      color: 'bg-blue-500',
      description: 'Total impressions'
    },
    { 
      icon: Users, 
      label: 'Reach', 
      value: insights.reach.toLocaleString(), 
      color: 'bg-purple-500',
      description: 'Unique accounts'
    },
    { 
      icon: Bookmark, 
      label: 'Saves', 
      value: insights.saves.toLocaleString(), 
      color: 'bg-yellow-500',
      description: 'Times saved'
    },
    { 
      icon: Share2, 
      label: 'Shares', 
      value: insights.shares.toLocaleString(), 
      color: 'bg-green-500',
      description: 'Times shared'
    },
    { 
      icon: UserPlus, 
      label: 'Profile Visits', 
      value: insights.profileVisits.toLocaleString(), 
      color: 'bg-red-500',
      description: 'From this post'
    },
    { 
      icon: TrendingUp, 
      label: 'Engagement', 
      value: `${insights.engagement.toFixed(1)}%`, 
      color: 'bg-orange-500',
      description: 'Rate'
    },
  ];

  return (
    <div className="absolute inset-0 z-[100] flex items-end justify-center bg-black/80 animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-background rounded-t-3xl shadow-2xl border-4 border-black animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <div>
            <h2 className="text-2xl font-black uppercase">Post Insights</h2>
            <p className="text-sm opacity-60 font-bold mt-1">Performance analytics</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-black text-background rounded-lg hover:scale-110 active:scale-95 transition-transform"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="p-6 space-y-3 max-h-[70%] overflow-y-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="p-4 bg-white border-4 border-black hover:translate-x-1 hover:-translate-y-1 transition-transform"
                style={{ animation: `springUp 0.4s cubic-bezier(.22,.68,0,1.2) ${index * 50}ms both` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${stat.color} border-4 border-black flex items-center justify-center`}>
                      <Icon size={24} strokeWidth={3} className="text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold opacity-60 uppercase">{stat.label}</div>
                      <div className="text-2xl font-black">{stat.value}</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold opacity-40 text-right">{stat.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="p-6 border-t-4 border-black bg-black text-background">
          <div className="text-center">
            <div className="text-sm font-bold opacity-60 uppercase mb-1">Overall Performance</div>
            <div className="text-3xl font-black">
              {insights.engagement > 5 ? '🔥 Excellent' : insights.engagement > 3 ? '👍 Good' : '📊 Growing'}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-background text-black font-black uppercase border-4 border-black hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}