import { useState, useMemo } from 'react';
import { ArrowLeft, Hash, TrendingUp, Grid3X3, List, Heart, MessageCircle, Star, StarOff } from 'lucide-react';
import { Post } from '../types';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface HashtagPageProps {
  hashtag: string;
  allPosts: Post[];
  onBack: () => void;
  onViewPost: (postId: string) => void;
  onViewProfile: (userId: string) => void;
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#(\w+)/g) || [];
  return matches.map(h => h.slice(1).toLowerCase());
}

export function HashtagPage({ hashtag, allPosts, onBack, onViewPost, onViewProfile }: HashtagPageProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const tag = hashtag.replace(/^#/, '').toLowerCase();

  const [isFollowing, setIsFollowing] = useState(() => {
    try {
      const followed: string[] = JSON.parse(localStorage.getItem('vibe_followed_hashtags') || '[]');
      return followed.includes(tag);
    } catch { return false; }
  });

  const toggleFollow = () => {
    try {
      const followed: string[] = JSON.parse(localStorage.getItem('vibe_followed_hashtags') || '[]');
      const next = isFollowing
        ? followed.filter(t => t !== tag)
        : [...followed, tag];
      localStorage.setItem('vibe_followed_hashtags', JSON.stringify(next));
      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? `Unfollowed #${tag}` : `Following #${tag}!`);
    } catch { /* ignore */ }
  };

  const taggedPosts = useMemo(() => {
    return allPosts.filter(post => {
      const captionTags = extractHashtags(post.caption || '');
      const explicitTags = (post.hashtags || []).map(h => h.toLowerCase().replace(/^#/, ''));
      return captionTags.includes(tag) || explicitTags.includes(tag);
    });
  }, [allPosts, tag]);

  const totalLikes = taggedPosts.reduce((sum, p) => sum + p.likes, 0);
  const totalPosts = taggedPosts.length;

  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 bg-background border-b-4 border-foreground shadow-[0px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_10%,transparent)]" style={{
        paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right))',
        paddingTop: '1rem',
        paddingBottom: '1rem'
      }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:scale-95"
          >
            <ArrowLeft className="text-foreground" size={20} strokeWidth={3} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-foreground flex items-center justify-center">
              <Hash size={18} className="text-background" strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tight text-foreground leading-none">
                #{tag}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="shrink-0 px-4 py-4 bg-foreground">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-black text-background">{formatNum(totalPosts)}</p>
            <p className="text-[10px] font-black text-background/60 uppercase tracking-widest">Posts</p>
          </div>
          <div className="w-px h-10 bg-background/20" />
          <div className="text-center">
            <p className="text-2xl font-black text-background">{formatNum(totalLikes)}</p>
            <p className="text-[10px] font-black text-background/60 uppercase tracking-widest">Total Likes</p>
          </div>
          <div className="w-px h-10 bg-background/20" />
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} className="text-background/60" />
            <span className="text-xs font-black text-background/60 uppercase">Trending</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleFollow}
            className={`ml-auto flex items-center gap-1.5 px-3 py-2 border-2 font-black text-xs uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${
              isFollowing
                ? 'bg-background text-foreground border-background'
                : 'bg-transparent text-background border-background'
            }`}
          >
            {isFollowing ? <StarOff size={13} strokeWidth={3} /> : <Star size={13} strokeWidth={3} />}
            {isFollowing ? 'Following' : 'Follow'}
          </motion.button>
        </div>
      </div>

      {/* View toggle */}
      <div className="shrink-0 flex items-center justify-end gap-2 px-4 py-2 border-b-2 border-foreground/10">
        <button
          onClick={() => setView('grid')}
          className={`w-8 h-8 flex items-center justify-center border-2 border-foreground transition-all ${view === 'grid' ? 'bg-foreground text-background' : 'bg-background text-foreground'}`}
        >
          <Grid3X3 size={14} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => setView('list')}
          className={`w-8 h-8 flex items-center justify-center border-2 border-foreground transition-all ${view === 'list' ? 'bg-foreground text-background' : 'bg-background text-foreground'}`}
        >
          <List size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Posts */}
      <div className="flex-1 overflow-y-auto">
        {taggedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-20 h-20 bg-foreground flex items-center justify-center mb-4 shadow-[6px_6px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)]">
              <Hash size={36} className="text-background" strokeWidth={3} />
            </div>
            <h2 className="text-xl font-black uppercase text-foreground mb-2">No posts yet</h2>
            <p className="text-sm font-bold text-foreground/50">Be the first to use #{tag}!</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {taggedPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => onViewPost(post.id)}
                className="relative aspect-square bg-foreground/10 overflow-hidden border border-background active:scale-95 transition-transform"
              >
                {post.imageUrl || (post.imageUrls && post.imageUrls[0]) ? (
                  <img
                    src={post.imageUrls?.[0] || post.imageUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-foreground/5 p-2">
                    <p className="text-[10px] font-bold text-foreground/60 line-clamp-4 text-center">{post.caption}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                  <div className="flex items-center gap-2 text-white">
                    <Heart size={16} fill="white" strokeWidth={0} />
                    <span className="text-xs font-black">{formatNum(post.likes)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="divide-y-2 divide-foreground/10">
            {taggedPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex gap-3 p-4"
              >
                {/* Thumbnail */}
                <button
                  onClick={() => onViewPost(post.id)}
                  className="shrink-0 w-20 h-20 bg-foreground/10 overflow-hidden border-2 border-foreground"
                >
                  {post.imageUrl || (post.imageUrls && post.imageUrls[0]) ? (
                    <img
                      src={post.imageUrls?.[0] || post.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Hash size={20} className="text-foreground/30" />
                    </div>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => onViewProfile(post.userId)}
                    className="flex items-center gap-2 mb-1.5"
                  >
                    <img src={post.userAvatar} alt="" className="w-6 h-6 rounded-full border border-foreground object-cover" />
                    <span className="text-xs font-black text-foreground uppercase">@{post.username}</span>
                  </button>
                  <p className="text-sm font-bold text-foreground/80 line-clamp-2 mb-2">{post.caption}</p>
                  <div className="flex items-center gap-3 text-foreground/50">
                    <span className="flex items-center gap-1 text-xs font-bold">
                      <Heart size={11} />
                      {formatNum(post.likes)}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold">
                      <MessageCircle size={11} />
                      {formatNum(post.comments)}
                    </span>
                    <span className="text-xs font-mono">{post.timestamp}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}