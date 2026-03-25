import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface FeatureShowcaseProps {
  onClose: () => void;
}

const FEATURE_SLIDES = [
  {
    title: '📝 Draft Posts',
    description: 'Never lose your work! Auto-save keeps your content safe while you create.',
    emoji: '✍️',
    color: 'from-blue-400 to-blue-600',
  },
  {
    title: '📅 Schedule Posts',
    description: 'Plan ahead! Schedule your posts up to 30 days in advance.',
    emoji: '⏰',
    color: 'from-purple-400 to-purple-600',
  },
  {
    title: '⭐ Story Highlights',
    description: 'Keep your best stories forever with custom highlight collections.',
    emoji: '💫',
    color: 'from-pink-400 to-pink-600',
  },
  {
    title: '✓ Verified Badges',
    description: 'Get recognized! Blue checkmark shows you\'re the real deal.',
    emoji: '✓',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    title: '# Hashtags',
    description: 'Follow topics you love and discover content that matters to you.',
    emoji: '#️⃣',
    color: 'from-green-400 to-green-600',
  },
  {
    title: '🎨 Photo Filters',
    description: '6 stunning filters + 4 camera eras (2020s → 1990s) with film grain & vignette!',
    emoji: '🖼️',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    title: '🎬 GIF Support',
    description: 'Add personality with GIFs! Powered by GIPHY with trending picks.',
    emoji: '🎭',
    color: 'from-red-400 to-red-600',
  },
  {
    title: '🎤 Voice Notes',
    description: 'Send voice messages in DMs for a more personal touch.',
    emoji: '🗣️',
    color: 'from-indigo-400 to-indigo-600',
  },
  {
    title: '📊 Post Insights',
    description: 'See views, reach, saves, shares, and engagement rate for every post.',
    emoji: '📈',
    color: 'from-cyan-400 to-cyan-600',
  },
  {
    title: '👁️ Story Views',
    description: 'See exactly who viewed your stories with timestamps.',
    emoji: '👀',
    color: 'from-purple-400 to-pink-500',
  },
  {
    title: '🚫 Block & Mute',
    description: 'Take control! Block or mute users for a better experience.',
    emoji: '🛡️',
    color: 'from-gray-500 to-gray-700',
  },
  {
    title: '🔔 Notifications',
    description: 'Customize which alerts you receive. Your inbox, your rules!',
    emoji: '⚙️',
    color: 'from-orange-400 to-red-500',
  },
  {
    title: '📦 Archive Posts',
    description: 'Hide posts without deleting them. Bring them back anytime!',
    emoji: '🗄️',
    color: 'from-teal-400 to-teal-600',
  },
  {
    title: '🟢 Activity Status',
    description: 'See when friends were last active: "Active now" or "Active 5m ago"',
    emoji: '💚',
    color: 'from-green-500 to-emerald-600',
  },
  {
    title: '✨ Templates',
    description: '6 pro templates: Quote, Announcement, Collage, Before/After & more!',
    emoji: '🎨',
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: '📸 Multi-Photo',
    description: 'Upload up to 10 photos in one post. Perfect for photo dumps!',
    emoji: '🖼️',
    color: 'from-blue-400 to-purple-500',
  },
  {
    title: '💬 Story Replies',
    description: 'Reply to stories privately via DM. Start conversations!',
    emoji: '💭',
    color: 'from-pink-400 to-red-500',
  },
  {
    title: '@ Mentions',
    description: 'Tag friends in your posts and give them credit!',
    emoji: '👥',
    color: 'from-indigo-400 to-purple-500',
  },
  {
    title: '🚀 Share External',
    description: 'Share to Instagram, Twitter, Facebook and beyond!',
    emoji: '🌐',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: '🚨 Report Content',
    description: 'Keep Vibe safe. Report inappropriate content instantly.',
    emoji: '⚠️',
    color: 'from-red-500 to-orange-600',
  },
];

export function FeatureShowcase({ onClose }: FeatureShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % FEATURE_SLIDES.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + FEATURE_SLIDES.length) % FEATURE_SLIDES.length);
  };

  const currentSlide = FEATURE_SLIDES[currentIndex];

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white text-black rounded-full border-4 border-foreground hover:scale-110 active:scale-95 transition-transform z-10"
        >
          <X size={24} strokeWidth={3} />
        </button>

        {/* Slide */}
        <div className="relative">
          <div className={`bg-gradient-to-br ${currentSlide.color} border-4 border-foreground p-12 text-center min-h-[400px] flex flex-col items-center justify-center animate-in zoom-in duration-300`}>
            <div className="text-8xl mb-6 animate-bounce">{currentSlide.emoji}</div>
            <h2 className="text-3xl font-black text-white uppercase mb-4 drop-shadow-lg">
              {currentSlide.title}
            </h2>
            <p className="text-white text-lg font-bold drop-shadow-md max-w-md">
              {currentSlide.description}
            </p>
            
            {/* Progress Indicator */}
            <div className="mt-8 flex gap-1">
              {FEATURE_SLIDES.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full border-2 border-white transition-all ${
                    index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'
                  }`}
                />
              ))}
            </div>

            {/* Counter */}
            <div className="mt-4 text-white font-black text-sm opacity-80">
              {currentIndex + 1} of {FEATURE_SLIDES.length}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-card border-4 border-foreground flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-card border-4 border-foreground flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          >
            <ChevronRight size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-card text-foreground font-black uppercase border-4 border-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Start Using
          </button>
          <button
            onClick={goNext}
            className="flex-1 py-4 bg-foreground text-background font-black uppercase border-4 border-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Next Feature
          </button>
        </div>
      </div>
    </div>
  );
}