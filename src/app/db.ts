/**
 * REAL DATABASE OPERATIONS
 * Direct Supabase table queries for THE V app
 * 
 * This replaces mock data with actual database operations
 */

import { supabase } from './supabaseClient';
import { Post, Comment } from './types';

// ========================================
// POSTS - Fetch, Create, Delete
// ========================================

/**
 * Get all posts with user info (for feed)
 */
export async function fetchAllPosts(limit = 50, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        caption,
        location,
        created_at,
        profiles:user_id (username, full_name, avatar_url),
        post_media (id, media_url, media_type, position),
        likes (count),
        comments (count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching posts:', err);
    return [];
  }
}

/**
 * Get posts from users that current user follows
 */
export async function fetchFollowingPosts(userId: string, limit = 50, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        caption,
        location,
        created_at,
        profiles:user_id (username, full_name, avatar_url),
        post_media (id, media_url, media_type, position),
        likes (count),
        comments (count)
      `)
      .in('user_id', (
        // Get IDs of users that current user follows
        await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId)
      ).data?.map(f => f.following_id) || [])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching following posts:', err);
    return [];
  }
}

/**
 * Create a new post
 */
export async function createPost(userId: string, caption: string, location?: string, mediaUrls?: string[]) {
  try {
    // Insert post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert([{
        user_id: userId,
        caption,
        location
      }])
      .select()
      .single();

    if (postError) throw postError;

    // Insert media if provided
    if (mediaUrls && mediaUrls.length > 0) {
      const mediaInserts = mediaUrls.map((url, i) => ({
        post_id: post.id,
        media_url: url,
        media_type: 'image', // TODO: detect type
        position: i
      }));

      const { error: mediaError } = await supabase
        .from('post_media')
        .insert(mediaInserts);

      if (mediaError) throw mediaError;
    }

    return post;
  } catch (err) {
    console.error('Error creating post:', err);
    throw err;
  }
}

/**
 * Delete a post
 */
export async function deletePost(postId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .match({ id: postId, user_id: userId });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting post:', err);
    throw err;
  }
}

// ========================================
// LIKES - Like/Unlike Posts
// ========================================

/**
 * Add a like to a post
 */
export async function likePost(userId: string, postId: string) {
  try {
    const { error } = await supabase
      .from('likes')
      .insert([{
        user_id: userId,
        post_id: postId
      }]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error liking post:', err);
    throw err;
  }
}

/**
 * Remove a like from a post
 */
export async function unlikePost(userId: string, postId: string) {
  try {
    const { error } = await supabase
      .from('likes')
      .delete()
      .match({ user_id: userId, post_id: postId });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error unliking post:', err);
    throw err;
  }
}

/**
 * Check if user has liked a post
 */
export async function hasUserLikedPost(userId: string, postId: string) {
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .match({ user_id: userId, post_id: postId })
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return !!data;
  } catch (err) {
    console.error('Error checking like status:', err);
    return false;
  }
}

/**
 * Get like count for a post
 */
export async function getLikeCount(postId: string) {
  try {
    const { count, error } = await supabase
      .from('likes')
      .select('*', { count: 'exact' })
      .eq('post_id', postId);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('Error getting like count:', err);
    return 0;
  }
}

// ========================================
// COMMENTS - Create, Delete, Fetch
// ========================================

/**
 * Get comments for a post (with replies)
 */
export async function fetchComments(postId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        user_id,
        content,
        created_at,
        parent_id,
        profiles:user_id (username, avatar_url),
        replies:comments(id, user_id, content, created_at, profiles:user_id(username, avatar_url))
      `)
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching comments:', err);
    return [];
  }
}

/**
 * Create a comment on a post
 */
export async function createComment(userId: string, postId: string, content: string, parentId?: string) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        user_id: userId,
        post_id: postId,
        content,
        parent_id: parentId || null
      }])
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creating comment:', err);
    throw err;
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .match({ id: commentId, user_id: userId });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting comment:', err);
    throw err;
  }
}

// ========================================
// FOLLOWS - Follow/Unfollow Users
// ========================================

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string) {
  try {
    const { error } = await supabase
      .from('follows')
      .insert([{
        follower_id: followerId,
        following_id: followingId,
        status: 'accepted'
      }]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error following user:', err);
    throw err;
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string) {
  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error unfollowing user:', err);
    throw err;
  }
}

/**
 * Check if user is following another user
 */
export async function isUserFollowing(followerId: string, followingId: string) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .match({ follower_id: followerId, following_id: followingId })
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (err) {
    console.error('Error checking follow status:', err);
    return false;
  }
}

/**
 * Get follower count
 */
export async function getFollowerCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact' })
      .eq('following_id', userId);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('Error getting follower count:', err);
    return 0;
  }
}

/**
 * Get following count
 */
export async function getFollowingCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact' })
      .eq('follower_id', userId);

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('Error getting following count:', err);
    return 0;
  }
}

// ========================================
// PROFILES - Fetch & Update User Info
// ========================================

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

/**
 * Get user profile by username
 */
export async function getUserProfileByUsername(username: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  website?: string;
  username?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error updating profile:', err);
    throw err;
  }
}

/**
 * Get user's posts
 */
export async function getUserPosts(userId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        caption,
        location,
        created_at,
        post_media (media_url, media_type),
        likes (count),
        comments (count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching user posts:', err);
    return [];
  }
}

// ========================================
// MESSAGES - Send & Fetch DMs
// ========================================

/**
 * Get or create conversation between two users
 */
export async function getOrCreateConversation(userId1: string, userId2: string) {
  try {
    // Find existing conversation
    const { data: existing, error: searchError } = await supabase
      .rpc('find_conversation', {
        user1_id: userId1,
        user2_id: userId2
      });

    if (existing && !searchError) {
      return existing;
    }

    // Create new conversation
    const { data: conv, error: createError } = await supabase
      .from('conversations')
      .insert([{}])
      .select()
      .single();

    if (createError) throw createError;

    // Add participants
    await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conv.id, user_id: userId1 },
        { conversation_id: conv.id, user_id: userId2 }
      ]);

    return conv;
  } catch (err) {
    console.error('Error with conversation:', err);
    throw err;
  }
}

/**
 * Send a message
 */
export async function sendMessage(conversationId: string, senderId: string, content: string, mediaUrl?: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        media_url: mediaUrl || null
      }])
      .select(`
        *,
        profiles:sender_id (username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error sending message:', err);
    throw err;
  }
}

/**
 * Get messages from a conversation
 */
export async function fetchMessages(conversationId: string, limit = 50, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles:sender_id (username, avatar_url, id)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []).reverse(); // Reverse to get chronological order
  } catch (err) {
    console.error('Error fetching messages:', err);
    return [];
  }
}

/**
 * Mark message as seen
 */
export async function markMessageAsSeen(messageId: string) {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ seen: true })
      .eq('id', messageId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error marking message as seen:', err);
    return false;
  }
}

// ========================================
// NOTIFICATIONS
// ========================================

/**
 * Get notifications for user
 */
export async function fetchNotifications(userId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:actor_id (username, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return false;
  }
}

// ========================================
// SAVED POSTS
// ========================================

/**
 * Save a post
 */
export async function savePost(userId: string, postId: string) {
  try {
    const { error } = await supabase
      .from('saved_posts')
      .insert([{
        user_id: userId,
        post_id: postId
      }]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error saving post:', err);
    throw err;
  }
}

/**
 * Unsave a post
 */
export async function unsavePost(userId: string, postId: string) {
  try {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .match({ user_id: userId, post_id: postId });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error unsaving post:', err);
    throw err;
  }
}

/**
 * Check if post is saved
 */
export async function isPostSaved(userId: string, postId: string) {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .select('id')
      .match({ user_id: userId, post_id: postId })
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (err) {
    console.error('Error checking save status:', err);
    return false;
  }
}

export default {
  // Posts
  fetchAllPosts,
  fetchFollowingPosts,
  createPost,
  deletePost,

  // Likes
  likePost,
  unlikePost,
  hasUserLikedPost,
  getLikeCount,

  // Comments
  fetchComments,
  createComment,
  deleteComment,

  // Follows
  followUser,
  unfollowUser,
  isUserFollowing,
  getFollowerCount,
  getFollowingCount,

  // Profiles
  getUserProfile,
  getUserProfileByUsername,
  updateUserProfile,
  getUserPosts,

  // Messages
  getOrCreateConversation,
  sendMessage,
  fetchMessages,
  markMessageAsSeen,

  // Notifications
  fetchNotifications,
  markNotificationAsRead,

  // Saved Posts
  savePost,
  unsavePost,
  isPostSaved
};
