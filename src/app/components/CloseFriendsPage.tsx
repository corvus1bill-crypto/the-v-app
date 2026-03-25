import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Search, X, Users, Check } from 'lucide-react';

export interface CloseFriend {
  userId: string;
  username: string;
  avatar: string;
  addedAt: string;
}

const STORAGE_KEY = 'vibe_close_friends';

export function getCloseFriends(): CloseFriend[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function addCloseFriend(user: { userId: string; username: string; avatar: string }) {
  const current = getCloseFriends();
  if (current.some(u => u.userId === user.userId)) return;
  const updated = [{ ...user, addedAt: new Date().toISOString() }, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removeCloseFriend(userId: string) {
  const current = getCloseFriends().filter(u => u.userId !== userId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function isCloseFriend(userId: string): boolean {
  return getCloseFriends().some(u => u.userId === userId);
}

interface CloseFriendsPageProps {
  onBack: () => void;
  followedUsers: Array<{ id: string; username: string; avatar: string }>;
}

export function CloseFriendsPage({ onBack, followedUsers }: CloseFriendsPageProps) {
  const [closeFriends, setCloseFriends] = useState<CloseFriend[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'all'>('friends');

  useEffect(() => {
    setCloseFriends(getCloseFriends());
  }, []);

  const toggle = (user: { id: string; username: string; avatar: string }) => {
    const isFriend = closeFriends.some(f => f.userId === user.id);
    if (isFriend) {
      removeCloseFriend(user.id);
      setCloseFriends(prev => prev.filter(f => f.userId !== user.id));
    } else {
      const newFriend = { userId: user.id, username: user.username, avatar: user.avatar, addedAt: new Date().toISOString() };
      addCloseFriend(user);
      setCloseFriends(prev => [newFriend, ...prev]);
    }
  };

  const closeFriendIds = new Set(closeFriends.map(f => f.userId));

  const filteredAll = followedUsers.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFriends = closeFriends.filter(f =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 bg-background border-b-4 border-foreground" style={{
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
            <div className="w-9 h-9 bg-green-500 border-2 border-foreground flex items-center justify-center">
              <Star size={18} className="text-white" fill="white" strokeWidth={0} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tight text-foreground leading-none">Close Friends</h1>
              <p className="text-[10px] font-mono font-bold text-foreground/40">{closeFriends.length} IN YOUR LIST</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="shrink-0 px-4 py-3 bg-green-50 border-b-2 border-green-200">
        <div className="flex items-start gap-2">
          <Star size={14} className="text-green-600 shrink-0 mt-0.5" fill="currentColor" strokeWidth={0} />
          <p className="text-xs font-bold text-green-700">
            Share exclusive stories only your Close Friends can see. They won't know who else is on your list.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="shrink-0 px-4 py-3 border-b-2 border-foreground/10">
        <div className="flex items-center gap-2 border-4 border-foreground bg-background px-3 py-2 shadow-[3px_3px_0px_0px_var(--foreground)] focus-within:shadow-none focus-within:translate-x-[3px] focus-within:translate-y-[3px] transition-all">
          <Search size={16} className="text-foreground/40 shrink-0" strokeWidth={3} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm font-bold text-foreground placeholder:text-foreground/30 outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={14} className="text-foreground/40" strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b-4 border-foreground">
        {[
          { key: 'friends', label: `Close Friends (${closeFriends.length})` },
          { key: 'all', label: `Following (${followedUsers.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'friends' | 'all')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors ${
              activeTab === key
                ? 'bg-foreground text-background'
                : 'bg-background text-foreground/50 hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'friends' && (
          <>
            {filteredFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                <div className="w-20 h-20 bg-green-100 border-4 border-foreground flex items-center justify-center mb-4 shadow-[6px_6px_0px_0px_color-mix(in_srgb,var(--foreground)_20%,transparent)]">
                  <Star size={36} className="text-green-500" fill="#22c55e" strokeWidth={0} />
                </div>
                <h2 className="text-xl font-black uppercase text-foreground mb-2">No close friends yet</h2>
                <p className="text-sm font-bold text-foreground/50 mb-4">
                  Go to "Following" tab to add people to your Close Friends list.
                </p>
                <button
                  onClick={() => setActiveTab('all')}
                  className="px-6 py-2 bg-foreground text-background font-black text-sm uppercase border-2 border-foreground shadow-[3px_3px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                >
                  Browse Following
                </button>
              </div>
            ) : (
              <div className="divide-y-2 divide-foreground/10">
                {filteredFriends.map((friend) => (
                  <div key={friend.userId} className="flex items-center gap-3 px-4 py-3">
                    <div className="relative shrink-0">
                      <img src={friend.avatar} alt={friend.username} className="w-12 h-12 object-cover border-2 border-foreground" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-background flex items-center justify-center">
                        <Star size={10} fill="white" strokeWidth={0} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm uppercase text-foreground truncate">@{friend.username}</p>
                      <p className="text-[10px] font-mono text-foreground/40">
                        Added {new Date(friend.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => toggle({ id: friend.userId, username: friend.username, avatar: friend.avatar })}
                      className="shrink-0 px-3 py-2 border-2 border-red-400 bg-background text-red-500 text-xs font-black uppercase transition-all active:scale-95 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'all' && (
          <>
            {followedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                <Users size={48} className="text-foreground/20 mb-4" strokeWidth={1.5} />
                <h2 className="text-xl font-black uppercase text-foreground mb-2">Not following anyone</h2>
                <p className="text-sm font-bold text-foreground/50">Follow people first, then add them as close friends.</p>
              </div>
            ) : filteredAll.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-black text-foreground/40 uppercase">No results for "{search}"</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-foreground/10">
                {filteredAll.map((user) => {
                  const isFriend = closeFriendIds.has(user.id);
                  return (
                    <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="relative shrink-0">
                        <img src={user.avatar} alt={user.username} className="w-12 h-12 object-cover border-2 border-foreground" />
                        {isFriend && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-background flex items-center justify-center">
                            <Star size={10} fill="white" strokeWidth={0} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm uppercase text-foreground truncate">@{user.username}</p>
                        {isFriend && (
                          <p className="text-[10px] font-bold text-green-600">★ Close Friend</p>
                        )}
                      </div>
                      <button
                        onClick={() => toggle(user)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 border-2 border-foreground text-xs font-black uppercase transition-all active:scale-95 ${
                          isFriend
                            ? 'bg-green-500 text-white border-green-500 shadow-none'
                            : 'bg-background text-foreground shadow-[3px_3px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]'
                        }`}
                      >
                        {isFriend ? <><Check size={12} strokeWidth={3} /> Added</> : '+ Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
