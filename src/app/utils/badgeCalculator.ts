// Global badge calculation system
// This calculates badges based on user activity and can be called from anywhere in the app

export interface Badge {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export interface UserStats {
  postsCount: number;
  totalLikes: number;
  maxLikesOnSinglePost: number;
  totalComments: number;
  followersCount: number;
  followingCount: number;
  storiesPosted?: number;
}

export function calculateUserBadges(stats: UserStats): Badge[] {
  const badges: Badge[] = [];
  
  // === GETTING STARTED BADGES ===
  if (stats.postsCount > 0) {
    badges.push({ id: 1, name: 'Early Adopter', icon: '🚀', color: '#9ACD32' });
  }
  
  // === POST COUNT BADGES (Milestone based) ===
  if (stats.postsCount >= 1000) {
    badges.push({ id: 20, name: 'Content King', icon: '👑', color: '#FFD700' });
  } else if (stats.postsCount >= 500) {
    badges.push({ id: 19, name: '500 Posts', icon: '🌟', color: '#FFA500' });
  } else if (stats.postsCount >= 250) {
    badges.push({ id: 18, name: '250 Posts', icon: '⚡', color: '#FF6B6B' });
  } else if (stats.postsCount >= 100) {
    badges.push({ id: 2, name: '100 Posts', icon: '💯', color: '#FFC107' });
  } else if (stats.postsCount >= 50) {
    badges.push({ id: 3, name: '50 Posts', icon: '⭐', color: '#60A5FA' });
  } else if (stats.postsCount >= 25) {
    badges.push({ id: 17, name: '25 Posts', icon: '🎯', color: '#A78BFA' });
  } else if (stats.postsCount >= 10) {
    badges.push({ id: 4, name: '10 Posts', icon: '✨', color: '#A78BFA' });
  } else if (stats.postsCount >= 5) {
    badges.push({ id: 16, name: 'First Five', icon: '🎉', color: '#34D399' });
  } else if (stats.postsCount >= 3) {
    badges.push({ id: 50, name: 'On a Roll', icon: '🎲', color: '#10B981' });
  } else if (stats.postsCount >= 1) {
    badges.push({ id: 51, name: 'First Post', icon: '🌱', color: '#4ADE80' });
  }
  
  // === ENGAGEMENT BADGES (Likes based) ===
  if (stats.maxLikesOnSinglePost >= 50000) {
    badges.push({ id: 21, name: 'Mega Viral', icon: '🌍', color: '#FF1493' });
  } else if (stats.maxLikesOnSinglePost >= 10000) {
    badges.push({ id: 7, name: 'Viral Post', icon: '💥', color: '#EF4444' });
  } else if (stats.maxLikesOnSinglePost >= 5000) {
    badges.push({ id: 5, name: 'Trending Master', icon: '🔥', color: '#ff7a2e' });
  } else if (stats.maxLikesOnSinglePost >= 1000) {
    badges.push({ id: 22, name: 'Rising Star', icon: '🌠', color: '#F59E0B' });
  } else if (stats.maxLikesOnSinglePost >= 500) {
    badges.push({ id: 52, name: 'Getting Hot', icon: '🔆', color: '#FBBF24' });
  } else if (stats.maxLikesOnSinglePost >= 100) {
    badges.push({ id: 53, name: 'Century', icon: '💯', color: '#FCD34D' });
  } else if (stats.maxLikesOnSinglePost >= 50) {
    badges.push({ id: 54, name: 'Half Century', icon: '⚾', color: '#FDE68A' });
  } else if (stats.maxLikesOnSinglePost >= 10) {
    badges.push({ id: 55, name: 'First 10 Likes', icon: '👍', color: '#FEF3C7' });
  } else if (stats.maxLikesOnSinglePost >= 1) {
    badges.push({ id: 56, name: 'First Like', icon: '❤️', color: '#FECACA' });
  }
  
  // Total likes milestone
  if (stats.totalLikes >= 100000) {
    badges.push({ id: 23, name: 'Liked Legend', icon: '💝', color: '#EC4899' });
  } else if (stats.totalLikes >= 50000) {
    badges.push({ id: 24, name: 'Love Machine', icon: '💖', color: '#F472B6' });
  } else if (stats.totalLikes >= 10000) {
    badges.push({ id: 25, name: 'Fan Favorite', icon: '💕', color: '#FBCFE8' });
  } else if (stats.totalLikes >= 1000) {
    badges.push({ id: 57, name: '1K Likes', icon: '💗', color: '#FBE4E4' });
  } else if (stats.totalLikes >= 500) {
    badges.push({ id: 58, name: 'Likeable', icon: '💓', color: '#FCE7F3' });
  } else if (stats.totalLikes >= 100) {
    badges.push({ id: 59, name: 'Hundred Club', icon: '💟', color: '#FBCFE8' });
  } else if (stats.totalLikes >= 50) {
    badges.push({ id: 60, name: 'Appreciated', icon: '💞', color: '#FAE8FF' });
  } else if (stats.totalLikes >= 10) {
    badges.push({ id: 61, name: 'Getting Love', icon: '💌', color: '#F5E6FF' });
  }
  
  // === SOCIAL INTERACTION BADGES (Comments) ===
  if (stats.totalComments >= 10000) {
    badges.push({ id: 26, name: 'Conversation King', icon: '💭', color: '#8B5CF6' });
  } else if (stats.totalComments >= 5000) {
    badges.push({ id: 27, name: 'Talk Show Host', icon: '🎤', color: '#A78BFA' });
  } else if (stats.totalComments >= 1000) {
    badges.push({ id: 6, name: 'Social Butterfly', icon: '💬', color: '#EC4899' });
  } else if (stats.totalComments >= 500) {
    badges.push({ id: 28, name: 'Chatterbox', icon: '🗨️', color: '#C084FC' });
  } else if (stats.totalComments >= 100) {
    badges.push({ id: 62, name: 'Conversational', icon: '💬', color: '#DDD6FE' });
  } else if (stats.totalComments >= 50) {
    badges.push({ id: 63, name: 'Talker', icon: '🗣️', color: '#E9D5FF' });
  } else if (stats.totalComments >= 10) {
    badges.push({ id: 64, name: 'First Chats', icon: '💭', color: '#F3E8FF' });
  } else if (stats.totalComments >= 1) {
    badges.push({ id: 65, name: 'First Comment', icon: '📝', color: '#FAF5FF' });
  }
  
  // === FOLLOWER BADGES ===
  if (stats.followersCount >= 1000000) {
    badges.push({ id: 8, name: 'Influencer', icon: '🌟', color: '#A855F7' });
  } else if (stats.followersCount >= 100000) {
    badges.push({ id: 30, name: '100K Followers', icon: '🚀', color: '#8B5CF6' });
  } else if (stats.followersCount >= 10000) {
    badges.push({ id: 31, name: '10K Followers', icon: '⭐', color: '#A78BFA' });
  } else if (stats.followersCount >= 1000) {
    badges.push({ id: 32, name: '1K Followers', icon: '🎯', color: '#C084FC' });
  } else if (stats.followersCount >= 500) {
    badges.push({ id: 66, name: '500 Followers', icon: '🌠', color: '#DDD6FE' });
  } else if (stats.followersCount >= 100) {
    badges.push({ id: 67, name: '100 Followers', icon: '✨', color: '#E9D5FF' });
  } else if (stats.followersCount >= 50) {
    badges.push({ id: 68, name: '50 Followers', icon: '🌟', color: '#F3E8FF' });
  } else if (stats.followersCount >= 10) {
    badges.push({ id: 69, name: '10 Followers', icon: '👥', color: '#FAF5FF' });
  } else if (stats.followersCount >= 1) {
    badges.push({ id: 70, name: 'First Follower', icon: '👤', color: '#FEFCE8' });
  }
  
  // === SOCIAL NETWORK BADGES ===
  if (stats.followingCount >= 1000) {
    badges.push({ id: 33, name: 'Network Master', icon: '🌐', color: '#14B8A6' });
  } else if (stats.followingCount >= 500) {
    badges.push({ id: 71, name: 'Well Connected', icon: '🔗', color: '#2DD4BF' });
  } else if (stats.followingCount >= 100) {
    badges.push({ id: 72, name: 'Networker', icon: '🤝', color: '#5EEAD4' });
  } else if (stats.followingCount >= 50) {
    badges.push({ id: 73, name: 'Social', icon: '👋', color: '#99F6E4' });
  } else if (stats.followingCount >= 10) {
    badges.push({ id: 74, name: 'Making Friends', icon: '🫂', color: '#CCFBF1' });
  }
  
  return badges;
}
