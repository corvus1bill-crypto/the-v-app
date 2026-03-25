import { useState } from 'react';
import { 
  FileText, Calendar, Star, CheckCircle, Hash, Share2, Ban, 
  Flag, Sparkles, FileImage, Mic, Image, MessageCircle, 
  Archive, Activity, Bell, BarChart, Eye, Users, Play 
} from 'lucide-react';
import { FeatureShowcase } from './FeatureShowcase';

interface NewFeaturesPanelProps {
  onClose: () => void;
}

const NEW_FEATURES = [
  { icon: FileText, title: 'Draft Posts', description: 'Save posts before publishing', badge: 'Auto-save' },
  { icon: Calendar, title: 'Schedule Posts', description: 'Schedule future posts', badge: 'New' },
  { icon: Star, title: 'Story Highlights', description: 'Save stories permanently', badge: 'Popular' },
  { icon: CheckCircle, title: 'Verified Badges', description: 'Blue checkmark for verified users', badge: 'Status' },
  { icon: Hash, title: 'Follow Hashtags', description: 'Follow trending topics', badge: 'Trending' },
  { icon: Share2, title: 'External Sharing', description: 'Share to other platforms', badge: 'Social' },
  { icon: Ban, title: 'Block/Mute Users', description: 'Control who you see', badge: 'Privacy' },
  { icon: Flag, title: 'Report Content', description: 'Flag inappropriate posts', badge: 'Safety' },
  { icon: Sparkles, title: 'Post Templates', description: 'Pre-made designs', badge: 'Design' },
  { icon: FileImage, title: 'GIF Support', description: 'Add GIFs to posts', badge: 'Fun' },
  { icon: Mic, title: 'Voice Notes', description: 'Record voice messages', badge: 'Audio' },
  { icon: Image, title: 'Photo Filters', description: '8 beautiful filters', badge: 'Creative' },
  { icon: Users, title: 'Multi-Photo Posts', description: 'Upload up to 10 photos', badge: 'Enhanced' },
  { icon: MessageCircle, title: 'Story Replies', description: 'Reply to stories via DM', badge: 'Chat' },
  { icon: Archive, title: 'Archive Posts', description: 'Hide without deleting', badge: 'Organize' },
  { icon: Activity, title: 'Activity Status', description: 'See when users are active', badge: 'Live' },
  { icon: Bell, title: 'Notification Settings', description: 'Customize your alerts', badge: 'Control' },
  { icon: BarChart, title: 'Post Insights', description: 'View analytics', badge: 'Analytics' },
  { icon: Eye, title: 'Story View Count', description: 'See who viewed your stories', badge: 'Tracking' },
  { icon: Users, title: 'User Mentions', description: 'Tag users in posts', badge: 'Social' },
];

export function NewFeaturesPanel({ onClose }: NewFeaturesPanelProps) {
  const [showShowcase, setShowShowcase] = useState(false);

  if (showShowcase) {
    return <FeatureShowcase onClose={() => setShowShowcase(false)} />;
  }

  return (
    <div className="absolute inset-0 z-[100] flex items-end justify-center bg-black/80 animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-background rounded-t-3xl shadow-2xl border-4 border-foreground animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-6 border-b-4 border-foreground bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-black uppercase">🎉 New Features</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg hover:scale-110 active:scale-95 transition-transform border-4 border-white"
            >
              ✕
            </button>
          </div>
          <p className="text-sm font-bold opacity-90">20 amazing new features just dropped!</p>
        </div>

        {/* Features List */}
        <div className="p-6 space-y-2 max-h-[70%] overflow-y-auto">
          {NEW_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-4 bg-card border-4 border-foreground hover:translate-x-1 hover:-translate-y-1 transition-transform"
                style={{ animation: `springUp 0.4s cubic-bezier(.22,.68,0,1.2) ${index * 40}ms both` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-foreground text-background border-2 border-foreground flex items-center justify-center flex-shrink-0">
                    <Icon size={24} strokeWidth={3} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black uppercase text-sm">{feature.title}</h3>
                      <span className="px-2 py-0.5 bg-background text-[10px] font-black uppercase border-2 border-foreground">
                        {feature.badge}
                      </span>
                    </div>
                    <p className="text-xs font-bold opacity-60">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-4 border-foreground bg-foreground text-background">
          <div className="text-center mb-4">
            <div className="text-sm font-bold opacity-80 mb-1">Enjoying the new features?</div>
            <div className="text-2xl font-black">Keep vibing! 🔥</div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setShowShowcase(true)}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black uppercase border-4 border-white hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Play size={20} strokeWidth={3} fill="white" />
              Watch Feature Tour
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-background text-foreground font-black uppercase border-4 border-background hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              Start Exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}