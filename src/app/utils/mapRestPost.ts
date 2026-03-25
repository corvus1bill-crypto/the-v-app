import { formatDistanceToNow } from 'date-fns';
import type { Post } from '../types';
import type { RestFeedPost } from '../services/backendApi';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop';

export function mapRestFeedPostToPost(p: RestFeedPost): Post {
  const media = [...(p.post_media || [])].sort((a, b) => a.position - b.position);
  const first = media[0];
  return {
    id: p.id,
    userId: p.userId,
    username: p.user?.username || 'user',
    userAvatar: p.user?.avatarUrl || PLACEHOLDER,
    imageUrl: first?.media_url,
    imageUrls: media.map((m) => m.media_url),
    thumbnailUrls: media.map((m) => m.thumb_url).filter(Boolean) as string[] | undefined,
    caption: p.caption || '',
    likes: p.likes,
    comments: p.comments,
    shares: 0,
    timestamp: formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }),
    isLiked: p.isLiked,
    isSaved: false,
    location: p.location || undefined,
  };
}
