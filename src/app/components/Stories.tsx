import { useState, useCallback, useEffect, useRef, memo } from "react";
import { createPortal } from "react-dom";
import { Plus, Check } from "lucide-react";
import { Story } from "../types";
import { StoryViewer, StoryViewerEntry } from "./StoryViewer";
import { PulsatingGlow } from "./PulsatingGlow";
import { CreatePostPage } from "./CreatePostPage";

// Mock viewers for your own story (replace with real backend data)
const MOCK_MY_STORY_VIEWERS: StoryViewerEntry[] = [
  { userId: "user1", username: "TravelDreamer", userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", liked: true,  timestamp: "2m ago",  relationship: "close_friends", isCloseFriend: true },
  { userId: "user2", username: "FoodieHeaven",  userAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop", liked: false, timestamp: "5m ago",  relationship: "friends" },
  { userId: "user3", username: "UrbanExplorer", userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", liked: true,  timestamp: "11m ago", relationship: "friends" },
  { userId: "user4", username: "NaturePhotos",  userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", liked: false, timestamp: "23m ago", relationship: "following_you" },
  { userId: "user5", username: "PortraitPro",   userAvatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop", liked: true,  timestamp: "1h ago",  relationship: "follows_you" },
  { userId: "user6", username: "FitnessLife",   userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop", liked: false, timestamp: "1h ago",  relationship: "none" },
];

// Mock stories data - Strictly synced with App.tsx to avoid conflicts
export const initialStories: Story[] = [
  {
    id: 'story-1',
    userId: 'user1',
    username: 'TravelDreamer',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&h=1350&fit=crop',
    timestamp: '2h ago',
    viewed: false,
  },
  {
    id: 'story-2',
    userId: 'user4',
    username: 'NaturePhotos',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&h=1350&fit=crop',
    timestamp: '4h ago',
    viewed: false,
  },
  {
    id: 'story-3',
    userId: 'user6',
    username: 'FitnessLife',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1080&h=1350&fit=crop',
    timestamp: '5h ago',
    viewed: false,
  },
  {
    id: 'story-4',
    userId: 'user1',
    username: 'TravelDreamer',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1080&h=1350&fit=crop',
    timestamp: '1h ago',
    viewed: false,
  }
];

const isStoryExpired = (timestamp: string) => {
    if (timestamp.includes('ago')) {
         if (timestamp.match(/[dwmy]/)) {
             return true; 
         }
         return false;
    }
    return false; 
};

interface StoriesProps {
    stories?: Story[];
    onViewProfile?: (userId: string, currentStoryUserId?: string) => void;
    initialUserId?: string | null;
    onAddStory?: (story: Story) => void;
    onStoryView?: (storyId: string) => void;
    onViewerStateChange?: (isOpen: boolean) => void;
    isVisible?: boolean;
}

export function Stories({ onViewProfile, initialUserId, stories: propStories, onAddStory, onStoryView, onViewerStateChange, isVisible = true }: StoriesProps) {
    const [localStories, setLocalStories] = useState<Story[]>(initialStories);
    const stories = propStories || localStories;
    
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Notify parent about viewer state changes
    useEffect(() => {
        if (onViewerStateChange) {
            onViewerStateChange(!!selectedUserId);
        }
    }, [selectedUserId, onViewerStateChange]);

    const [showCreateStory, setShowCreateStory] = useState(false);
    
    useEffect(() => {
        if (initialUserId) {
            setSelectedUserId(initialUserId);
        }
    }, [initialUserId]);

    const handlePostStory = (story: Story) => {
        if (onAddStory) {
            onAddStory(story);
        } else {
            setLocalStories(prev => [story, ...prev]);
        }
        setShowCreateStory(false);
    };

    const uniqueUsers = Array.from(
        new Map(
            stories.map(story => [
                story.userId,
                {
                    userId: story.userId,
                    username: story.username,
                    userAvatar: story.userAvatar,
                    viewed: stories
                        .filter(s => s.userId === story.userId)
                        .every(s => s.viewed),
                    isCloseFriends: stories.some(s => s.userId === story.userId && s.isCloseFriends),
                    note: stories.find(s => s.userId === story.userId && s.note)?.note,
                }
            ])
        ).values()
    );

    const handleStoryView = (storyId: string) => {
        if (onStoryView) {
            onStoryView(storyId);
        } else {
             setLocalStories(localStories.map(s => 
                s.id === storyId ? { ...s, viewed: true } : s
            ));
        }
    };

    const handleNextUser = useCallback(() => {
        if (!selectedUserId) return;
        const activeUsers = uniqueUsers.filter(u => 
            stories.some(s => s.userId === u.userId && !isStoryExpired(s.timestamp))
        );
        const currentUserIndex = activeUsers.findIndex(u => u.userId === selectedUserId);
        if (currentUserIndex < activeUsers.length - 1) {
            setSelectedUserId(activeUsers[currentUserIndex + 1].userId);
        } else {
            setSelectedUserId(null);
        }
    }, [selectedUserId, uniqueUsers, stories]);

    const handlePreviousUser = useCallback(() => {
        if (!selectedUserId) return;
        const activeUsers = uniqueUsers.filter(u => 
            stories.some(s => s.userId === u.userId && !isStoryExpired(s.timestamp))
        );
        const currentUserIndex = activeUsers.findIndex(u => u.userId === selectedUserId);
        if (currentUserIndex > 0) {
            setSelectedUserId(activeUsers[currentUserIndex - 1].userId);
        }
    }, [selectedUserId, uniqueUsers, stories]);

    const selectedUserStories = selectedUserId 
        ? stories.filter(s => s.userId === selectedUserId && !isStoryExpired(s.timestamp))
        : [];

    const initialStoryIndex = selectedUserStories.findIndex(s => !s.viewed);
    const startIndex = initialStoryIndex >= 0 ? initialStoryIndex : 0;

    if (!isVisible) return null;

    return (
        <div className="relative">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-6 px-4 pt-2">
              {/* Add Your Story / Your Posted Story */}
              {(() => {
                const myStory = stories.find(s => s.userId === 'currentUser' && !isStoryExpired(s.timestamp));
                
                if (myStory) {
                  return (
                    <button
                      onClick={() => setSelectedUserId('currentUser')}
                      className="flex flex-col items-center gap-2 flex-shrink-0 group relative active:scale-95 transition-transform"
                      style={{ animation: 'fadeSlideUp 0.3s ease both' }}
                    >
                      <div className="relative transform transition-all duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[2px]">
                        <PulsatingGlow color="var(--background)" intensity="low">
                          <div className="relative w-20 h-20 border-4 border-foreground bg-background shadow-[4px_4px_0px_0px_var(--foreground)] group-hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all">
                            <div className="w-full h-full overflow-hidden relative bg-foreground">
                              <img
                                src={myStory.userAvatar}
                                alt="Your Vibe"
                                className="w-full h-full object-cover"
                              />
                            </div>
                             <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-background border-2 border-foreground flex items-center justify-center p-0.5 z-10 shadow-[2px_2px_0px_0px_var(--foreground)]">
                                  <Check className="text-foreground w-4 h-4" strokeWidth={4} />
                             </div>
                          </div>
                        </PulsatingGlow>
                      </div>
                      <span className="text-xs font-black text-foreground uppercase bg-background px-1 border border-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                        MY VIBE
                      </span>
                    </button>
                  );
                } else {
                  return (
                    <button 
                      onClick={() => setShowCreateStory(true)}
                      className="flex flex-col items-center gap-2 flex-shrink-0 group relative active:scale-95 transition-transform"
                      style={{ animation: 'fadeSlideUp 0.3s ease 0.1s both' }}
                    >
                      <div className="relative transform transition-all duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[2px]">
                        <PulsatingGlow color="var(--background)" intensity="medium">
                          <div className="relative w-20 h-20 border-4 border-foreground bg-background shadow-[4px_4px_0px_0px_var(--foreground)] group-hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all flex items-center justify-center">
                            <div className="w-full h-full bg-foreground/5 flex items-center justify-center relative overflow-hidden group-hover:bg-background transition-colors">
                              <Plus className="text-foreground relative z-10" size={32} strokeWidth={3} />
                            </div>
                             <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-background border-2 border-foreground flex items-center justify-center p-0.5 z-10 shadow-[2px_2px_0px_0px_var(--foreground)]">
                                  <Plus className="text-foreground w-4 h-4" strokeWidth={4} />
                             </div>
                          </div>
                        </PulsatingGlow>
                      </div>
                      <span className="text-xs font-black text-foreground uppercase bg-background px-1 border border-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                        ADD VIBE
                      </span>
                    </button>
                  );
                }
              })()}

              {/* User Stories — sorted by priority: Close Friends → Unviewed → Viewed */}
              {uniqueUsers
                .filter(s => s.userId !== 'currentUser')
                .filter(u => stories.some(s => s.userId === u.userId && !isStoryExpired(s.timestamp)))
                .sort((a, b) => {
                  // Priority: Close Friends > Unviewed > Viewed
                  const priorityOf = (u: typeof a) => {
                    if (u.isCloseFriends && !u.viewed) return 0;
                    if (u.isCloseFriends) return 1;
                    if (!u.viewed) return 2;
                    return 3;
                  };
                  return priorityOf(a) - priorityOf(b);
                })
                .map((story, idx) => {
                return (
                  <button
                    key={story.userId}
                    onClick={() => {
                        console.log("Opening story for user:", story.userId);
                        setSelectedUserId(story.userId);
                    }}
                    className="flex flex-col items-center gap-2 flex-shrink-0 group relative active:scale-95 transition-transform"
                    style={{ animation: `fadeSlideUp 0.3s ease ${(idx + 2) * 0.05}s both` }}
                  >
                    <div className="relative transform transition-all duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[2px]">
                      {/* User note bubble */}
                      {story.note && (
                        <div
                          className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 pointer-events-none"
                          style={{ animation: 'fadeSlideUp 0.3s ease both' }}
                        >
                          <div className="bg-background border-2 border-foreground px-2 py-0.5 text-[9px] font-black text-foreground uppercase shadow-[2px_2px_0px_0px_var(--foreground)] max-w-[80px] truncate">
                            {story.note}
                          </div>
                          <div className="w-2 h-2 bg-background border-r-2 border-b-2 border-foreground rotate-45 mx-auto -mt-[6px] relative z-10" />
                        </div>
                      )}

                      <PulsatingGlow 
                        color={story.isCloseFriends ? '#22c55e' : 'var(--background)'} 
                        intensity="low"
                        enabled={!story.viewed}
                      >
                        <div className={`relative w-20 h-20 border-4 shadow-[4px_4px_0px_0px_var(--foreground)] group-hover:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all ${
                          story.viewed
                            ? 'border-foreground bg-secondary'
                            : story.isCloseFriends
                            ? 'border-green-500 bg-green-500'
                            : 'border-foreground bg-foreground'
                        }`}
                        style={!story.viewed ? { animation: 'storyNewPop 2.5s ease-in-out infinite' } : undefined}
                        >
                          <div className={`w-full h-full overflow-hidden relative bg-foreground transition-all p-0.5`}>
                            <img
                              src={story.userAvatar}
                              alt={story.username}
                              className={`w-full h-full object-cover group-hover:scale-110 transition-transform ${story.viewed ? 'opacity-70' : ''}`}
                              loading="lazy"
                            />
                          </div>
                          {/* Close friends badge */}
                          {story.isCloseFriends && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-foreground flex items-center justify-center z-10">
                              <span className="text-[8px]">★</span>
                            </div>
                          )}
                        </div>
                      </PulsatingGlow>
                    </div>
                    
                    <span
                      className={`text-xs font-black uppercase px-1 border border-foreground transition-colors ${
                        story.viewed 
                          ? 'bg-secondary text-muted-foreground' 
                          : story.isCloseFriends
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-background text-foreground group-hover:bg-foreground group-hover:text-background'
                      }`}
                    >
                      {story.username.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedUserId && selectedUserStories.length > 0 && (
                <StoryViewer
                    stories={selectedUserStories}
                    initialIndex={startIndex}
                    onClose={() => setSelectedUserId(null)}
                    onViewProfile={(userId) => {
                        setSelectedUserId(null);
                        if (onViewProfile) onViewProfile(userId, selectedUserId);
                    }}
                    onNextUser={handleNextUser}
                    onPreviousUser={handlePreviousUser}
                    onStoryView={handleStoryView}
                    isOwnStory={selectedUserId === 'currentUser'}
                    viewers={selectedUserId === 'currentUser' ? MOCK_MY_STORY_VIEWERS : undefined}
                />
            )}

            {showCreateStory && createPortal(
                <div className="absolute inset-0 z-[9999] bg-background flex flex-col animate-in fade-in zoom-in duration-200">
                    <CreatePostPage
                        onClose={() => setShowCreateStory(false)}
                        onAddPost={() => {}}
                        onAddStory={(story) => handlePostStory(story)}
                    />
                </div>,
                document.body
            )}
        </div>
    );
}