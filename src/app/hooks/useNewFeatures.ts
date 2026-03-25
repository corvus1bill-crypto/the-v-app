import { useState, useEffect } from 'react';
import { Post, DraftPost, PostTemplate, NotificationSettings, StoryHighlight } from '../types';
import { PHOTO_FILTERS as _FILTERS } from '../components/PhotoFilterPicker';

// Re-export from the canonical source
export const PHOTO_FILTERS = _FILTERS;

// Post templates
export const POST_TEMPLATES: PostTemplate[] = [
  { id: 'quote', name: 'Quote', thumbnail: '💬', category: 'Text', layout: 'centered-text' },
  { id: 'announcement', name: 'Announcement', thumbnail: '📣', category: 'Text', layout: 'bold-header' },
  { id: 'collage', name: 'Collage', thumbnail: '🖼️', category: 'Photo', layout: 'grid-4' },
  { id: 'before-after', name: 'Before/After', thumbnail: '↔️', category: 'Photo', layout: 'split-2' },
  { id: 'product', name: 'Product', thumbnail: '📦', category: 'Business', layout: 'product-showcase' },
  { id: 'testimonial', name: 'Testimonial', thumbnail: '⭐', category: 'Business', layout: 'quote-card' },
];

export function useNewFeatures(currentUserId: string) {
  // 1. Draft Posts
  const [draftPosts, setDraftPosts] = useState<DraftPost[]>([]);
  
  // 2. Scheduled Posts
  const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);
  
  // 3. Story Highlights
  const [storyHighlights, setStoryHighlights] = useState<StoryHighlight[]>([]);
  
  // 4. Verified Users
  const [verifiedUsers, setVerifiedUsers] = useState<Set<string>>(new Set(['user1', 'user2', 'user4']));
  
  // 5. User Mentions tracking
  const [userMentions, setUserMentions] = useState<Record<string, string[]>>({});
  
  // 6. Followed Hashtags
  const [followedHashtags, setFollowedHashtags] = useState<Set<string>>(new Set(['#travel', '#food']));
  
  // 7. Share to external tracking
  const [shareHistory, setShareHistory] = useState<string[]>([]);
  
  // 8. Blocked/Muted Users
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());
  
  // 9. Reported Content
  const [reportedPosts, setReportedPosts] = useState<Set<string>>(new Set());
  
  // 10. Selected Template
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // 11. GIF Picker State
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  
  // 12. Voice Notes (already supported in messages)
  const [voiceRecording, setVoiceRecording] = useState(false);
  
  // 13. Selected Filter
  const [selectedFilter, setSelectedFilter] = useState('none');
  
  // 14. Multi-photo selection
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  
  // 15. Story Replies
  const [storyReplies, setStoryReplies] = useState<Record<string, any[]>>({});
  
  // 16. Archived Posts
  const [archivedPosts, setArchivedPosts] = useState<Set<string>>(new Set());
  
  // 17. Activity Status
  const [userActivityStatus, setUserActivityStatus] = useState<Record<string, string>>({});
  
  // 18. Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    likes: true,
    comments: true,
    follows: true,
    messages: true,
    mentions: true,
    posts: true,
  });
  
  // 19. Post Insights
  const [postInsights, setPostInsights] = useState<Record<string, any>>({});
  
  // 20. Story View Tracking
  const [storyViews, setStoryViews] = useState<Record<string, string[]>>({});

  // Auto-save draft
  const autoSaveDraft = (content: Partial<Post>) => {
    const existingDraft = draftPosts.find(d => d.id === 'auto-draft');
    if (existingDraft) {
      setDraftPosts(prev => prev.map(d => 
        d.id === 'auto-draft' 
          ? { ...d, content, lastSaved: new Date().toISOString(), autoSaved: true }
          : d
      ));
    } else {
      setDraftPosts(prev => [...prev, {
        id: 'auto-draft',
        content,
        lastSaved: new Date().toISOString(),
        autoSaved: true
      }]);
    }
  };

  // Check scheduled posts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      scheduledPosts.forEach(post => {
        if (post.scheduledFor && new Date(post.scheduledFor) <= now) {
          // Post should be published now
          console.log('📅 Publishing scheduled post:', post.id);
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [scheduledPosts]);

  // Update activity status periodically
  useEffect(() => {
    const updateActivity = () => {
      setUserActivityStatus(prev => ({
        ...prev,
        [currentUserId]: new Date().toISOString()
      }));
    };

    updateActivity();
    const interval = setInterval(updateActivity, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [currentUserId]);

  return {
    // Draft Posts
    draftPosts,
    setDraftPosts,
    autoSaveDraft,
    
    // Scheduled Posts
    scheduledPosts,
    setScheduledPosts,
    
    // Story Highlights
    storyHighlights,
    setStoryHighlights,
    
    // Verified Users
    verifiedUsers,
    isVerified: (userId: string) => verifiedUsers.has(userId),
    
    // User Mentions
    userMentions,
    setUserMentions,
    
    // Followed Hashtags
    followedHashtags,
    followHashtag: (tag: string) => setFollowedHashtags(prev => new Set([...prev, tag])),
    unfollowHashtag: (tag: string) => {
      const next = new Set(followedHashtags);
      next.delete(tag);
      setFollowedHashtags(next);
    },
    
    // Share tracking
    shareHistory,
    addShare: (postId: string) => setShareHistory(prev => [...prev, postId]),
    
    // Block/Mute
    blockedUsers,
    mutedUsers,
    blockUser: (userId: string) => setBlockedUsers(prev => new Set([...prev, userId])),
    unblockUser: (userId: string) => {
      const next = new Set(blockedUsers);
      next.delete(userId);
      setBlockedUsers(next);
    },
    muteUser: (userId: string) => setMutedUsers(prev => new Set([...prev, userId])),
    unmuteUser: (userId: string) => {
      const next = new Set(mutedUsers);
      next.delete(userId);
      setMutedUsers(next);
    },
    
    // Report
    reportedPosts,
    reportPost: (postId: string) => setReportedPosts(prev => new Set([...prev, postId])),
    
    // Templates
    selectedTemplate,
    setSelectedTemplate,
    
    // GIF
    selectedGif,
    setSelectedGif,
    
    // Voice
    voiceRecording,
    setVoiceRecording,
    
    // Filters
    selectedFilter,
    setSelectedFilter,
    
    // Multi-photo
    selectedPhotos,
    setSelectedPhotos,
    
    // Story Replies
    storyReplies,
    addStoryReply: (storyId: string, reply: any) => {
      setStoryReplies(prev => ({
        ...prev,
        [storyId]: [...(prev[storyId] || []), reply]
      }));
    },
    
    // Archive
    archivedPosts,
    archivePost: (postId: string) => setArchivedPosts(prev => new Set([...prev, postId])),
    unarchivePost: (postId: string) => {
      const next = new Set(archivedPosts);
      next.delete(postId);
      setArchivedPosts(next);
    },
    
    // Activity Status
    userActivityStatus,
    getActivityStatus: (userId: string) => {
      const lastActive = userActivityStatus[userId];
      if (!lastActive) return 'Offline';
      const diff = Date.now() - new Date(lastActive).getTime();
      if (diff < 5 * 60 * 1000) return 'Active now';
      if (diff < 60 * 60 * 1000) return `Active ${Math.floor(diff / 60000)}m ago`;
      if (diff < 24 * 60 * 60 * 1000) return `Active ${Math.floor(diff / 3600000)}h ago`;
      return 'Offline';
    },
    
    // Notification Settings
    notificationSettings,
    updateNotificationSetting: (key: keyof NotificationSettings, value: boolean) => {
      setNotificationSettings(prev => ({ ...prev, [key]: value }));
    },
    
    // Post Insights
    postInsights,
    generateInsights: (postId: string) => {
      const insights = {
        views: Math.floor(Math.random() * 10000) + 1000,
        reach: Math.floor(Math.random() * 8000) + 800,
        saves: Math.floor(Math.random() * 500) + 50,
        shares: Math.floor(Math.random() * 300) + 30,
        profileVisits: Math.floor(Math.random() * 200) + 20,
        engagement: Math.random() * 10 + 2,
      };
      setPostInsights(prev => ({ ...prev, [postId]: insights }));
      return insights;
    },
    
    // Story Views
    storyViews,
    addStoryView: (storyId: string, userId: string) => {
      setStoryViews(prev => ({
        ...prev,
        [storyId]: [...(prev[storyId] || []), userId]
      }));
    },
    getStoryViewCount: (storyId: string) => (storyViews[storyId] || []).length,
  };
}