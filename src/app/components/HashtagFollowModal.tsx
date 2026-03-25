import { X, Hash, TrendingUp, Search } from 'lucide-react';
import { useState } from 'react';

interface HashtagFollowModalProps {
  followedHashtags: Set<string>;
  onFollowHashtag: (hashtag: string) => void;
  onUnfollowHashtag: (hashtag: string) => void;
  onClose: () => void;
}

const TRENDING_HASHTAGS = [
  { tag: '#vibes', posts: '2.4M' },
  { tag: '#aesthetic', posts: '1.8M' },
  { tag: '#travel', posts: '1.2M' },
  { tag: '#food', posts: '980K' },
  { tag: '#fashion', posts: '850K' },
  { tag: '#photography', posts: '720K' },
  { tag: '#art', posts: '650K' },
  { tag: '#fitness', posts: '540K' },
  { tag: '#nature', posts: '480K' },
  { tag: '#lifestyle', posts: '420K' },
];

export function HashtagFollowModal({ 
  followedHashtags, 
  onFollowHashtag, 
  onUnfollowHashtag, 
  onClose 
}: HashtagFollowModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHashtags = TRENDING_HASHTAGS.filter(h =>
    h.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="absolute inset-0 z-[100] flex items-end justify-center bg-black/80 animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-background rounded-t-3xl shadow-2xl border-4 border-black animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-6 border-b-4 border-black">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                <Hash size={24} strokeWidth={3} />
                Hashtags
              </h2>
              <p className="text-sm opacity-60 font-bold mt-1">
                {followedHashtags.size} following
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-black text-background rounded-lg hover:scale-110 active:scale-95 transition-transform"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={20} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hashtags..."
              className="w-full py-3 pl-12 pr-4 border-4 border-black font-bold uppercase text-sm focus:outline-none focus:ring-4 focus:ring-black/20"
            />
          </div>
        </div>

        {/* Hashtags List */}
        <div className="p-6 space-y-2 max-h-[60%] overflow-y-auto">
          {filteredHashtags.map((hashtag, index) => {
            const isFollowing = followedHashtags.has(hashtag.tag);
            return (
              <div
                key={hashtag.tag}
                className="flex items-center justify-between p-4 bg-white border-4 border-black hover:translate-x-1 hover:-translate-y-1 transition-transform"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black text-background border-2 border-black flex items-center justify-center">
                    <Hash size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <div className="font-black uppercase">{hashtag.tag}</div>
                    <div className="text-xs font-bold opacity-60 flex items-center gap-1">
                      <TrendingUp size={12} strokeWidth={3} />
                      {hashtag.posts} posts
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (isFollowing) {
                      onUnfollowHashtag(hashtag.tag);
                    } else {
                      onFollowHashtag(hashtag.tag);
                    }
                  }}
                  className={`px-6 py-2 font-black uppercase text-sm border-4 border-black transition-all ${
                    isFollowing
                      ? 'bg-black text-background hover:bg-white hover:text-black'
                      : 'bg-background text-black hover:bg-black hover:text-background'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-4 border-black">
          <button
            onClick={onClose}
            className="w-full py-4 bg-black text-background font-black uppercase border-4 border-black hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}