import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, Zap, Sparkles, X } from 'lucide-react';
import * as db from '../db';

const VIBE_CATEGORIES = [
  { id: 'travel', emoji: '✈️', label: 'Travel', color: '#3B82F6' },
  { id: 'food', emoji: '🍕', label: 'Food', color: '#F59E0B' },
  { id: 'fitness', emoji: '💪', label: 'Fitness', color: '#10B981' },
  { id: 'art', emoji: '🎨', label: 'Art', color: '#8B5CF6' },
  { id: 'music', emoji: '🎵', label: 'Music', color: '#EC4899' },
  { id: 'fashion', emoji: '👗', label: 'Fashion', color: '#F97316' },
  { id: 'tech', emoji: '💻', label: 'Tech', color: '#06B6D4' },
  { id: 'gaming', emoji: '🎮', label: 'Gaming', color: '#6366F1' },
  { id: 'nature', emoji: '🌿', label: 'Nature', color: '#22C55E' },
  { id: 'comedy', emoji: '😂', label: 'Comedy', color: '#EAB308' },
  { id: 'photography', emoji: '📸', label: 'Photography', color: '#64748B' },
  { id: 'sports', emoji: '⚽', label: 'Sports', color: '#EF4444' },
];

const SUGGESTED_USERS = [
  { id: 'user1', username: 'TravelDreamer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', bio: 'Exploring the world one vibe at a time ✈️', category: 'travel' },
  { id: 'user2', username: 'FoodieHeaven', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop', bio: 'Eating my way through life 🍕', category: 'food' },
  { id: 'user3', username: 'UrbanExplorer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', bio: 'City streets and hidden gems 🏙️', category: 'travel' },
  { id: 'user4', username: 'NaturePhotos', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', bio: 'Nature is my studio 🌿📸', category: 'nature' },
  { id: 'user5', username: 'PortraitPro', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop', bio: 'Every face tells a story 📷', category: 'photography' },
  { id: 'user6', username: 'FitnessLife', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', bio: 'No rest days, just rest weeks 💪', category: 'fitness' },
  { id: 'user7', username: 'ArtisticSoul', avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=100&h=100&fit=crop', bio: 'Paint the world with vibes 🎨', category: 'art' },
  { id: 'user8', username: 'MusicMaven', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop', bio: 'Music is the only language 🎵', category: 'music' },
];

interface OnboardingPageProps {
  onComplete: (data: { interests: string[]; followedUsers: string[]; displayName: string }) => void;
  onSkip: () => void;
  username?: string;
  currentUserId?: string;
}

export function OnboardingPage({ onComplete, onSkip, username = '', currentUserId }: OnboardingPageProps) {
  const [step, setStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [displayName, setDisplayName] = useState(username || '');
  const [bio, setBio] = useState('');

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFollow = async (userId: string) => {
    if (!currentUserId) {
      setFollowedUsers(prev => {
        const next = new Set(prev);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        return next;
      });
      return;
    }
    
    const isFollowing = followedUsers.has(userId);
    
    // Optimistic update
    setFollowedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
    
    // Save to database
    try {
      if (isFollowing) {
        await db.unfollowUser(currentUserId, userId);
      } else {
        await db.followUser(currentUserId, userId);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Rollback
      setFollowedUsers(prev => {
        const next = new Set(prev);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        return next;
      });
    }
  };

  const handleFinish = () => {
    localStorage.setItem('vibe_onboarding_complete', '1');
    if (selectedInterests.size > 0) {
      localStorage.setItem('vibe_interests', JSON.stringify([...selectedInterests]));
    }
    onComplete({
      interests: [...selectedInterests],
      followedUsers: [...followedUsers],
      displayName: displayName.trim() || username,
    });
  };

  // Filter suggested users by interests if any selected
  const suggestedUsers = selectedInterests.size > 0
    ? SUGGESTED_USERS.filter(u => selectedInterests.has(u.category))
        .concat(SUGGESTED_USERS.filter(u => !selectedInterests.has(u.category)))
    : SUGGESTED_USERS;

  const steps = [
    {
      title: 'PICK YOUR VIBES',
      subtitle: 'Choose what you\'re into. We\'ll fill your feed with things that actually matter to you.',
      hint: selectedInterests.size === 0 ? 'Pick at least 3' : `${selectedInterests.size} selected`,
      hintOk: selectedInterests.size >= 3,
    },
    {
      title: 'FOLLOW SOME PEOPLE',
      subtitle: 'Start with a few creators. You can always find more later.',
      hint: followedUsers.size === 0 ? 'Follow a few to get started' : `Following ${followedUsers.size}`,
      hintOk: followedUsers.size >= 1,
    },
    {
      title: 'YOU\'RE ALMOST IN',
      subtitle: 'Set your display name so people know who you are.',
      hint: '',
      hintOk: true,
    },
  ];

  const currentStep = steps[step];
  const canAdvance = step === 0 ? selectedInterests.size >= 3 : step === 1 ? true : displayName.trim().length >= 2;

  return (
    <div className="absolute inset-0 z-[200] bg-background flex flex-col overflow-hidden">
      {/* Progress bar */}
      <div className="shrink-0 h-1.5 bg-foreground/10 relative">
        <div
          className="h-full bg-foreground transition-all duration-500"
          style={{ width: `${((step + 1) / 3) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-foreground flex items-center justify-center">
            <Zap size={16} className="text-background" fill="currentColor" />
          </div>
          <span className="font-black text-lg uppercase tracking-tight text-foreground">Vibe</span>
        </div>
        <button
          onClick={onSkip}
          className="text-xs font-black text-foreground/40 uppercase tracking-widest hover:text-foreground/70 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Step indicator */}
      <div className="shrink-0 px-5 pb-2 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 transition-all duration-300 ${i <= step ? 'bg-foreground' : 'bg-foreground/15'}`}
          />
        ))}
      </div>

      {/* Title block */}
      <div className="shrink-0 px-5 pt-3 pb-5">
        <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground leading-none mb-2">
          {currentStep.title}
        </h1>
        <p className="text-sm font-bold text-foreground/60 leading-snug">
          {currentStep.subtitle}
        </p>
        {currentStep.hint && (
          <div className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1 border-2 border-foreground text-xs font-black uppercase ${currentStep.hintOk ? 'bg-foreground text-background' : 'bg-background text-foreground'}`}>
            {currentStep.hintOk && <Check size={10} strokeWidth={4} />}
            {currentStep.hint}
          </div>
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">

        {/* STEP 0: INTERESTS */}
        {step === 0 && (
          <div className="grid grid-cols-3 gap-3">
            {VIBE_CATEGORIES.map((cat) => {
              const selected = selectedInterests.has(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleInterest(cat.id)}
                  className={`relative flex flex-col items-center justify-center gap-2 p-4 border-4 border-foreground transition-all active:scale-95 ${
                    selected
                      ? 'bg-foreground text-background shadow-none translate-x-[3px] translate-y-[3px]'
                      : 'bg-background text-foreground shadow-[4px_4px_0px_0px_var(--foreground)] hover:shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px]'
                  }`}
                >
                  {selected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center">
                      <Check size={12} strokeWidth={4} />
                    </div>
                  )}
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-[11px] font-black uppercase tracking-wider">{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 1: FOLLOW PEOPLE */}
        {step === 1 && (
          <div className="space-y-3">
            {suggestedUsers.map((user) => {
              const following = followedUsers.has(user.id);
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 border-4 border-foreground bg-background shadow-[4px_4px_0px_0px_var(--foreground)]"
                >
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-12 h-12 object-cover border-2 border-foreground shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm uppercase text-foreground truncate">@{user.username}</p>
                    <p className="text-xs font-bold text-foreground/50 truncate">{user.bio}</p>
                  </div>
                  <button
                    onClick={() => toggleFollow(user.id)}
                    className={`shrink-0 px-4 py-2 border-2 border-foreground text-xs font-black uppercase transition-all active:scale-95 ${
                      following
                        ? 'bg-foreground text-background shadow-none translate-x-[2px] translate-y-[2px]'
                        : 'bg-background text-foreground shadow-[3px_3px_0px_0px_var(--foreground)] hover:shadow-[1px_1px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px]'
                    }`}
                  >
                    {following ? '✓ Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 2: PROFILE SETUP */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-foreground/50 tracking-widest">Display Name</label>
              <div className="border-4 border-foreground bg-background shadow-[4px_4px_0px_0px_var(--foreground)] focus-within:shadow-none focus-within:translate-x-[4px] focus-within:translate-y-[4px] transition-all">
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name..."
                  maxLength={30}
                  className="w-full bg-transparent px-4 py-3 text-foreground font-black text-lg outline-none placeholder:text-foreground/25"
                />
              </div>
              <p className="text-xs font-mono font-bold text-foreground/30">{displayName.length}/30 CHARS</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-foreground/50 tracking-widest">Bio <span className="text-foreground/25">(optional)</span></label>
              <div className="border-4 border-foreground bg-background shadow-[4px_4px_0px_0px_var(--foreground)] focus-within:shadow-none focus-within:translate-x-[4px] focus-within:translate-y-[4px] transition-all">
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell the world what you're about..."
                  maxLength={150}
                  rows={4}
                  className="w-full bg-transparent px-4 py-3 text-foreground font-bold text-sm outline-none placeholder:text-foreground/25 resize-none"
                />
              </div>
              <p className="text-xs font-mono font-bold text-foreground/30">{bio.length}/150 CHARS</p>
            </div>

            {/* Summary */}
            <div className="border-4 border-foreground bg-foreground/5 p-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-foreground/50">YOUR SETUP</p>
              <div className="flex items-center gap-2 flex-wrap">
                {[...selectedInterests].map(id => {
                  const cat = VIBE_CATEGORIES.find(c => c.id === id);
                  return cat ? (
                    <span key={id} className="px-2 py-0.5 bg-foreground text-background text-xs font-black border border-foreground">
                      {cat.emoji} {cat.label}
                    </span>
                  ) : null;
                })}
                {selectedInterests.size === 0 && (
                  <span className="text-xs font-bold text-foreground/40">No interests selected</span>
                )}
              </div>
              {followedUsers.size > 0 && (
                <p className="text-xs font-bold text-foreground/60">
                  <span className="font-black text-foreground">{followedUsers.size}</span> people to follow
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="shrink-0 px-5 pb-8 pt-4 border-t-4 border-foreground/10">
        {step < 2 ? (
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-none px-5 py-4 border-4 border-foreground bg-background text-foreground font-black uppercase shadow-[4px_4px_0px_0px_var(--foreground)] hover:shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:scale-95"
              >
                Back
              </button>
            )}
            <button
              onClick={() => canAdvance ? setStep(s => s + 1) : undefined}
              disabled={!canAdvance}
              className={`flex-1 flex items-center justify-center gap-2 py-4 border-4 border-foreground font-black uppercase text-lg transition-all active:scale-95 ${
                canAdvance
                  ? 'bg-foreground text-background shadow-[4px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_40%,transparent)] hover:shadow-[2px_2px_0px_0px_color-mix(in_srgb,var(--foreground)_40%,transparent)] hover:translate-x-[2px] hover:translate-y-[2px]'
                  : 'bg-foreground/20 text-foreground/30 cursor-not-allowed shadow-none'
              }`}
            >
              Next <ArrowRight size={20} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleFinish}
            disabled={!canAdvance}
            className={`w-full flex items-center justify-center gap-2 py-4 border-4 border-foreground font-black uppercase text-xl transition-all active:scale-95 ${
              canAdvance
                ? 'bg-foreground text-background shadow-[4px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_40%,transparent)] hover:shadow-[2px_2px_0px_0px_color-mix(in_srgb,var(--foreground)_40%,transparent)] hover:translate-x-[2px] hover:translate-y-[2px]'
                : 'bg-foreground/20 text-foreground/30 cursor-not-allowed shadow-none'
            }`}
          >
            <Sparkles size={22} /> Let's Vibe!
          </button>
        )}
      </div>
    </div>
  );
}
