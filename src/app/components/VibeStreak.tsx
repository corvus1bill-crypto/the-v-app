import { useEffect, useState, useCallback } from 'react';
import { Flame } from 'lucide-react';

const STORAGE_KEY = 'vibeStreak';

function readStreak(): { count: number; lastDate: string } {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { count: data.streak || 0, lastDate: data.lastDate || '' };
  } catch {
    return { count: 0, lastDate: '' };
  }
}

/** Exported so App.tsx can call this when a post is created */
export function incrementStreak(): number {
  try {
    const today = new Date().toDateString();
    const { count, lastDate } = readStreak();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let newCount: number;
    if (lastDate === today) {
      // Already posted today — bump the count (tracks total posts in streak)
      newCount = count + 1;
    } else if (lastDate === yesterday) {
      // Consecutive day — keep building the streak
      newCount = count + 1;
    } else {
      // Missed a day (or first ever post) — start fresh
      newCount = 1;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastDate: today, streak: newCount }));
    // Notify any mounted VibeStreak component
    window.dispatchEvent(new CustomEvent('vibe-streak-update', { detail: newCount }));
    return newCount;
  } catch {
    return 1;
  }
}

export function VibeStreak() {
  const [streak, setStreak] = useState(() => readStreak().count);
  const [pop, setPop] = useState(false);

  // Listen for updates from incrementStreak() calls
  useEffect(() => {
    const handler = (e: Event) => {
      const count = (e as CustomEvent<number>).detail;
      setStreak(count);
      setPop(true);
      setTimeout(() => setPop(false), 400);
    };
    window.addEventListener('vibe-streak-update', handler);
    return () => window.removeEventListener('vibe-streak-update', handler);
  }, []);

  const handleTap = () => {
    setPop(true);
    setTimeout(() => setPop(false), 400);
  };

  const color = streak >= 30 ? '#ff0000' : streak >= 7 ? '#ff7a2e' : streak >= 3 ? '#fbbf24' : '#94a3b8';
  const label = streak === 0 ? 'Post to start your streak!' : `${streak} post streak!`;

  return (
    <button
      onClick={handleTap}
      className="flex items-center gap-1 px-2 py-1 border-2 border-foreground bg-background shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
      title={label}
    >
      <Flame
        size={16}
        fill={color}
        className="transition-colors"
        strokeWidth={2}
        style={pop ? { animation: 'heartPop 0.4s cubic-bezier(.22,.68,0,1.2)' } : {}}
        color={color}
      />
      <span className="text-xs font-black text-foreground tabular-nums">{streak}</span>
    </button>
  );
}