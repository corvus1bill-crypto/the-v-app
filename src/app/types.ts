export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  imageUrl?: string;
  imageUrls?: string[]; // Support multiple images
  thumbnailUrls?: string[]; // Low-res thumbnails for progressive loading
  videoUrl?: string;
  caption: string;
  likes: number;
  dislikes?: number;
  comments: number;
  shares: number;
  timestamp: string;
  isLiked: boolean;
  isDisliked?: boolean;
  isSaved: boolean;
  commentsList?: Comment[]; // Actual comments data
  tags?: string[]; // For search
  type?: 'image' | 'video'; // Content type
  visibility?: 'public' | 'followers'; // Who can see this post
  // Feature extensions
  location?: string;
  poll?: { question: string; options: string[]; votes: number[] };
  isAnonymous?: boolean;
  expiresAt?: string; // ISO date string for expiring posts
  collabUserId?: string;
  collabUsername?: string;
  collabUserAvatar?: string;
  reactions?: { [emoji: string]: number };
  pinnedCommentId?: string;
  // NEW FEATURES
  isDraft?: boolean; // Draft posts
  scheduledFor?: string; // ISO date for scheduled posts
  isArchived?: boolean; // Archived posts
  mentionedUsers?: string[]; // User IDs mentioned in post
  hashtags?: string[]; // Hashtags in post
  filter?: string; // Photo filter applied (global fallback)
  cameraEra?: string; // Camera era effect (global fallback)
  filters?: string[]; // Per-media photo filters (indexed by media position)
  cameraEras?: string[]; // Per-media camera era effects
  isMuted?: boolean; // Whether video should start muted (default: false = sound on)
  insights?: PostInsights; // Post analytics
  isVerified?: boolean; // User verification badge
  templateId?: string; // Template used
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  videoUrl?: string; // Optional video URL for video vibes
  timestamp: string;
  viewed: boolean;
  isCloseFriends?: boolean;
  note?: string; // Short user note displayed on avatar
  // NEW FEATURES
  viewedBy?: string[]; // User IDs who viewed this story
  likedBy?: string[]; // User IDs who liked this story
  isHighlight?: boolean; // Story saved as highlight
  highlightName?: string; // Name of highlight collection
  replies?: StoryReply[]; // Replies to story
  filter?: string; // CSS filter applied to story media
  cameraEra?: string; // Camera era effect
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  text?: string;
  imageUrl?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  likes: number;
  dislikes?: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  timestamp: string;
  replies?: Comment[];
  isPinned?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  timestamp: string;
  read: boolean;
  reaction?: string; // emoji reaction on this message
  sharedPost?: {
    id: string;
    imageUrl: string;
    caption: string;
    username: string;
    userAvatar: string;
  };
  replyTo?: {
    id: string;
    username: string;
    text?: string;
    imageUrl?: string;
    mediaType: 'text' | 'image' | 'voice' | 'video' | 'post';
  };
}

export interface Conversation {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isTyping?: boolean;
  // Group chat fields
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
  groupMembers?: Array<{ userId: string; username: string; avatar: string }>;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  postsCount: number;
  isFollowing: boolean;
  // NEW FEATURES
  isVerified?: boolean; // Verified badge
  isBlocked?: boolean; // Blocked users
  isMuted?: boolean; // Muted users
  lastActive?: string; // Activity status
  followedHashtags?: string[]; // Followed hashtags
  storyHighlights?: StoryHighlight[]; // Story highlights
  notificationSettings?: NotificationSettings; // Notification preferences
}

export interface PostInsights {
  views: number;
  reach: number;
  saves: number;
  shares: number;
  profileVisits: number;
  engagement: number;
}

export interface StoryReply {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  text: string;
  timestamp: string;
}

export interface StoryHighlight {
  id: string;
  name: string;
  coverImage: string;
  stories: Story[];
  createdAt: string;
}

export interface NotificationSettings {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  mentions: boolean;
  posts: boolean;
}

export interface DraftPost {
  id: string;
  content: Partial<Post>;
  lastSaved: string;
  autoSaved: boolean;
}

export interface PostTemplate {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  layout: string;
}