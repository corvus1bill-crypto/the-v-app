import { useState, useEffect } from "react";
import { ArrowLeft, Heart, MessageCircle, Bookmark } from "lucide-react";
import { Post } from "../types";

interface SavedPostsPageProps {
  onBack: () => void;
  savedPosts?: Post[]; // Keep prop for backward compatibility or initial server data
}

export function SavedPostsPage({ onBack, savedPosts: propSavedPosts }: SavedPostsPageProps) {
  const [posts, setPosts] = useState<Post[]>(propSavedPosts || []);

  // Load saved posts from local storage on mount
  useEffect(() => {
    try {
      const savedDataRaw = localStorage.getItem('vibe_saved_posts_data');
      if (savedDataRaw) {
        const localSavedPosts = JSON.parse(savedDataRaw);
        if (Array.isArray(localSavedPosts)) {
          // Use local storage as source of truth if available, as it has the latest user interactions
          setPosts(localSavedPosts.reverse()); // Show newest saved first
        }
      } else if (propSavedPosts) {
        setPosts(propSavedPosts);
      }
    } catch (error) {
      console.error('Error loading saved posts:', error);
    }
  }, [propSavedPosts]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-secondary/20 to-background"
      style={{ animation: 'pageSlideIn 0.35s cubic-bezier(.22,.68,0,1.2) both' }}>
      {/* Header */}
      <div className="shrink-0 z-40 bg-background/80 backdrop-blur-xl border-b border-accent/20">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center hover:from-accent/20 hover:to-accent/10 transition-all active:scale-95"
          >
            <ArrowLeft className="text-accent" size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
              Saved Posts
            </h1>
            <p className="text-xs text-muted-foreground">Only you can see what you've saved</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {posts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
            {posts.map((post) => (
              <div
                key={post.id}
                className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-accent/20 group cursor-pointer"
              >
                <img
                  src={post.imageUrls?.[0] || post.imageUrl || ""}
                  alt={post.caption}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-xs font-medium line-clamp-1 mb-2">{post.caption}</p>
                    <div className="flex items-center justify-between text-white/90 text-xs">
                      <div className="flex items-center gap-1">
                        <Heart size={14} className={post.isLiked ? "fill-red-500 text-red-500" : ""} />
                        <span>{formatNumber(post.likes)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle size={14} />
                        <span>{formatNumber(post.comments)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-accent">
                      <Bookmark size={14} fill="currentColor" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
             <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4">
               <Bookmark className="text-accent" size={32} />
             </div>
             <h3 className="text-lg font-bold mb-2">No saved posts yet</h3>
             <p className="text-muted-foreground text-sm max-w-xs">Posts you save will appear here. Go explore and find some vibes!</p>
          </div>
        )}
        
        {posts.length > 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">End of saved posts</p>
          </div>
        )}
      </div>
    </div>
  );
}