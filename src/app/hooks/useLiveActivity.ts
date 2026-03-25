import { useEffect, useRef, useCallback } from 'react';

export type LiveEventType = 'like' | 'comment' | 'follow' | 'message' | 'leaderboard' | 'milestone';

export interface LiveEvent {
  id: string;
  type: LiveEventType;
  username: string;
  avatar: string;
  message: string;
  emoji: string;
  timestamp: number;
}

const FAKE_USERS = [
  { username: 'TravelDreamer',    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { username: 'FoodieHeaven',     avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop' },
  { username: 'UrbanExplorer',    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
  { username: 'NaturePhotos',     avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  { username: 'PortraitPro',      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop' },
  { username: 'FitnessLife',      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
  { username: 'CoffeeLover',      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
  { username: 'ArtisticSoul',     avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=100&h=100&fit=crop' },
  { username: 'FashionDaily',     avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop' },
  { username: 'AdventureSeeker',  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
];

const EVENT_TEMPLATES: Record<LiveEventType, { messages: string[]; emoji: string }> = {
  like: {
    emoji: '❤️',
    messages: [
      'liked your photo',
      'double-tapped your post',
      'loved your latest post',
      'hearted your photo',
    ],
  },
  comment: {
    emoji: '💬',
    messages: [
      'commented: "Absolutely stunning! 🔥"',
      'commented: "This is goals 😍"',
      'commented: "So jealous right now 👀"',
      'commented: "Need this in my life 🙌"',
    ],
  },
  follow: {
    emoji: '👤',
    messages: [
      'started following you',
      'just followed you',
      'is now following you',
    ],
  },
  message: {
    emoji: '✉️',
    messages: [
      'sent you a message',
      'slid into your DMs',
      'replied to your story',
    ],
  },
  leaderboard: {
    emoji: '🏆',
    messages: [
      'Your post is trending! #3 on leaderboard',
      'You jumped to #5 on the leaderboard!',
      'Your vibe is 🔥 — top 10 this week!',
    ],
  },
  milestone: {
    emoji: '🎉',
    messages: [
      'Your post just hit 1,000 likes!',
      'You have 100 new followers today!',
      'Your story was viewed 500 times!',
      'You\'re on a 7-day streak! Keep vibing!',
    ],
  },
};

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeEvent(): LiveEvent {
  const types: LiveEventType[] = ['like', 'like', 'like', 'comment', 'follow', 'message', 'leaderboard', 'milestone'];
  const type = randomFrom(types);
  const user = randomFrom(FAKE_USERS);
  const tpl = EVENT_TEMPLATES[type];
  const message = type === 'leaderboard' || type === 'milestone'
    ? randomFrom(tpl.messages)
    : `${user.username} ${randomFrom(tpl.messages)}`;

  return {
    id: `live_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type,
    username: user.username,
    avatar: user.avatar,
    message,
    emoji: tpl.emoji,
    timestamp: Date.now(),
  };
}

interface UseLiveActivityOptions {
  onEvent: (event: LiveEvent) => void;
  minInterval?: number; // ms
  maxInterval?: number; // ms
  enabled?: boolean;
}

export function useLiveActivity({
  onEvent,
  minInterval = 6000,
  maxInterval = 18000,
  enabled = true,
}: UseLiveActivityOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const schedule = useCallback(() => {
    const delay = minInterval + Math.random() * (maxInterval - minInterval);
    timerRef.current = setTimeout(() => {
      onEventRef.current(makeEvent());
      schedule();
    }, delay);
  }, [minInterval, maxInterval]);

  useEffect(() => {
    if (!enabled) return;
    // Fire first event quickly to show it's working
    const firstDelay = 3000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      onEventRef.current(makeEvent());
      schedule();
    }, firstDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, schedule]);
}
