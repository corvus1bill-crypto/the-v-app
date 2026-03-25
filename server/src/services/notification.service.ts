import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';

export async function listNotifications(userId: string, limit = 50) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { actor: true },
  });

  return rows.map((n) => ({
    id: n.id,
    user_id: n.userId,
    actor_id: n.actorId,
    type: n.type,
    post_id: n.postId,
    comment_id: n.commentId,
    is_read: n.isRead,
    created_at: n.createdAt.toISOString(),
    actor: n.actor
      ? { username: n.actor.username, avatar_url: n.actor.avatarUrl }
      : null,
  }));
}

export async function markRead(notificationId: string, userId: string) {
  const n = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!n) throw new HttpError(404, 'Notification not found');
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
