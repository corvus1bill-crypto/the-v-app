import { useState, useMemo } from 'react';
import { UserPlus, UserCheck, X } from 'lucide-react';
import { Post } from '../types';

interface FollowSuggestionsProps {
  onViewProfile?: (userId: string) => void;
  onFollowToggle?: (userId: string) => void;
  followedUserIds?: Set<string>;
  currentUserId?: string;
  posts?: Post[];
  forYouPosts?: Post[];
}

export function FollowSuggestions({
  onViewProfile,
  onFollowToggle,
  followedUserIds = new Set(),
  currentUserId = '',
  posts = [],
  forYouPosts = [],
}: FollowSuggestionsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Derive unique suggested users from all available posts,
  // excluding users we already follow and ourselves
  const suggestions = useMemo(() => {
    const allPosts = [...posts, ...forYouPosts];
    const seen = new Set<string>();
    const users: { id: string; username: string; avatar: string; postCount: number }[] = [];

    for (const post of allPosts) {
      if (seen.has(post.userId)) {
        // Increment post count for already-seen user
        const existing = users.find(u => u.id === post.userId);
        if (existing) existing.postCount++;
        continue;
      }
      // Skip self, already followed, and dismissed
      if (post.userId === currentUserId) continue;
      if (followedUserIds.has(post.userId)) continue;

      seen.add(post.userId);
      users.push({
        id: post.userId,
        username: post.username,
        avatar: post.userAvatar,
        postCount: 1,
      });
    }

    // Sort by post count (most active first), take top 8
    return users
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 8);
  }, [posts, forYouPosts, followedUserIds, currentUserId]);

  const visible = suggestions.filter(s => !dismissed.has(s.id));
  if (visible.length === 0) return null;

  return (
    <div className="mx-2 mb-4 bg-card border-4 border-foreground shadow-[6px_6px_0px_0px_var(--foreground)]" style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) both' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b-4 border-foreground bg-foreground">
        <p className="text-xs font-black text-background uppercase tracking-widest">People You May Know</p>
        <div className="w-2 h-2 bg-background border border-background" />
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-3">
        {visible.map((user, idx) => {
          const isFollowed = followedUserIds.has(user.id);
          return (
            <div
              key={user.id}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 w-20"
              style={{ animation: `fadeSlideUp 0.3s ease ${idx * 60}ms both` }}
            >
              {/* Dismiss */}
              <div className="relative">
                <button
                  onClick={() => setDismissed(prev => new Set([...prev, user.id]))}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-foreground text-background flex items-center justify-center z-10 border border-foreground"
                >
                  <X size={8} strokeWidth={3} />
                </button>
                <button
                  onClick={() => onViewProfile?.(user.id)}
                  className="w-14 h-14 border-2 border-foreground overflow-hidden block hover:scale-105 transition-transform"
                >
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                </button>
              </div>

              <p className="text-[10px] font-black text-foreground uppercase truncate w-full text-center">{user.username}</p>
              <p className="text-[9px] font-mono text-foreground/50 text-center leading-none">
                {user.postCount} {user.postCount === 1 ? 'post' : 'posts'}
              </p>

              <button
                onClick={() => onFollowToggle?.(user.id)}
                className={`w-full py-1 text-[9px] font-black uppercase border-2 border-foreground transition-all flex items-center justify-center gap-1 ${
                  isFollowed
                    ? 'bg-foreground text-background shadow-none'
                    : 'bg-background text-foreground shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                }`}
              >
                {isFollowed ? <UserCheck size={9} strokeWidth={3} /> : <UserPlus size={9} strokeWidth={3} />}
                {isFollowed ? 'Following' : 'Follow'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}