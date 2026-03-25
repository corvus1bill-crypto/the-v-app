import { useState, useEffect } from 'react';
import { ArrowLeft, ShieldOff, UserX, Search, X } from 'lucide-react';

export interface BlockedUser {
  userId: string;
  username: string;
  avatar: string;
  blockedAt: string;
}

const STORAGE_KEY = 'vibe_blocked_users';

export function getBlockedUsers(): BlockedUser[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function blockUser(user: { userId: string; username: string; avatar: string }) {
  const current = getBlockedUsers();
  if (current.some(u => u.userId === user.userId)) return;
  const updated = [{ ...user, blockedAt: new Date().toISOString() }, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function unblockUser(userId: string) {
  const current = getBlockedUsers().filter(u => u.userId !== userId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function isUserBlocked(userId: string): boolean {
  return getBlockedUsers().some(u => u.userId === userId);
}

interface BlockedUsersPageProps {
  onBack: () => void;
}

export function BlockedUsersPage({ onBack }: BlockedUsersPageProps) {
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [search, setSearch] = useState('');
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    setBlocked(getBlockedUsers());
  }, []);

  const handleUnblock = (userId: string) => {
    setUnblockingId(userId);
    setTimeout(() => {
      unblockUser(userId);
      setBlocked(prev => prev.filter(u => u.userId !== userId));
      setUnblockingId(null);
    }, 400);
  };

  const filtered = blocked.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
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
            <div className="w-9 h-9 bg-foreground flex items-center justify-center">
              <ShieldOff size={18} className="text-background" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tight text-foreground leading-none">Blocked Users</h1>
              <p className="text-[10px] font-mono font-bold text-foreground/40">{blocked.length} BLOCKED</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      {blocked.length > 0 && (
        <div className="shrink-0 px-4 py-3 border-b-2 border-foreground/10">
          <div className="flex items-center gap-2 border-4 border-foreground bg-background px-3 py-2 shadow-[3px_3px_0px_0px_var(--foreground)] focus-within:shadow-none focus-within:translate-x-[3px] focus-within:translate-y-[3px] transition-all">
            <Search size={16} className="text-foreground/40 shrink-0" strokeWidth={3} />
            <input
              type="text"
              placeholder="Search blocked users..."
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
      )}

      <div className="flex-1 overflow-y-auto">
        {blocked.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-20 h-20 bg-foreground flex items-center justify-center mb-4 shadow-[6px_6px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)]">
              <ShieldOff size={36} className="text-background" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black uppercase text-foreground mb-2">No blocked users</h2>
            <p className="text-sm font-bold text-foreground/50">
              Accounts you block won't be able to interact with you or see your posts.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-8">
            <UserX size={40} className="text-foreground/20 mb-3" strokeWidth={1.5} />
            <p className="font-black text-foreground/40 uppercase">No results for "{search}"</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-foreground/10">
            {filtered.map((user) => (
              <div
                key={user.userId}
                className={`flex items-center gap-3 px-4 py-4 transition-all ${unblockingId === user.userId ? 'opacity-30 scale-95' : 'opacity-100'}`}
              >
                <div className="w-12 h-12 border-2 border-foreground overflow-hidden bg-foreground/10 shrink-0">
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover grayscale" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm uppercase text-foreground truncate">@{user.username}</p>
                  <p className="text-[10px] font-mono text-foreground/40">
                    Blocked {new Date(user.blockedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleUnblock(user.userId)}
                  disabled={!!unblockingId}
                  className="shrink-0 px-4 py-2 border-2 border-foreground bg-background text-foreground text-xs font-black uppercase shadow-[3px_3px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all active:scale-95 disabled:opacity-40"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="shrink-0 px-4 py-4 border-t-4 border-foreground/10">
        <p className="text-[10px] font-mono font-bold text-foreground/30 text-center leading-relaxed">
          Blocked users can't see your profile, posts, or stories. They won't know they've been blocked.
        </p>
      </div>
    </div>
  );
}
