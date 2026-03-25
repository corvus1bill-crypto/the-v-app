import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';
import { signToken } from '../utils/jwt.js';

const SALT_ROUNDS = 12;

export async function registerUser(email: string, password: string, username: string) {
  const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingEmail) throw new HttpError(409, 'Email already registered');

  const uname = username.toLowerCase();
  const existingUsername = await prisma.profile.findUnique({ where: { username: uname } });
  if (existingUsername) throw new HttpError(409, 'Username already taken');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
    },
  });

  await prisma.profile.create({
    data: {
      id: user.id,
      username: uname,
    },
  });

  const token = signToken({ sub: user.id, role: user.role });
  const full = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });
  if (!full?.profile) throw new HttpError(500, 'Profile missing');

  return {
    token,
    user: {
      id: full.id,
      email: full.email,
      role: full.role,
      profile: {
        username: full.profile.username,
        fullName: full.profile.fullName,
        bio: full.profile.bio,
        avatarUrl: full.profile.avatarUrl,
      },
    },
  };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { profile: true },
  });
  if (!user?.profile) throw new HttpError(401, 'Invalid email or password');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid email or password');

  const token = signToken({ sub: user.id, role: user.role });
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: {
        username: user.profile.username,
        fullName: user.profile.fullName,
        bio: user.profile.bio,
        avatarUrl: user.profile.avatarUrl,
      },
    },
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user?.profile) throw new HttpError(404, 'User not found');
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profile: {
      username: user.profile.username,
      fullName: user.profile.fullName,
      bio: user.profile.bio,
      avatarUrl: user.profile.avatarUrl,
      website: user.profile.website,
    },
  };
}
