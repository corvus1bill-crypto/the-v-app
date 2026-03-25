/**
 * Feature Helper Utilities
 * Helper functions to use new features throughout the app
 */

import { Post, Story, DraftPost } from '../types';

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w\u0590-\u05ff]+/gi;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.toLowerCase()) : [];
}

/**
 * Extract user mentions from text
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@[\w\u0590-\u05ff]+/gi;
  const matches = text.match(mentionRegex);
  return matches ? matches.map(mention => mention.substring(1).toLowerCase()) : [];
}

/**
 * Format time ago for activity status
 */
export function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Active now';
  if (minutes < 60) return `Active ${minutes}m ago`;
  if (hours < 24) return `Active ${hours}h ago`;
  if (days === 1) return 'Active yesterday';
  if (days < 7) return `Active ${days}d ago`;
  return 'Offline';
}

/**
 * Check if a post should be shown based on user blocks/mutes
 */
export function shouldShowPost(
  post: Post,
  blockedUsers: Set<string>,
  mutedUsers: Set<string>,
  currentUserId: string
): boolean {
  // Don't filter own posts
  if (post.userId === currentUserId) return true;
  
  // Don't show posts from blocked or muted users
  if (blockedUsers.has(post.userId)) return false;
  if (mutedUsers.has(post.userId)) return false;
  
  return true;
}

/**
 * Filter posts based on followed hashtags
 */
export function filterPostsByHashtags(
  posts: Post[],
  followedHashtags: Set<string>
): Post[] {
  if (followedHashtags.size === 0) return posts;
  
  return posts.filter(post => {
    const postHashtags = extractHashtags(post.caption);
    return postHashtags.some(tag => followedHashtags.has(tag));
  });
}

/**
 * Check if a post is scheduled for future
 */
export function isScheduledPost(post: Post): boolean {
  if (!post.scheduledFor) return false;
  return new Date(post.scheduledFor) > new Date();
}

/**
 * Check if a post is expired
 */
export function isExpiredPost(post: Post): boolean {
  if (!post.expiresAt) return false;
  return new Date(post.expiresAt) < new Date();
}

/**
 * Generate share URL for external sharing
 */
export function generateShareUrl(postId: string): string {
  return `https://vibe.app/post/${postId}`;
}

/**
 * Generate share text for external sharing
 */
export function generateShareText(post: Post): string {
  const username = post.isAnonymous ? 'Anonymous' : `@${post.username}`;
  return `Check out this post by ${username} on Vibe: ${post.caption.substring(0, 100)}${post.caption.length > 100 ? '...' : ''}`;
}

/**
 * Format draft auto-save notification
 */
export function getDraftSaveMessage(draft: DraftPost): string {
  const timeSince = Date.now() - new Date(draft.lastSaved).getTime();
  const seconds = Math.floor(timeSince / 1000);
  
  if (seconds < 5) return 'Draft saved just now';
  if (seconds < 60) return `Draft saved ${seconds}s ago`;
  return 'Draft saved';
}

/**
 * Calculate engagement score for insights
 */
export function calculateEngagement(post: Post): number {
  const totalInteractions = post.likes + post.comments + post.shares;
  const views = 1000; // Mock views - would come from backend
  return (totalInteractions / views) * 100;
}

/**
 * Get filter CSS from filter ID
 */
export function getFilterStyle(filterId: string): string {
  const filters: Record<string, string> = {
    'none': 'none',
    'grayscale': 'grayscale(100%)',
    'sepia': 'sepia(80%)',
    'saturate': 'saturate(200%)',
    'contrast': 'contrast(150%) brightness(110%)',
    'blur': 'blur(1px) brightness(110%)',
    'invert': 'invert(100%)',
    'hue': 'hue-rotate(90deg)',
  };
  return filters[filterId] || 'none';
}

/**
 * Validate hashtag format
 */
export function isValidHashtag(tag: string): boolean {
  return /^#[\w\u0590-\u05ff]+$/.test(tag);
}

/**
 * Validate mention format
 */
export function isValidMention(mention: string): boolean {
  return /^@[\w\u0590-\u05ff]+$/.test(mention);
}

/**
 * Format number with K/M suffixes
 */
export function formatCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}
