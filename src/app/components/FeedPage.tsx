import { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Share2, Bookmark, X, Loader2, User, UserPlus, PlayCircle, Home } from "lucide-react";

interface FeedItem {
  id: number;
  imageUrl: string;
  title: string;
  author: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

// Initial feed data
const initialFeedData: FeedItem[] = [
  {
    id: 1,
    imageUrl: "https://images.unsplash.com/photo-1617634667039-8e4cb277ab46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW5kc2NhcGUlMjBuYXR1cmV8ZW58MXx8fHwxNzY4OTgzNDA3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Mountain Serenity",
    author: "TravelDreamer",
    likes: 1234,
    comments: 89,
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 2,
    imageUrl: "https://images.unsplash.com/photo-1617381519460-d87050ddeb92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc2OTA0NjMyM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Urban Dreams",
    author: "CityScapes",
    likes: 2456,
    comments: 134,
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 3,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzY4OTgxNDE2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Culinary Art",
    author: "FoodieLife",
    likes: 3890,
    comments: 256,
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 4,
    imageUrl: "https://images.unsplash.com/photo-1708426238272-994fcddabca4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBlcnNvbnxlbnwxfHx8fDE3NjkwMTI0NjF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Human Stories",
    author: "PortraitMaster",
    likes: 1678,
    comments: 92,
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 5,
    imageUrl: "https://images.unsplash.com/photo-1615184697985-c9bde1b07da7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGFydHxlbnwxfHx8fDE3NjkwMzEwMzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Abstract Vision",
    author: "ArtisticMind",
    likes: 4521,
    comments: 301,
    isLiked: false,
    isBookmarked: false,
  },
];

// Additional images that will be loaded
const additionalImages = [
  {
    imageUrl: "https://images.unsplash.com/photo-1528543606781-2f6e6857f318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBhZHZlbnR1cmV8ZW58MXx8fHwxNzY5MDQyOTAyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Adventure Awaits",
    author: "Wanderlust",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvY2VhbiUyMGJlYWNofGVufDF8fHx8MTc2OTAwMzg3MHww&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Ocean Bliss",
    author: "BeachVibes",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1519414442781-fbd745c5b497?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMHN1bnNldHxlbnwxfHx8fDE3NjkwNjA3Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Golden Hour",
    author: "SunsetChaser",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1518757944516-6f13049afe50?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBsaWZlc3R5bGV8ZW58MXx8fHwxNzY5MDI5MjMxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Coffee Break",
    author: "CaffeineLover",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1610664840481-10b7b43c9283?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwbW9kZXJufGVufDF8fHx8MTc2OTAwMDU1M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    title: "Digital Future",
    author: "TechVision",
  },
];

interface FeedPageProps {
  onClose?: () => void;
}

export function FeedPage({ onClose }: FeedPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>(initialFeedData);
  const [isLoading, setIsLoading] = useState(false);
  const [nextIdCounter, setNextIdCounter] = useState(initialFeedData.length + 1);
  const [additionalImageIndex, setAdditionalImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'feed' | 'messages' | 'follow' | 'stories' | 'profile'>('feed');
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  // Load more images when approaching the end
  useEffect(() => {
    if (currentIndex >= feedItems.length - 2 && !isLoading && additionalImageIndex < additionalImages.length) {
      loadMoreImages();
    }
  }, [currentIndex, isLoading, additionalImageIndex]);

  const loadMoreImages = async () => {
    setIsLoading(true);
    
    // Simulate loading delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const newImages: FeedItem[] = [];
    const remainingImages = additionalImages.slice(additionalImageIndex);
    const imagesToLoad = remainingImages.slice(0, 3); // Load 3 images at a time
    
    imagesToLoad.forEach((img, index) => {
      newImages.push({
        id: nextIdCounter + index,
        imageUrl: img.imageUrl,
        title: img.title,
        author: img.author,
        likes: Math.floor(Math.random() * 5000) + 500,
        comments: Math.floor(Math.random() * 300) + 50,
        isLiked: false,
        isBookmarked: false,
      });
    });
    
    if (newImages.length > 0) {
      setFeedItems((prev) => [...prev, ...newImages]);
      setNextIdCounter((prev) => prev + newImages.length);
      setAdditionalImageIndex((prev) => prev + imagesToLoad.length);
    }
    
    setIsLoading(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Apply drag offset with some resistance for smoother feel
    setDragOffset(diff * 0.6);
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = startY.current - currentY.current;
    
    // REVERSED: Swipe up (diff is positive) = go to next
    if (diff > 50 && currentIndex < feedItems.length - 1) {
      goToNext();
    }
    // REVERSED: Swipe down (diff is negative) = go to previous
    else if (diff < -50 && currentIndex > 0) {
      goToPrevious();
    }
    
    setDragOffset(0);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isTransitioning) return;
    
    if (e.deltaY > 0 && currentIndex < feedItems.length - 1) {
      goToNext();
    } else if (e.deltaY < 0 && currentIndex > 0) {
      goToPrevious();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY;
    isDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    currentY.current = e.clientY;
    setDragOffset(currentY.current - startY.current);
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = startY.current - currentY.current;
    
    // REVERSED: Swipe up (diff is positive) = go to next
    if (diff > 50 && currentIndex < feedItems.length - 1) {
      goToNext();
    }
    // REVERSED: Swipe down (diff is negative) = go to previous
    else if (diff < -50 && currentIndex > 0) {
      goToPrevious();
    }
    setDragOffset(0);
  };

  const goToNext = () => {
    if (isTransitioning || currentIndex >= feedItems.length - 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToPrevious = () => {
    if (isTransitioning || currentIndex <= 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const toggleLike = (id: number) => {
    setFeedItems((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              isLiked: !item.isLiked,
              likes: item.isLiked ? item.likes - 1 : item.likes + 1,
            }
          : item
      )
    );
  };

  const toggleBookmark = (id: number) => {
    setFeedItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
      )
    );
  };

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden relative bg-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 bg-accent rounded-full flex items-center justify-center hover:bg-accent/90 transition-colors"
        >
          <X className="text-accent-foreground" size={20} />
        </button>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-accent/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
          <Loader2 className="text-accent-foreground animate-spin" size={16} />
          <span className="text-accent-foreground text-sm">Loading more...</span>
        </div>
      )}

      {/* Feed Items */}
      <div
        className={`h-full ${isDragging.current ? '' : 'transition-transform duration-500 ease-out'}`}
        style={{
          transform: `translateY(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
        }}
      >
        {feedItems.map((item, index) => (
          <div
            key={item.id}
            className="h-full w-full relative overflow-hidden"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 pb-24">
              <h2 className="text-3xl md:text-5xl mb-2 text-white">
                {item.title}
              </h2>
              <p className="text-lg text-white/90 mb-1">@{item.author}</p>
              <p className="text-sm text-white/70">Photo #{item.id}</p>
            </div>

            {/* Action Buttons (Right Side) */}
            <div className="absolute right-4 bottom-32 flex flex-col gap-6 z-10">
              <button
                onClick={() => toggleLike(item.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    item.isLiked
                      ? "bg-accent"
                      : "bg-white/20 backdrop-blur-sm hover:bg-accent"
                  }`}
                >
                  <Heart
                    className={`transition-colors ${
                      item.isLiked
                        ? "text-accent-foreground fill-current"
                        : "text-white group-hover:text-accent-foreground"
                    }`}
                    size={24}
                  />
                </div>
                <span className="text-sm text-white font-medium">
                  {item.likes}
                </span>
              </button>

              <button className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors">
                  <MessageCircle
                    className="text-white group-hover:text-accent-foreground"
                    size={24}
                  />
                </div>
                <span className="text-sm text-white font-medium">
                  {item.comments}
                </span>
              </button>

              <button className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors">
                  <Share2
                    className="text-white group-hover:text-accent-foreground"
                    size={24}
                  />
                </div>
              </button>

              <button
                onClick={() => toggleBookmark(item.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    item.isBookmarked
                      ? "bg-accent"
                      : "bg-white/20 backdrop-blur-sm hover:bg-accent"
                  }`}
                >
                  <Bookmark
                    className={`transition-colors ${
                      item.isBookmarked
                        ? "text-accent-foreground fill-current"
                        : "text-white group-hover:text-accent-foreground"
                    }`}
                    size={24}
                  />
                </div>
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
              {feedItems.slice(0, Math.min(feedItems.length, 10)).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1 h-12 rounded-full transition-all duration-300 ${
                    idx === index
                      ? "bg-accent h-16"
                      : "bg-white/40 backdrop-blur-sm"
                  }`}
                />
              ))}
              {feedItems.length > 10 && index < 10 && (
                <div className="text-white/60 text-xs text-center">
                  +{feedItems.length - 10}
                </div>
              )}
            </div>

            {/* Swipe Indicator */}
            {index === 0 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-sm animate-bounce bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
                Swipe up or scroll to continue
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-accent/95 backdrop-blur-lg border-t border-accent-foreground/10">
        <div className="flex items-center justify-around px-4 py-3 max-w-md mx-auto">
          {/* Home/Feed Tab */}
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'feed' ? 'text-background' : 'text-accent-foreground/60'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'feed' ? 'bg-background' : ''
            }`}>
              <Home size={22} className={activeTab === 'feed' ? 'text-accent' : ''} />
            </div>
            <span className="text-xs">Feed</span>
          </button>

          {/* Stories Tab */}
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'stories' ? 'text-background' : 'text-accent-foreground/60'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'stories' ? 'bg-background' : ''
            }`}>
              <PlayCircle size={22} className={activeTab === 'stories' ? 'text-accent' : ''} />
            </div>
            <span className="text-xs">Stories</span>
          </button>

          {/* Follow Tab */}
          <button
            onClick={() => setActiveTab('follow')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'follow' ? 'text-background' : 'text-accent-foreground/60'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'follow' ? 'bg-background' : ''
            }`}>
              <UserPlus size={22} className={activeTab === 'follow' ? 'text-accent' : ''} />
            </div>
            <span className="text-xs">Follow</span>
          </button>

          {/* Messages Tab */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'messages' ? 'text-background' : 'text-accent-foreground/60'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'messages' ? 'bg-background' : ''
            }`}>
              <MessageCircle size={22} className={activeTab === 'messages' ? 'text-accent' : ''} />
            </div>
            <span className="text-xs">Messages</span>
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'profile' ? 'text-background' : 'text-accent-foreground/60'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'profile' ? 'bg-background' : ''
            }`}>
              <User size={22} className={activeTab === 'profile' ? 'text-accent' : ''} />
            </div>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}