import { useState } from 'react';
import { ArrowLeft, TrendingUp, Hash, Users, Flame, Sparkles, ChevronRight, Search, X, Zap, Heart, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as db from '../db';

interface DiscoverPageProps {
  onBack: () => void;
  onViewProfile?: (userId: string) => void;
  onNavigateToPost?: (postId: string) => void;
  onHashtagClick?: (tag: string) => void;
  onNavigateToRecap?: () => void;
  currentUserId?: string;
}

const CATEGORIES = [
  { id: 'fashion', name: 'Fashion', emoji: '👗', color: '#EC4899', image: 'https://images.unsplash.com/photo-1627962534033-0818d66f82ed?w=400&h=400&fit=crop', posts: '12.4K' },
  { id: 'music', name: 'Music', emoji: '🎵', color: '#8B5CF6', image: 'https://images.unsplash.com/photo-1666289186874-0d023fe7d002?w=400&h=400&fit=crop', posts: '8.9K' },
  { id: 'gaming', name: 'Gaming', emoji: '🎮', color: '#10B981', image: 'https://images.unsplash.com/photo-1759701547036-bf7d7b05cc52?w=400&h=400&fit=crop', posts: '15.2K' },
  { id: 'food', name: 'Food', emoji: '🍜', color: '#F59E0B', image: 'https://images.unsplash.com/photo-1760445529170-73a54a6961d5?w=400&h=400&fit=crop', posts: '10.1K' },
  { id: 'fitness', name: 'Fitness', emoji: '💪', color: '#EF4444', image: 'https://images.unsplash.com/photo-1584827386916-b5351d3ba34b?w=400&h=400&fit=crop', posts: '7.3K' },
  { id: 'travel', name: 'Travel', emoji: '✈️', color: '#3B82F6', image: 'https://images.unsplash.com/photo-1743699537171-750edd44bd87?w=400&h=400&fit=crop', posts: '9.8K' },
];

const TRENDING_HASHTAGS = [
  { tag: '#VibeCheck2026', posts: '45.2K', trend: '+234%' },
  { tag: '#NeoFashion', posts: '23.1K', trend: '+189%' },
  { tag: '#AIArt', posts: '67.8K', trend: '+156%' },
  { tag: '#DigitalNomad', posts: '31.4K', trend: '+142%' },
  { tag: '#FitCheck', posts: '18.9K', trend: '+128%' },
  { tag: '#SunsetVibes', posts: '52.3K', trend: '+95%' },
  { tag: '#StreetFood', posts: '29.7K', trend: '+87%' },
  { tag: '#MentalHealth', posts: '41.2K', trend: '+76%' },
];

const TRENDING_CREATORS = [
  { id: 'tc1', username: 'VibeKing', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', followers: '2.1M', category: 'Lifestyle', verified: true },
  { id: 'tc2', username: 'PixelQueen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', followers: '890K', category: 'Art', verified: true },
  { id: 'tc3', username: 'ChefMarcus', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop', followers: '1.4M', category: 'Food', verified: false },
  { id: 'tc4', username: 'TechNova', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop', followers: '567K', category: 'Tech', verified: true },
];

const DAILY_VIBES = [
  { id: 'dv1', title: 'Best sunrise spot?', responses: 1234, emoji: '🌅' },
  { id: 'dv2', title: 'Song of the day', responses: 3456, emoji: '🎧' },
  { id: 'dv3', title: 'Outfit rating thread', responses: 2891, emoji: '👕' },
];

export function DiscoverPage({ onBack, onViewProfile, onNavigateToPost, onHashtagClick, onNavigateToRecap, currentUserId }: DiscoverPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [followedCreators, setFollowedCreators] = useState<Set<string>>(new Set());

  const toggleFollow = async (creatorId: string) => {
    if (!currentUserId) return;
    
    const isCurrentlyFollowing = followedCreators.has(creatorId);
    
    // Optimistic update
    setFollowedCreators(prev => {
      const next = new Set(prev);
      if (isCurrentlyFollowing) {
        next.delete(creatorId);
      } else {
        next.add(creatorId);
      }
      return next;
    });
    
    // Call real database
    try {
      if (isCurrentlyFollowing) {
        await db.unfollowUser(currentUserId, creatorId);
      } else {
        await db.followUser(currentUserId, creatorId);
      }
      console.log(`✅ User ${isCurrentlyFollowing ? 'unfollowed' : 'followed'}`);
    } catch (error) {
      console.error('❌ Error toggling follow:', error);
      // Rollback on error
      setFollowedCreators(prev => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) {
          next.add(creatorId);
        } else {
          next.delete(creatorId);
        }
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col bg-background" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Header */}
      <div className="shrink-0 z-40 bg-background border-b-4 border-foreground px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-10 h-10 bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all active:scale-95">
            <ArrowLeft className="text-foreground" size={20} strokeWidth={3} />
          </button>
          <h1 className="text-2xl font-black text-foreground uppercase italic tracking-tight" style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) both' }}>
            <Sparkles className="inline mr-2" size={24} strokeWidth={3} />
            DISCOVER
          </h1>
        </div>
        
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} strokeWidth={3} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH TOPICS, PEOPLE, HASHTAGS..."
            className="w-full pl-10 pr-10 py-3 bg-card border-2 border-foreground font-black font-mono text-sm placeholder:text-foreground/30 outline-none shadow-[4px_4px_0px_0px_var(--foreground)] focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all uppercase"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={18} strokeWidth={3} className="text-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-6">
        
        {/* Daily Vibes Quick Polls */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} strokeWidth={3} className="text-foreground" />
            <h2 className="text-sm font-black text-foreground uppercase">Daily Vibes</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {DAILY_VIBES.map((vibe, i) => (
              <motion.button
                key={vibe.id}
                whileTap={{ scale: 0.95 }}
                className="shrink-0 w-36 bg-card border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] p-3 text-left hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all"
                style={{ animation: `springUp 0.4s cubic-bezier(.22,.68,0,1.2) ${i * 60}ms both` }}
              >
                <div className="text-3xl mb-2">{vibe.emoji}</div>
                <p className="text-xs font-black text-foreground uppercase leading-tight mb-2">{vibe.title}</p>
                <div className="flex items-center gap-1 text-foreground/50">
                  <Users size={10} strokeWidth={3} />
                  <span className="text-[9px] font-mono font-bold">{vibe.responses.toLocaleString()} vibing</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Trending Hashtags */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} strokeWidth={3} className="text-foreground" />
              <h2 className="text-sm font-black text-foreground uppercase">Trending Now</h2>
            </div>
            <Flame size={16} strokeWidth={3} className="text-foreground" style={{ animation: 'flameDance 1.5s ease-in-out infinite' }} />
          </div>
          <div className="border-4 border-foreground bg-card shadow-[4px_4px_0px_0px_var(--foreground)]">
            {TRENDING_HASHTAGS.slice(0, 5).map((hashtag, i) => (
              <motion.button
                key={hashtag.tag}
                whileTap={{ scale: 0.98 }}
                onClick={() => onHashtagClick?.(hashtag.tag.replace('#', ''))}
                className="w-full flex items-center gap-3 px-4 py-3 border-b-2 border-foreground/10 last:border-0 hover:bg-foreground/5 transition-colors text-left"
                style={{ animation: `fadeSlideUp 0.3s ease ${i * 50}ms both` }}
              >
                <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center font-black text-sm border-2 border-foreground">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-foreground uppercase">{hashtag.tag}</p>
                  <p className="text-[10px] font-mono font-bold text-foreground/50">{hashtag.posts} posts</p>
                </div>
                <div className="px-2 py-1 bg-foreground/10 border border-foreground/20">
                  <span className="text-[10px] font-black text-foreground">{hashtag.trend}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Hash size={18} strokeWidth={3} className="text-foreground" />
            <h2 className="text-sm font-black text-foreground uppercase">Browse Categories</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelectedCategory(selectedCategory === cat.id ? null : cat.id); onHashtagClick?.(cat.name.toLowerCase()); }}
                className={`relative overflow-hidden border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all aspect-[4/3] ${selectedCategory === cat.id ? 'ring-4 ring-foreground translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_0px_var(--foreground)]' : ''}`}
                style={{ animation: `cardEntrance 0.4s cubic-bezier(.22,.68,0,1.2) ${i * 60}ms both` }}
              >
                <img src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                  <p className="text-lg font-black text-white uppercase leading-none">
                    {cat.emoji} {cat.name}
                  </p>
                  <p className="text-[10px] font-mono font-bold text-white/70 mt-1">{cat.posts} posts</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Rising Creators */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={18} strokeWidth={3} className="text-foreground" />
              <h2 className="text-sm font-black text-foreground uppercase">Rising Creators</h2>
            </div>
            <button className="flex items-center gap-1 text-foreground/50 hover:text-foreground transition-colors">
              <span className="text-[10px] font-black uppercase">See All</span>
              <ChevronRight size={14} strokeWidth={3} />
            </button>
          </div>
          <div className="space-y-3">
            {TRENDING_CREATORS.map((creator, i) => (
              <motion.div
                key={creator.id}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 p-3 bg-card border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all cursor-pointer"
                style={{ animation: `springUp 0.4s cubic-bezier(.22,.68,0,1.2) ${i * 60}ms both` }}
                onClick={() => onViewProfile?.(creator.id)}
              >
                <div className="relative">
                  <div className="w-14 h-14 border-4 border-foreground bg-foreground overflow-hidden shadow-[2px_2px_0px_0px_var(--foreground)]">
                    <img src={creator.avatar} alt={creator.username} className="w-full h-full object-cover" />
                  </div>
                  {creator.verified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-foreground border-2 border-background flex items-center justify-center">
                      <span className="text-[8px]">✓</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm text-foreground uppercase truncate">{creator.username}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono font-bold text-foreground/50">{creator.followers} followers</span>
                    <span className="text-[10px] font-mono font-bold text-foreground/30">|</span>
                    <span className="text-[10px] font-mono font-bold text-foreground/50">{creator.category}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFollow(creator.id); }}
                  className={`px-4 py-2 text-xs font-black uppercase border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all ${followedCreators.has(creator.id) ? 'bg-card text-foreground' : 'bg-foreground text-background'}`}
                >
                  {followedCreators.has(creator.id) ? 'Following' : 'Follow'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Vibe Moments */}
        <div className="px-4 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Eye size={18} strokeWidth={3} className="text-foreground" />
            <h2 className="text-sm font-black text-foreground uppercase">Vibe Moments</h2>
          </div>
          <div className="bg-gradient-to-br from-foreground/10 to-foreground/5 border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] p-5 text-center" style={{ animation: 'breatheGlow 3s ease-in-out infinite' }}>
            <div className="text-4xl mb-3" style={{ animation: 'floatY 3s ease-in-out infinite' }}>🌟</div>
            <h3 className="text-lg font-black text-foreground uppercase mb-1">Your Weekly Recap</h3>
            <p className="text-xs font-mono font-bold text-foreground/60 mb-4">See how you vibed this week</p>
            <button
              onClick={onNavigateToRecap}
              className="px-6 py-3 bg-foreground text-background border-2 border-foreground font-black uppercase text-sm shadow-[4px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] transition-all active:scale-95">
              View Recap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
