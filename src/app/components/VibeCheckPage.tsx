import { useState, useMemo, useRef } from 'react';
import { ArrowLeft, Smile, Heart, TrendingUp, Users, Sparkles, Send, MessageCircle, Eye, EyeOff, Flame, Image, X, ChevronDown, ChevronUp } from 'lucide-react';

const VIBES = [
  { emoji: '🔥', label: 'On Fire', color: '#EF4444', bg: '#FEE2E2' },
  { emoji: '😊', label: 'Happy', color: '#F59E0B', bg: '#FEF3C7' },
  { emoji: '😎', label: 'Cool', color: '#3B82F6', bg: '#DBEAFE' },
  { emoji: '🥳', label: 'Party', color: '#EC4899', bg: '#FCE7F3' },
  { emoji: '😴', label: 'Sleepy', color: '#8B5CF6', bg: '#EDE9FE' },
  { emoji: '🤔', label: 'Thoughtful', color: '#6B7280', bg: '#F3F4F6' },
  { emoji: '💪', label: 'Motivated', color: '#10B981', bg: '#D1FAE5' },
  { emoji: '🎨', label: 'Creative', color: '#F97316', bg: '#FFEDD5' },
  { emoji: '✈️', label: 'Wanderlust', color: '#0EA5E9', bg: '#E0F2FE' },
  { emoji: '🎵', label: 'Musical', color: '#A855F7', bg: '#F3E8FF' },
  { emoji: '😍', label: 'In Love', color: '#E11D48', bg: '#FFE4E6' },
  { emoji: '🤯', label: 'Mind Blown', color: '#7C3AED', bg: '#EDE9FE' },
  { emoji: '😤', label: 'Frustrated', color: '#DC2626', bg: '#FEE2E2' },
  { emoji: '🥰', label: 'Grateful', color: '#EC4899', bg: '#FCE7F3' },
  { emoji: '🧘', label: 'Zen', color: '#059669', bg: '#D1FAE5' },
  { emoji: '⚡', label: 'Electric', color: '#EAB308', bg: '#FEF9C3' },
];

const PROMPTS = [
  "What's one thing that made you smile today?",
  "Describe your day in 3 words",
  "What song matches your mood right now?",
  "If your vibe was a color, what would it be?",
  "What are you grateful for today?",
  "What's your hot take of the day?",
  "One word for your energy level right now:",
  "What's living rent-free in your head?",
];

interface Comment {
  id: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
}

interface VibeEntry {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  vibe: typeof VIBES[0];
  note: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  isAnonymous: boolean;
  imageUrl?: string;
  comments: Comment[];
}

const generateMockEntries = (): VibeEntry[] => [
  { id: 'v1', userId: 'user1', username: 'TravelDreamer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', vibe: VIBES[8], note: 'Just booked a flight to Tokyo! Dreams coming true', timestamp: '2m ago', likes: 42, isLiked: false, isAnonymous: false, imageUrl: 'https://images.unsplash.com/photo-1626946548234-a65fd193db41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600', comments: [
    { id: 'c1a', username: 'UrbanExplorer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', text: 'Omg take me with you!!', timestamp: '1m ago' },
    { id: 'c1b', username: 'NaturePhotos', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', text: 'Tokyo is absolutely surreal at night 🌃', timestamp: '30s ago' },
  ]},
  { id: 'v2', userId: 'user2', username: 'Anonymous', avatar: '', vibe: VIBES[4], note: "Can't stop thinking about whether hot dogs are sandwiches", timestamp: '5m ago', likes: 89, isLiked: false, isAnonymous: true, comments: [
    { id: 'c2a', username: 'FitnessLife', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', text: 'They are. Fight me.', timestamp: '3m ago' },
  ]},
  { id: 'v3', userId: 'user3', username: 'UrbanExplorer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', vibe: VIBES[0], note: 'New PR at the gym! Feeling unstoppable', timestamp: '12m ago', likes: 156, isLiked: false, isAnonymous: false, imageUrl: 'https://images.unsplash.com/photo-1585484764802-387ea30e8432?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600', comments: [] },
  { id: 'v4', userId: 'user4', username: 'Anonymous', avatar: '', vibe: VIBES[12], note: 'Why does WiFi always die during important calls?', timestamp: '18m ago', likes: 234, isLiked: false, isAnonymous: true, comments: [] },
  { id: 'v5', userId: 'user5', username: 'PortraitPro', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop', vibe: VIBES[7], note: 'Painted for 6 hours straight. Lost in the flow state', timestamp: '25m ago', likes: 67, isLiked: false, isAnonymous: false, comments: [] },
  { id: 'v6', userId: 'user6', username: 'NaturePhotos', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', vibe: VIBES[14], note: 'Morning meditation hit different today. 10/10 peace', timestamp: '30m ago', likes: 98, isLiked: false, isAnonymous: false, comments: [] },
  { id: 'v7', userId: 'user7', username: 'Anonymous', avatar: '', vibe: VIBES[10], note: 'That person smiled at me again today. I think this is it.', timestamp: '45m ago', likes: 312, isLiked: false, isAnonymous: true, comments: [
    { id: 'c7a', username: 'PortraitPro', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop', text: 'GO TALK TO THEM 😭🙏', timestamp: '40m ago' },
  ]},
  { id: 'v8', userId: 'user8', username: 'FitnessLife', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', vibe: VIBES[15], note: 'Coffee + sunrise + good music = perfect morning', timestamp: '1h ago', likes: 45, isLiked: false, isAnonymous: false, imageUrl: 'https://images.unsplash.com/photo-1662038271111-5b1c0b4157e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600', comments: [] },
];

interface VibeCheckPageProps {
  onBack: () => void;
  currentUserId: string;
  userProfile: { name: string; username: string; avatar: string };
  onViewProfile?: (userId: string) => void;
}

export function VibeCheckPage({ onBack, currentUserId, userProfile, onViewProfile }: VibeCheckPageProps) {
  const [activeTab, setActiveTab] = useState<'checkin' | 'pulse' | 'confessions'>('checkin');
  const [selectedVibe, setSelectedVibe] = useState<typeof VIBES[0] | null>(null);
  const [vibeNote, setVibeNote] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(() => {
    const today = new Date().toDateString();
    return localStorage.getItem('vibe_checkin_date') === today;
  });
  const [entries, setEntries] = useState<VibeEntry[]>(generateMockEntries);
  const [vibeStreak, setVibeStreak] = useState(() => {
    return parseInt(localStorage.getItem('vibe_check_streak') || '0');
  });
  const [showSubmitAnim, setShowSubmitAnim] = useState(false);
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [postImage, setPostImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dailyPrompt = useMemo(() => {
    const dayIndex = new Date().getDay();
    return PROMPTS[dayIndex % PROMPTS.length];
  }, []);

  // Community pulse data
  const communityPulse = useMemo(() => {
    const vibeCounts: Record<string, number> = {};
    entries.forEach(e => {
      vibeCounts[e.vibe.emoji] = (vibeCounts[e.vibe.emoji] || 0) + 1;
    });
    const total = entries.length || 1;
    return VIBES.slice(0, 8).map(v => ({
      ...v,
      count: vibeCounts[v.emoji] || Math.floor(Math.random() * 30) + 5,
      percentage: Math.round(((vibeCounts[v.emoji] || Math.floor(Math.random() * 30) + 5) / (total + 50)) * 100),
    })).sort((a, b) => b.count - a.count);
  }, [entries]);

  const handleSubmitVibe = () => {
    if (!selectedVibe) return;
    setShowSubmitAnim(true);
    
    const newEntry: VibeEntry = {
      id: `v-${Date.now()}`,
      userId: currentUserId,
      username: isAnonymous ? 'Anonymous' : userProfile.username,
      avatar: isAnonymous ? '' : userProfile.avatar,
      vibe: selectedVibe,
      note: vibeNote || dailyPrompt,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
      isAnonymous,
      imageUrl: postImage,
      comments: [],
    };

    setEntries(prev => [newEntry, ...prev]);
    setHasCheckedIn(true);
    setVibeStreak(prev => prev + 1);
    localStorage.setItem('vibe_checkin_date', new Date().toDateString());
    localStorage.setItem('vibe_check_streak', String(vibeStreak + 1));

    setTimeout(() => {
      setShowSubmitAnim(false);
      setActiveTab('pulse');
    }, 1200);
  };

  const handleLike = (entryId: string) => {
    setEntries(prev => prev.map(e => 
      e.id === entryId 
        ? { ...e, isLiked: !e.isLiked, likes: e.isLiked ? e.likes - 1 : e.likes + 1 }
        : e
    ));
  };

  const handleAddComment = (entryId: string) => {
    const text = commentDrafts[entryId]?.trim();
    if (!text) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      username: userProfile.username,
      avatar: userProfile.avatar,
      text,
      timestamp: 'Just now',
    };
    setEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, comments: [...e.comments, newComment] } : e
    ));
    setCommentDrafts(prev => ({ ...prev, [entryId]: '' }));
    setShowComments(prev => ({ ...prev, [entryId]: true }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPostImage(url);
  };

  const formatNumber = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n);

  return (
    <div className="h-full flex flex-col bg-card scrollbar-hide">
      {/* Header */}
      <div className="shrink-0 z-40 bg-background border-b-4 border-foreground px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 bg-card border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all active:scale-95">
              <ArrowLeft size={20} strokeWidth={3} />
            </button>
            <div>
              <h1 className="text-lg font-black text-foreground uppercase italic tracking-tight leading-none">Vibe Check</h1>
              <p className="text-[9px] font-mono font-bold text-foreground/50 uppercase">How's the community feeling?</p>
            </div>
          </div>
          {vibeStreak > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-foreground text-background border-2 border-foreground shadow-[2px_2px_0px_0px_var(--background)]" style={{ animation: 'fadeSlideUp 0.4s ease both' }}>
              <Flame size={14} strokeWidth={3} />
              <span className="text-xs font-black">{vibeStreak}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {[
            { id: 'checkin' as const, label: 'Check In', icon: <Smile size={14} strokeWidth={3} /> },
            { id: 'pulse' as const, label: 'Pulse', icon: <TrendingUp size={14} strokeWidth={3} /> },
            { id: 'confessions' as const, label: 'Thoughts', icon: <MessageCircle size={14} strokeWidth={3} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black uppercase transition-all active:scale-95 border-2 border-foreground ${
                activeTab === tab.id 
                  ? 'bg-foreground text-background shadow-none translate-x-[1px] translate-y-[1px]' 
                  : 'bg-card text-foreground shadow-[2px_2px_0px_0px_var(--foreground)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit animation overlay */}
      {showSubmitAnim && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center" style={{ animation: 'fade-in 0.3s ease' }}>
          <div className="text-center" style={{ animation: 'scaleIn 0.5s cubic-bezier(.22,.68,0,1.2) both' }}>
            <div className="text-8xl mb-4" style={{ animation: 'heartPop 0.6s ease both 0.2s' }}>{selectedVibe?.emoji}</div>
            <p className="text-2xl font-black text-white uppercase">Vibe Logged!</p>
            <p className="text-sm font-mono text-white/60 mt-2">Streak: {vibeStreak + 1} days</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-24">
        {/* CHECK IN TAB */}
        {activeTab === 'checkin' && (
          <div className="p-4 space-y-5" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
            {hasCheckedIn ? (
              <div className="border-4 border-foreground bg-background/10 p-6 shadow-[6px_6px_0px_0px_var(--foreground)] text-center">
                <div className="text-5xl mb-3" style={{ animation: 'heartPop 0.5s ease both' }}>✅</div>
                <p className="text-lg font-black text-foreground uppercase">You've checked in today!</p>
                <p className="text-xs font-mono text-foreground/60 mt-1">Come back tomorrow to keep your streak going</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Flame size={18} className="text-[#ff7a2e]" />
                  <span className="text-xl font-black text-foreground">{vibeStreak} day streak</span>
                </div>
              </div>
            ) : (
              <>
                {/* Daily prompt */}

                {/* Vibe selector */}
                <div>
                  <p className="text-xs font-black text-black uppercase mb-3">How are you vibing?</p>
                  <div className="grid grid-cols-4 gap-2">
                    {VIBES.map((vibe, i) => (
                      <button
                        key={vibe.label}
                        onClick={() => setSelectedVibe(vibe)}
                        className={`flex flex-col items-center p-3 border-3 transition-all active:scale-90 ${
                          selectedVibe?.label === vibe.label
                            ? 'border-black bg-black shadow-none translate-x-[2px] translate-y-[2px]'
                            : 'border-foreground bg-card shadow-[3px_3px_0px_0px_var(--foreground)] hover:shadow-[1px_1px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px]'
                        }`}
                        style={{ 
                          animation: `fadeSlideUp 0.3s ease ${i * 40}ms both`,
                          borderWidth: '3px',
                        }}
                      >
                        <span className="text-2xl">{vibe.emoji}</span>
                        <span className={`text-[8px] font-black uppercase mt-1 ${selectedVibe?.label === vibe.label ? 'text-background' : 'text-foreground/60'}`}>{vibe.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note input */}
                {selectedVibe && (
                  <div style={{ animation: 'scaleIn 0.2s ease both' }}>
                    <p className="text-xs font-black text-foreground uppercase mb-2">Add a thought (optional)</p>
                    <textarea
                      value={vibeNote}
                      onChange={(e) => setVibeNote(e.target.value)}
                      placeholder="What's on your mind..."
                      maxLength={200}
                      className="w-full p-3 border-3 border-foreground bg-card font-mono font-bold text-sm resize-none outline-none placeholder:text-foreground/30 focus:shadow-[4px_4px_0px_0px_var(--foreground)] transition-shadow"
                      style={{ borderWidth: '3px' }}
                      rows={3}
                    />

                    {/* Image upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    {postImage ? (
                      <div className="relative mt-2 border-3 border-foreground overflow-hidden" style={{ borderWidth: '3px' }}>
                        <img src={postImage} alt="Post preview" className="w-full h-40 object-cover" />
                        <button
                          onClick={() => setPostImage(null)}
                          className="absolute top-2 right-2 w-7 h-7 bg-foreground text-background border-2 border-background flex items-center justify-center active:scale-90"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full mt-2 py-2.5 border-2 border-dashed border-foreground/40 flex items-center justify-center gap-2 text-xs font-black text-foreground/40 uppercase hover:border-foreground hover:text-foreground transition-colors active:scale-[0.98]"
                      >
                        <Image size={14} strokeWidth={2.5} />
                        Add a photo
                      </button>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        className={`flex items-center gap-2 px-3 py-1.5 border-2 border-foreground text-xs font-black uppercase transition-all active:scale-95 ${
                          isAnonymous ? 'bg-foreground text-background' : 'bg-card text-foreground'
                        }`}
                      >
                        {isAnonymous ? <EyeOff size={12} /> : <Eye size={12} />}
                        {isAnonymous ? 'Anonymous' : 'Public'}
                      </button>
                      <span className="text-[10px] font-mono text-foreground/40">{vibeNote.length}/200</span>
                    </div>
                  </div>
                )}

                {/* Submit */}
                {selectedVibe && (
                  <button
                    onClick={handleSubmitVibe}
                    className="w-full py-4 bg-background border-4 border-foreground text-foreground font-black uppercase text-lg shadow-[6px_6px_0px_0px_var(--foreground)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_var(--foreground)] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                    style={{ animation: 'scaleIn 0.2s ease both' }}
                  >
                    <Send size={20} strokeWidth={3} />
                    Drop Your Vibe
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* PULSE TAB */}
        {activeTab === 'pulse' && (
          <div className="p-4 space-y-5" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
            {/* Community Mood Ring */}
            <div className="border-4 border-foreground bg-card p-5 shadow-[6px_6px_0px_0px_var(--foreground)]">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} strokeWidth={3} className="text-[#ff7a2e]" />
                <h2 className="text-sm font-black text-foreground uppercase">Community Pulse</h2>
                <span className="ml-auto text-[10px] font-mono text-foreground/40 uppercase">Live</span>
                <span className="w-2 h-2 bg-green-500 rounded-full" style={{ animation: 'heartPop 1.5s ease infinite' }} />
              </div>
              
              {communityPulse.slice(0, 6).map((v, i) => (
                <div key={v.label} className="flex items-center gap-3 mb-3" style={{ animation: `fadeSlideUp 0.3s ease ${i * 80}ms both` }}>
                  <span className="text-xl w-8 text-center">{v.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-black text-foreground uppercase">{v.label}</span>
                      <span className="text-[10px] font-mono font-bold text-foreground/50">{v.count} vibes</span>
                    </div>
                    <div className="h-3 bg-foreground/10 border-2 border-foreground overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${Math.min(v.percentage * 2, 100)}%`, 
                          backgroundColor: v.color,
                          animation: `fadeSlideUp 0.6s ease ${i * 100}ms both`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Today's Vibe Weather */}
            <div className="border-4 border-foreground bg-gradient-to-br from-background to-background/80 p-5 shadow-[4px_4px_0px_0px_var(--foreground)]">
              <p className="text-[10px] font-black text-foreground/60 uppercase mb-2">Today's Vibe Weather</p>
              <div className="flex items-center gap-4">
                <div className="text-5xl" style={{ animation: 'crownFloat 3s ease infinite' }}>
                  {communityPulse[0]?.emoji || '🔥'}
                </div>
                <div>
                  <p className="text-xl font-black text-foreground uppercase">{communityPulse[0]?.label || 'On Fire'}</p>
                  <p className="text-xs font-mono font-bold text-foreground/70">The community is feeling {communityPulse[0]?.label?.toLowerCase() || 'great'} today</p>
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="border-4 border-foreground bg-card p-4 shadow-[4px_4px_0px_0px_var(--foreground)]">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} strokeWidth={3} />
                <span className="text-xs font-black text-foreground uppercase">247 people vibing right now</span>
              </div>
              <div className="flex -space-x-2">
                {entries.filter(e => !e.isAnonymous).slice(0, 8).map((e, i) => (
                  <button
                    key={e.id}
                    onClick={() => onViewProfile?.(e.userId)}
                    className="w-9 h-9 border-2 border-foreground bg-foreground overflow-hidden hover:scale-110 hover:z-10 transition-transform"
                    style={{ animation: `fadeSlideUp 0.3s ease ${i * 60}ms both` }}
                  >
                    <img src={e.avatar} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                <div className="w-9 h-9 border-2 border-foreground bg-foreground text-background flex items-center justify-center text-[10px] font-black">
                  +239
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONFESSIONS/THOUGHTS TAB */}
        {activeTab === 'confessions' && (
          <div className="p-4 space-y-3" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle size={16} strokeWidth={3} />
              <h2 className="text-sm font-black text-foreground uppercase">Community Thoughts</h2>
            </div>

            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className="border-3 border-foreground bg-card shadow-[3px_3px_0px_0px_var(--foreground)] overflow-hidden hover:shadow-[1px_1px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                style={{ animation: `fadeSlideUp 0.3s ease ${i * 60}ms both`, borderWidth: '3px' }}
              >
                <div className="flex items-start gap-3 p-3">
                  {/* Avatar or Anonymous */}
                  {entry.isAnonymous ? (
                    <div className="w-10 h-10 border-2 border-foreground bg-foreground/10 flex items-center justify-center shrink-0">
                      <EyeOff size={16} className="text-foreground/40" />
                    </div>
                  ) : (
                    <button 
                      onClick={() => onViewProfile?.(entry.userId)}
                      className="w-10 h-10 border-2 border-foreground bg-foreground overflow-hidden shrink-0 hover:scale-105 transition-transform"
                    >
                      <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                    </button>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-foreground uppercase truncate">
                        {entry.isAnonymous ? 'Anonymous' : entry.username}
                      </span>
                      <span className="text-lg leading-none">{entry.vibe.emoji}</span>
                      <span className="ml-auto text-[9px] font-mono text-foreground/40 shrink-0">{entry.timestamp}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground/80 leading-snug">{entry.note}</p>
                    {entry.imageUrl && (
                      <div className="mt-2">
                        <img src={entry.imageUrl} alt="" className="w-full h-auto object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Like bar */}
                <div className="flex items-center justify-between px-3 py-2 border-t-2 border-foreground/10" style={{ borderTopWidth: '2px' }}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleLike(entry.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 text-xs font-black uppercase transition-all active:scale-90 ${
                        entry.isLiked ? 'text-[#ff7a2e]' : 'text-black/40 hover:text-black'
                      }`}
                    >
                      <Heart size={14} strokeWidth={3} fill={entry.isLiked ? '#ff7a2e' : 'none'} />
                      {formatNumber(entry.likes)}
                    </button>
                    <button
                      onClick={() => setShowComments(prev => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                      className={`flex items-center gap-1.5 px-2 py-1 text-xs font-black uppercase transition-all active:scale-90 ${
                        showComments[entry.id] ? 'text-foreground' : 'text-black/40 hover:text-black'
                      }`}
                    >
                      <MessageCircle size={14} strokeWidth={3} />
                      {entry.comments.length > 0 ? entry.comments.length : ''}
                    </button>
                  </div>
                  <div className="px-2 py-1 text-[9px] font-mono font-bold text-black/30 uppercase" style={{ backgroundColor: entry.vibe.bg }}>
                    {entry.vibe.label}
                  </div>
                </div>

                {/* Comments section */}
                {showComments[entry.id] && (
                  <div className="border-t-2 border-foreground/10" style={{ borderTopWidth: '2px' }}>
                    {/* Existing comments */}
                    {entry.comments.length > 0 && (
                      <div className="px-3 pt-3 space-y-3">
                        {entry.comments.map(comment => (
                          <div key={comment.id} className="flex items-start gap-2">
                            <div className="w-7 h-7 border-2 border-foreground bg-foreground overflow-hidden shrink-0">
                              <img src={comment.avatar} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 bg-foreground/5 border border-foreground/20 px-2 py-1.5">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-black text-foreground uppercase truncate">{comment.username}</span>
                                <span className="ml-auto text-[9px] font-mono text-foreground/30 shrink-0">{comment.timestamp}</span>
                              </div>
                              <p className="text-xs font-bold text-foreground/80 leading-snug">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Comment input */}
                    <div className="flex items-center gap-2 px-3 py-2">
                      <div className="w-7 h-7 border-2 border-foreground bg-foreground overflow-hidden shrink-0">
                        <img src={userProfile.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <input
                        type="text"
                        value={commentDrafts[entry.id] || ''}
                        onChange={e => setCommentDrafts(prev => ({ ...prev, [entry.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(entry.id)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-foreground/5 border-2 border-foreground/20 px-2 py-1 text-xs font-bold font-mono outline-none focus:border-foreground placeholder:text-foreground/30 transition-colors"
                      />
                      <button
                        onClick={() => handleAddComment(entry.id)}
                        disabled={!commentDrafts[entry.id]?.trim()}
                        className="w-7 h-7 bg-foreground text-background border-2 border-foreground flex items-center justify-center active:scale-90 disabled:opacity-30 transition-all"
                      >
                        <Send size={11} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}