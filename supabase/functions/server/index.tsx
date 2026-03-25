import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

// ─── Suppress transport-level client-disconnect errors ──────────────────────
// Deno's internal respondWith() throws "Http: connection closed before message
// completed" when the client disconnects mid-response. This happens AFTER our
// handler returns a Response, so no try/catch in route code can catch it.
// Without this handler the unhandled rejection crashes the edge function instance.
const isConnectionError = (err: unknown): boolean => {
  const e = err as any;
  return (
    e?.name === 'Http' ||
    e?.message?.includes('connection closed') ||
    e?.message?.includes('broken pipe') ||
    e?.message?.includes('Connection reset') ||
    e?.message?.includes('unexpected EOF')
  );
};

addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  if (isConnectionError(event.reason)) {
    event.preventDefault(); // stop Deno from treating this as a fatal error
    console.log('⚠️ Client disconnected before response completed (suppressed)');
  }
});

addEventListener('error', (event: ErrorEvent) => {
  if (isConnectionError(event.error)) {
    event.preventDefault();
    console.log('⚠️ Client disconnect error event (suppressed)');
  }
});
// ────────────────────────────────────────────────────────────────────────────

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Add request size limit middleware (check before processing)
app.use('*', async (c, next) => {
  // Check Content-Length header if present
  const contentLength = c.req.header('Content-Length');
  if (contentLength) {
    const sizeMB = parseInt(contentLength) / (1024 * 1024);
    // Allow larger payloads for upload endpoints (10MB), restrict others to 2MB
    const url = new URL(c.req.url);
    const isUpload = url.pathname.includes('/upload');
    const maxMB = isUpload ? 10 : 2;
    if (sizeMB > maxMB) {
      console.error(`❌ Request too large: ${sizeMB.toFixed(2)} MB (limit: ${maxMB} MB)`);
      return c.json({ 
        error: 'Request too large. Please reduce file sizes.',
        size: `${sizeMB.toFixed(2)} MB`,
        maxSize: `${maxMB} MB`
      }, 413);
    }
  }
  await next();
});

// REMOVED: Global timeout middleware that wrapped next() in Promise.race()
// That caused "connection closed before message completed" because it could
// attempt to send a 504 response while a route handler was already writing
// its response to the same connection. Per-operation withTimeout() is sufficient.

// Global error handler - catches any unhandled errors
app.onError((err, c) => {
  console.error('❌ Unhandled error in server:', err);
  // Always return a valid response
  try {
    return c.json({ error: 'Internal server error', message: err.message }, 500);
  } catch {
    // If even JSON response fails, return text
    return new Response('Internal server error', { status: 500 });
  }
});

// Helper: detect transient network errors worth retrying
const isTransientError = (err: any): boolean => {
  const msg = String(err?.message || err || '').toLowerCase();
  return msg.includes('connection reset') ||
    msg.includes('connection closed') ||
    msg.includes('broken pipe') ||
    msg.includes('network') ||
    msg.includes('econnreset') ||
    msg.includes('socket hang up') ||
    msg.includes('fetch failed');
};

// Helper: retry a *factory* function (so each attempt creates a fresh promise)
const withRetry = async <T,>(
  factory: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 150
): Promise<T> => {
  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await factory();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries && isTransientError(err)) {
        const backoff = delayMs * Math.pow(2, attempt);
        console.log(`🔄 Retrying after transient error (attempt ${attempt + 1}/${maxRetries}, backoff ${backoff}ms)`);
        await new Promise(r => setTimeout(r, backoff));
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
};

// Helper function to wrap database operations with timeout + automatic retry on connection resets
const withTimeout = async <T,>(
  promiseOrFactory: Promise<T> | (() => Promise<T>),
  timeoutMs: number = 800,
  fallback: T
): Promise<T> => {
  const getPromise = typeof promiseOrFactory === 'function'
    ? () => withRetry(promiseOrFactory as () => Promise<T>, 2, 120)
    : () => promiseOrFactory;

  const timeoutPromise = new Promise<T>((resolve) =>
    setTimeout(() => {
      console.log(`⏱️ Operation timed out after ${timeoutMs}ms, using fallback`);
      resolve(fallback);
    }, timeoutMs)
  );

  try {
    return await Promise.race([getPromise(), timeoutPromise]);
  } catch (error) {
    console.error('⚠️ Operation error, returning fallback:', error);
    return fallback;
  }
};

// Initialize Supabase client for server-side operations
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Idempotently create storage buckets on startup
async function ensureBuckets() {
  const bucketName = 'make-78efa14d-media'; // Using a consistent prefix
  try {
    // Add timeout to prevent startup delays
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Bucket setup timeout')), 5000)
    );
    
    const setupPromise = async () => {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketName}`);
        await supabase.storage.createBucket(bucketName, {
          public: false, // Private bucket
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['image/*', 'video/*']
        });
        console.log(`✅ Bucket created: ${bucketName}`);
      } else {
        console.log(`✅ Bucket already exists: ${bucketName}`);
      }
    };
    
    await Promise.race([setupPromise(), timeoutPromise]);
  } catch (err) {
    console.log('⚠️ Bucket setup skipped (non-critical):', err.message);
    // Don't fail server startup on bucket errors
  }
}

// Call bucket setup (non-blocking with timeout)
ensureBuckets().catch(err => console.error('Bucket setup failed:', err));

// Health check endpoint
app.get("/make-server-78efa14d/health", (c) => {
  return c.json({ status: "ok" });
});

// Delete User Account
app.delete("/make-server-78efa14d/users/:userId/account", async (c) => {
  const { userId } = c.req.param();
  console.log(`🗑️ Deleting account for user: ${userId}`);
  try {
    const keysToDelete = [
      `user:${userId}`,
      `user:${userId}:posts`,
      `user:${userId}:following`,
      `user:${userId}:followers`,
      `user:${userId}:notifications`,
    ];
    await Promise.allSettled(keysToDelete.map(k => kv.del(k)));
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error('❌ Error deleting auth user:', error.message);
    }
    console.log(`✅ Account deleted for user: ${userId}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error deleting account:', error);
    return c.json({ error: 'Failed to delete account', message: error.message }, 500);
  }
});

// Daily Prompt - Check if user answered today
app.get("/make-server-78efa14d/daily-prompt/check/:userId/:date", async (c) => {
  try {
    const { userId, date } = c.req.param();
    const key = `dailyprompt:${userId}:${date}`;
    
    const answer = await kv.get(key);
    
    return c.json({ answered: !!answer });
  } catch (error: any) {
    console.error('Error checking daily prompt:', error);
    return c.json({ answered: false });
  }
});

// Daily Prompt - Save user answer
app.post("/make-server-78efa14d/daily-prompt/answer", async (c) => {
  try {
    const { userId, date, promptIndex, prompt } = await c.req.json();
    
    const answerData = {
      userId,
      date,
      promptIndex,
      prompt,
      answeredAt: new Date().toISOString()
    };
    
    // Store the answer
    await kv.set(`dailyprompt:${userId}:${date}`, answerData);
    
    // Also track user's answer history
    await kv.set(`dailyprompt:user:${userId}:${date}`, date);
    
    console.log(`✅ Daily prompt answer saved for user ${userId} on ${date}`);
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error saving daily prompt answer:', error);
    return c.json({ error: 'Failed to save answer' }, 500);
  }
});

// Demo Login - Special endpoint that creates/signs in demo user server-side
app.post("/make-server-78efa14d/demo-login", async (c) => {
  const demoEmail = 'demo@vibe.app';
  const demoPassword = 'demo123456';
  const demoUsername = 'demouser';

  try {
    console.log('🎮 Demo login request received');

    // Step 1: Try to create the demo user.  If the user already exists
    // Supabase returns an error with message containing "already been registered"
    // — that's fine, we just skip creation.
    let userId: string | null = null;

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: { name: demoUsername }
    });

    if (newUser?.user) {
      userId = newUser.user.id;
      console.log('✅ Demo user created:', userId);
    } else if (createError) {
      const msg = createError.message || '';
      // "already been registered" or "already exists" means the user is there
      if (msg.includes('already') || msg.includes('exists') || msg.includes('registered') || msg.includes('duplicate')) {
        console.log('ℹ️ Demo user already exists, will sign in client-side');
      } else {
        // Genuine creation error — log but don't crash; client can still try to sign in
        console.error('⚠️ Demo user creation issue (non-fatal):', msg);
      }
    }

    // Step 2: Ensure profile exists in KV (only if we have a userId from fresh creation)
    if (userId) {
      const userProfile = {
        userId,
        username: demoUsername,
        email: demoEmail,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
        bio: 'Demo user exploring Vibe! 🎮',
        createdAt: new Date().toISOString()
      };

      withTimeout(
        Promise.all([
          kv.set(`user:${userId}`, userProfile),
          kv.set(`username:${demoUsername.toLowerCase()}`, userId)
        ]),
        1500,
        null
      ).catch(err => console.warn('⚠️ Demo profile KV save failed (non-critical):', err));

      // Step 3: Seed demo posts (fire-and-forget)
      seedDemoData(userId).catch(err =>
        console.warn('⚠️ Demo data seeding failed (non-critical):', err)
      );
    }

    // Step 4: Return credentials — client will use signInWithPassword
    return c.json({
      success: true,
      email: demoEmail,
      password: demoPassword,
      userId: userId || undefined
    });

  } catch (err: any) {
    console.error('❌ Demo login error:', err);
    // Even on total failure, return credentials so client can attempt sign-in
    // (the user might already exist from a previous session)
    return c.json({
      success: true,
      email: demoEmail,
      password: demoPassword,
      userId: undefined,
      warning: 'Server-side user creation may have failed; client sign-in may still work'
    });
  }
});

// Helper function to seed demo data
async function seedDemoData(userId: string) {
  try {
    // Create sample posts for demo user
    const samplePosts = [
      {
        id: `demo-post-1-${Date.now()}`,
        userId: userId,
        caption: 'Welcome to Vibe! 🎉 This is my first post!',
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=1000&fit=crop',
        likes: 42,
        comments: 5,
        shares: 2,
        timestamp: 'Just now',
        visibility: 'public' as const,
        createdAt: new Date().toISOString()
      },
      {
        id: `demo-post-2-${Date.now()}`,
        userId: userId,
        caption: 'Exploring this amazing platform! 🚀',
        imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=1000&fit=crop',
        likes: 28,
        comments: 3,
        shares: 1,
        timestamp: '1h ago',
        visibility: 'public' as const,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    // Store posts with fire-and-forget (don't block signup)
    await Promise.all(
      samplePosts.map(post => 
        Promise.all([
          kv.set(`post:${post.id}`, post),
          kv.set(`userpost:${userId}:${post.id}`, post.id)
        ])
      )
    );
    
    console.log('✅ Demo data seeded successfully');
  } catch (err) {
    console.warn('⚠️ Failed to seed demo data:', err);
  }
}

// Search users by username
app.get("/make-server-78efa14d/users/search", async (c) => {
  try {
    const query = c.req.query('q')?.toLowerCase() || '';
    
    console.log('🔍 User search request:', { query });
    
    if (!query || query.length < 2) {
      console.log('⚠️ Query too short, returning no results');
      return c.json([]);
    }
    
    // Get all users with timeout protection - reduced timeout
    console.log('📂 Fetching users from KV');
    const users = await withTimeout(
      () => kv.getByPrefix('user:'),
      1500,
      []
    );
    
    console.log(`📊 Total users: ${users?.length || 0}`);
    
    // Filter users by username match - limit results
    const matchingUsers = users
      .filter((user: any) => user.username?.toLowerCase().includes(query))
      .slice(0, 20); // Limit to 20 results
    
    console.log(`🎯 Results: ${matchingUsers.length} matching "${query}"`);
    
    return c.json(matchingUsers);
    
  } catch (err: any) {
    console.error('❌ Error searching users:', err);
    return c.json([], 200); // Return empty array instead of error to prevent UI breaks
  }
});

// Check if username is available
app.get("/make-server-78efa14d/username/check/:username", async (c) => {
  try {
    const { username } = c.req.param();
    const normalizedUsername = username.toLowerCase();
    
    console.log('🔍 Checking username availability:', normalizedUsername);
    
    // Check if username exists in KV store
    const userId = await withTimeout(
      kv.get(`username:${normalizedUsername}`),
      2000,
      null
    );
    
    const isAvailable = !userId;
    
    console.log(`✅ Username "${username}" is ${isAvailable ? 'available' : 'taken'}`);
    
    return c.json({ available: isAvailable });
  } catch (err) {
    console.error('❌ Error checking username:', err);
    return c.json({ error: 'Check failed', details: err.message }, 500);
  }
});

// Get user profile by ID
app.get("/make-server-78efa14d/users/profile/:userId", async (c) => {
  try {
    const { userId } = c.req.param();
    console.log('👤 Fetching profile for user:', userId);
    
    const profile = await withTimeout(
      () => kv.get(`user:${userId}`),
      2500,
      null
    );
    
    if (profile) {
      console.log('✅ Profile found in KV:', profile);
      return c.json(profile);
    }

    // Profile missing from KV — look up from Supabase Auth and auto-create
    // Validate that userId is a valid UUID before calling Auth (Auth requires UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.log('⚠️ userId is not a valid UUID, skipping Auth lookup:', userId);
      return c.json({ error: 'Profile not found' }, 404);
    }

    console.log('⚠️ Profile not in KV, looking up from Auth for user:', userId);
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
      if (authError || !authData?.user) {
        console.error('❌ User not found in Auth either:', authError?.message);
        return c.json({ error: 'Profile not found' }, 404);
      }

      const authUser = authData.user;
      const username =
        authUser.user_metadata?.name ||
        authUser.user_metadata?.username ||
        authUser.email?.split('@')[0] ||
        'user';

      const newProfile = {
        userId,
        username,
        email: authUser.email || '',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
        bio: 'New to Vibe!',
        createdAt: authUser.created_at || new Date().toISOString(),
      };

      console.log('💾 Auto-creating missing KV profile:', newProfile);
      // Fire-and-forget — don't let a slow KV write block the response
      kv.set(`user:${userId}`, newProfile).catch((e: any) =>
        console.warn('⚠️ Auto-create KV write failed (non-critical):', e)
      );

      return c.json(newProfile);
    } catch (authLookupErr: any) {
      console.error('❌ Auth lookup failed:', authLookupErr.message);
      return c.json({ error: 'Profile not found' }, 404);
    }
  } catch (err: any) {
    console.error('❌ Error fetching user profile:', err);
    return c.json({ error: 'Internal server error', details: err.message }, 500);
  }
});

// Update user profile
app.put("/make-server-78efa14d/users/profile/:userId", async (c) => {
  try {
    const { userId } = c.req.param();
    const updates = await c.req.json();
    
    console.log('📝 Updating profile for user:', userId, updates);
    
    // Get existing profile with timeout
    let existingProfile = await withTimeout(
      kv.get(`user:${userId}`),
      1000, // Reduced from 2000ms to 1s
      null
    );
    
    if (!existingProfile) {
      console.log('⚠️ Profile not found, creating new profile for user:', userId);
      // Create a new profile if it doesn't exist
      existingProfile = {
        userId: userId,
        username: updates.username || 'user',
        avatar: updates.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
        bio: updates.bio || '',
        createdAt: new Date().toISOString()
      };
    }
    
    // Merge updates
    const updatedProfile = {
      ...existingProfile,
      ...updates,
      userId: existingProfile.userId, // Preserve userId
      updatedAt: new Date().toISOString()
    };
    
    // Save with timeout protection
    try {
      await withTimeout(
        kv.set(`user:${userId}`, updatedProfile),
        1000, // Reduced from 2000ms to 1s
        null
      );
      console.log('✅ Profile updated successfully');
    } catch (kvError) {
      console.warn('⚠️ KV save may have failed (non-critical):', kvError);
    }
    
    return c.json(updatedProfile);
    
  } catch (err: any) {
    console.error('❌ Error updating user profile:', err);
    return c.json({ error: 'Internal server error', message: err.message }, 500);
  }
});

// --- Posts API ---

// Create a post
app.post("/make-server-78efa14d/posts", async (c) => {
  let post: any;
  
  try {
    console.log('📝 Parsing post request...');
    
    // Parse request with explicit error handling
    try {
      post = await c.req.json();
    } catch (parseError: any) {
      console.error('❌ Failed to parse request body:', parseError.message);
      return c.json({ 
        error: 'Invalid request format. Please check your data.',
        details: parseError.message
      }, 400);
    }
    
    if (!post || !post.id || !post.userId) {
      console.error('❌ Invalid post data:', { hasPost: !!post, hasId: !!post?.id, hasUserId: !!post?.userId });
      return c.json({ 
        error: 'Invalid post data. Missing required fields.',
        required: ['id', 'userId']
      }, 400);
    }
    
    console.log('📝 Creating post:', post.id, 'for user:', post.userId);
    
    // Check post size before processing
    const postSize = JSON.stringify(post).length;
    console.log(`📊 Post size: ${(postSize / 1024).toFixed(2)} KB`);
    
    if (postSize > 1024 * 1024) { // 1MB limit for KV storage
      console.error('❌ Post too large for storage:', postSize, 'bytes');
      return c.json({ 
        error: 'Post data too large. Please use fewer or smaller images.',
        size: postSize,
        maxSize: 1024 * 1024
      }, 413);
    }
    
    // Store post with timeout protection
    console.log('💾 Saving post to KV store...');
    const saveResult = await withTimeout(
      Promise.all([
        kv.set(`post:${post.id}`, {
          ...post,
          createdAt: new Date().toISOString()
        }),
        // Also store a reference for user posts: userpost:{userId}:{postId}
        kv.set(`userpost:${post.userId}:${post.id}`, post.id)
      ]),
      2500, // Reduced timeout to ensure we respond before edge function timeout
      null
    );
    
    if (saveResult === null) {
      console.warn('⚠️ Post save timed out, but may have succeeded');
      return c.json({ 
        success: true, 
        warning: 'Save operation timed out. Post may be saved.',
        post 
      }, 202); // 202 Accepted
    }
    
    console.log('✅ Post created successfully');
    return c.json({ success: true, post });
    
  } catch (err: any) {
    console.error('❌ Error creating post:', err);
    console.error('Error stack:', err.stack);
    
    // Make sure we always return a response
    try {
      return c.json({ 
        error: 'Failed to create post',
        details: err.message || 'Unknown error',
        type: err.name || 'Error'
      }, 500);
    } catch (responseError) {
      // Last resort - return plain text
      console.error('❌ Failed to send JSON response:', responseError);
      return new Response('Internal server error', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
});

// Get posts by user ID
app.get("/make-server-78efa14d/users/:userId/posts", async (c) => {
  try {
    const { userId } = c.req.param();

    console.log('📂 Fetching posts for user:', userId);

    // Get all post IDs for this user — short timeout
    const postRefs = await withTimeout(
      kv.getByPrefix(`userpost:${userId}:`),
      1500,
      []
    );

    if (!postRefs || postRefs.length === 0) {
      console.log('⚠️ No posts found for user:', userId);
      return c.json([]);
    }

    // Cap at 20 most-recent refs to avoid blowing the time budget
    const limitedRefs = postRefs.slice(0, 20);

    // Fetch all posts in PARALLEL with a single shared timeout (not per-post)
    const rawPosts = await withTimeout(
      Promise.all(
        limitedRefs.map((postId: string) =>
          kv.get(`post:${postId}`).catch(() => null)
        )
      ),
      2000,
      []
    );

    const posts = (rawPosts || []).filter(Boolean);

    // Sort by creation date (newest first)
    posts.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    console.log(`✅ Found ${posts.length} posts for user ${userId}`);
    return c.json(posts);
  } catch (err) {
    console.error('❌ Error fetching user posts:', err);
    return c.json([], 500);
  }
});

// Get a single post
app.get("/make-server-78efa14d/posts/:postId", async (c) => {
  try {
    const { postId } = c.req.param();
    const post = await withTimeout(
      kv.get(`post:${postId}`),
      2000,
      null
    );
    
    if (post) {
      return c.json(post);
    } else {
      return c.json({ error: 'Post not found' }, 404);
    }
  } catch (err) {
    console.error('❌ Error fetching post:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update post (for likes, comments count, etc.)
app.put("/make-server-78efa14d/posts/:postId", async (c) => {
  try {
    const { postId } = c.req.param();
    const updates = await c.req.json();
    
    const existingPost = await withTimeout(
      kv.get(`post:${postId}`),
      2000,
      null
    );
    
    if (!existingPost) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    const updatedPost = {
      ...existingPost,
      ...updates,
      id: existingPost.id, // Preserve post ID
      updatedAt: new Date().toISOString()
    };
    
    await withTimeout(
      kv.set(`post:${postId}`, updatedPost),
      2000,
      null
    );
    
    return c.json(updatedPost);
  } catch (err) {
    console.error('❌ Error updating post:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Like a post
app.post("/make-server-78efa14d/posts/:postId/like", async (c) => {
  try {
    const { postId } = c.req.param();
    const { userId } = await c.req.json();
    
    console.log(`👍 User ${userId} liking post ${postId}`);
    
    const existingPost = await withTimeout(
      kv.get(`post:${postId}`),
      1500,
      null
    );
    
    if (!existingPost) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    const updatedPost = {
      ...existingPost,
      likes: (existingPost.likes || 0) + 1,
      updatedAt: new Date().toISOString()
    };
    
    await withTimeout(
      Promise.all([
        kv.set(`post:${postId}`, updatedPost),
        kv.set(`like:${userId}:${postId}`, { userId, postId, createdAt: new Date().toISOString() })
      ]),
      1500,
      null
    );
    
    console.log('✅ Post liked');
    return c.json({ success: true, likes: updatedPost.likes });
  } catch (err) {
    console.error('❌ Error liking post:', err);
    return c.json({ error: 'Failed to like post' }, 500);
  }
});

// Unlike a post
app.delete("/make-server-78efa14d/posts/:postId/like/:userId", async (c) => {
  try {
    const { postId, userId } = c.req.param();
    
    console.log(`👎 User ${userId} unliking post ${postId}`);
    
    const existingPost = await withTimeout(
      kv.get(`post:${postId}`),
      1500,
      null
    );
    
    if (!existingPost) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    const updatedPost = {
      ...existingPost,
      likes: Math.max((existingPost.likes || 0) - 1, 0),
      updatedAt: new Date().toISOString()
    };
    
    await withTimeout(
      Promise.all([
        kv.set(`post:${postId}`, updatedPost),
        kv.del(`like:${userId}:${postId}`)
      ]),
      1500,
      null
    );
    
    console.log('✅ Post unliked');
    return c.json({ success: true, likes: updatedPost.likes });
  } catch (err) {
    console.error('❌ Error unliking post:', err);
    return c.json({ error: 'Failed to unlike post' }, 500);
  }
});

// Dislike a post
app.post("/make-server-78efa14d/posts/:postId/dislike", async (c) => {
  try {
    const { postId } = c.req.param();
    const { userId } = await c.req.json();
    
    console.log(`👎 User ${userId} disliking post ${postId}`);
    
    const existingPost = await withTimeout(
      kv.get(`post:${postId}`),
      1500,
      null
    );
    
    if (!existingPost) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    const updatedPost = {
      ...existingPost,
      dislikes: (existingPost.dislikes || 0) + 1,
      updatedAt: new Date().toISOString()
    };
    
    await withTimeout(
      Promise.all([
        kv.set(`post:${postId}`, updatedPost),
        kv.set(`dislike:${userId}:${postId}`, { userId, postId, createdAt: new Date().toISOString() })
      ]),
      1500,
      null
    );
    
    console.log('✅ Post disliked');
    return c.json({ success: true, dislikes: updatedPost.dislikes });
  } catch (err) {
    console.error('❌ Error disliking post:', err);
    return c.json({ error: 'Failed to dislike post' }, 500);
  }
});

// Remove dislike from a post
app.delete("/make-server-78efa14d/posts/:postId/dislike/:userId", async (c) => {
  try {
    const { postId, userId } = c.req.param();
    
    console.log(`👍 User ${userId} removing dislike from post ${postId}`);
    
    const existingPost = await withTimeout(
      kv.get(`post:${postId}`),
      1500,
      null
    );
    
    if (!existingPost) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    const updatedPost = {
      ...existingPost,
      dislikes: Math.max((existingPost.dislikes || 0) - 1, 0),
      updatedAt: new Date().toISOString()
    };
    
    await withTimeout(
      Promise.all([
        kv.set(`post:${postId}`, updatedPost),
        kv.del(`dislike:${userId}:${postId}`)
      ]),
      1500,
      null
    );
    
    console.log('✅ Dislike removed');
    return c.json({ success: true, dislikes: updatedPost.dislikes });
  } catch (err) {
    console.error('❌ Error removing dislike:', err);
    return c.json({ error: 'Failed to remove dislike' }, 500);
  }
});

// Add comment to a post
app.post("/make-server-78efa14d/posts/:postId/comment", async (c) => {
  try {
    const { postId } = c.req.param();
    const comment = await c.req.json();
    
    console.log(`💬 Adding comment to post ${postId}`);
    
    const existingPost = await withTimeout(
      kv.get(`post:${postId}`),
      1500,
      null
    );
    
    if (!existingPost) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    const updatedPost = {
      ...existingPost,
      comments: (existingPost.comments || 0) + 1,
      commentsList: [...(existingPost.commentsList || []), comment],
      updatedAt: new Date().toISOString()
    };
    
    await withTimeout(
      kv.set(`post:${postId}`, updatedPost),
      1500,
      null
    );
    
    console.log('✅ Comment added');
    return c.json({ success: true, comments: updatedPost.comments, comment });
  } catch (err) {
    console.error('❌ Error adding comment:', err);
    return c.json({ error: 'Failed to add comment' }, 500);
  }
});

// Delete comment from a post
app.delete("/make-server-78efa14d/posts/:postId/comment/:commentId", async (c) => {
  try {
    const { postId, commentId } = c.req.param();
    
    console.log(`🗑️ Deleting comment ${commentId} from post ${postId}`);
    
    const existingPost = await withTimeout(
      kv.get(`post:${postId}`),
      1500,
      null
    );
    
    if (!existingPost) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    const updatedCommentsList = (existingPost.commentsList || []).filter((c: any) => c.id !== commentId);
    
    const updatedPost = {
      ...existingPost,
      comments: Math.max((existingPost.comments || 0) - 1, 0),
      commentsList: updatedCommentsList,
      updatedAt: new Date().toISOString()
    };
    
    await withTimeout(
      kv.set(`post:${postId}`, updatedPost),
      1500,
      null
    );
    
    console.log('✅ Comment deleted');
    return c.json({ success: true, comments: updatedPost.comments });
  } catch (err) {
    console.error('❌ Error deleting comment:', err);
    return c.json({ error: 'Failed to delete comment' }, 500);
  }
});

// --- Save / Bookmark API ---

// Toggle save on a post for a user
app.post("/make-server-78efa14d/posts/:postId/save", async (c) => {
  try {
    const { postId } = c.req.param();
    const { userId } = await c.req.json();
    if (!userId) return c.json({ error: 'userId required' }, 400);
    const key = `save:${userId}:${postId}`;
    const existing = await withTimeout(() => kv.get(key), 800, null);
    if (existing) {
      await withTimeout(() => kv.del(key), 800, null);
      console.log(`✅ Post ${postId} unsaved by ${userId}`);
      return c.json({ saved: false });
    } else {
      await withTimeout(() => kv.set(key, { postId, userId, savedAt: new Date().toISOString() }), 800, null);
      console.log(`✅ Post ${postId} saved by ${userId}`);
      return c.json({ saved: true });
    }
  } catch (err) {
    console.error('❌ Error toggling save:', err);
    return c.json({ error: 'Failed to toggle save' }, 500);
  }
});

// Get all saved post IDs for a user
app.get("/make-server-78efa14d/users/:userId/saves", async (c) => {
  try {
    const { userId } = c.req.param();
    const saves = await withTimeout(() => kv.getByPrefix(`save:${userId}:`), 1000, []);
    const postIds = (saves || []).map((s: any) => s.postId).filter(Boolean);
    return c.json({ postIds });
  } catch (err) {
    console.error('❌ Error fetching saves:', err);
    return c.json({ postIds: [] });
  }
});

// Delete a post (owner only)
app.delete("/make-server-78efa14d/posts/:postId", async (c) => {
  try {
    const { postId } = c.req.param();
    const userId = c.req.header('X-User-Id');
    console.log(`🗑️ Deleting post ${postId} by ${userId}`);
    const existing = await withTimeout(() => kv.get(`post:${postId}`), 1000, null);
    if (!existing) return c.json({ error: 'Post not found' }, 404);
    if (userId && existing.userId && existing.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    await withTimeout(() => kv.del(`post:${postId}`), 1000, null);
    console.log(`✅ Post ${postId} deleted`);
    return c.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting post:', err);
    return c.json({ error: 'Failed to delete post' }, 500);
  }
});

// Mark messages in a conversation as read for a user
app.put("/make-server-78efa14d/conversations/:conversationId/read/:userId", async (c) => {
  try {
    const { conversationId, userId } = c.req.param();
    const conv = await withTimeout(() => kv.get(`conv:${userId}:${conversationId}`), 800, null);
    if (conv) {
      await withTimeout(() => kv.set(`conv:${userId}:${conversationId}`, { ...conv, unreadCount: 0 }), 800, null);
    }
    const msgs = await withTimeout(() => kv.getByPrefix(`msg:${conversationId}:`), 1000, []);
    if (msgs && msgs.length > 0) {
      const updates = msgs
        .filter((m: any) => m.senderId !== userId && !m.read)
        .map((m: any) => kv.set(`msg:${conversationId}:${m.id}`, { ...m, read: true }));
      if (updates.length > 0) await withTimeout(Promise.all(updates), 2000, null);
    }
    return c.json({ success: true });
  } catch (err) {
    console.error('❌ Error marking messages as read:', err);
    return c.json({ error: 'Failed to mark as read' }, 500);
  }
});

// --- Followers API ---

// Follow a user
app.post("/make-server-78efa14d/follow", async (c) => {
  try {
    const { followerId, followingId } = await c.req.json();
    console.log(`👥 User ${followerId} following ${followingId}`);

    const followerProfile = await withTimeout(() => kv.get(`user:${followerId}`), 800, null);
    const notificationId = `notif-${Date.now()}-${followerId}`;

    await withTimeout(
      Promise.all([
        kv.set(`follower:${followerId}:${followingId}`, {
          followerId, followingId, createdAt: new Date().toISOString()
        }),
        kv.set(`following:${followingId}:${followerId}`, {
          followerId, followingId, createdAt: new Date().toISOString()
        }),
        kv.set(`notification:${followingId}:${notificationId}`, {
          id: notificationId,
          type: 'follower',
          userId: followerId,
          username: followerProfile?.username || 'Someone',
          userAvatar: followerProfile?.avatar ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
          message: 'started following you',
          timestamp: 'just now',
          read: false,
          createdAt: new Date().toISOString()
        })
      ]),
      1500,
      null
    );

    console.log('✅ Follow relationship created');
    return c.json({ success: true });
  } catch (err) {
    console.error('❌ Error creating follow relationship:', err);
    return c.json({ error: 'Failed to follow user' }, 500);
  }
});

// Unfollow a user
app.delete("/make-server-78efa14d/follow/:followerId/:followingId", async (c) => {
  try {
    const { followerId, followingId } = c.req.param();
    
    console.log(`👥 User ${followerId} unfollowing ${followingId}`);
    
    // Delete both relationships with timeout protection
    await withTimeout(
      Promise.all([
        kv.del(`follower:${followerId}:${followingId}`),
        kv.del(`following:${followingId}:${followerId}`)
      ]),
      2000,
      null
    );
    
    console.log('✅ Follow relationship deleted');
    return c.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting follow relationship:', err);
    return c.json({ error: 'Failed to unfollow user' }, 500);
  }
});

// Get follower count
app.get("/make-server-78efa14d/users/:userId/followers/count", async (c) => {
  try {
    const { userId } = c.req.param();
    const followers = await withTimeout(() => kv.getByPrefix(`following:${userId}:`), 800, []);
    const count = followers ? followers.length : 0;
    console.log(`📊 User ${userId} has ${count} followers`);
    return c.json({ count });
  } catch (err) {
    console.error('❌ Error fetching follower count:', err);
    return c.json({ count: 0, error: err.message }, 500);
  }
});

// Get following count
app.get("/make-server-78efa14d/users/:userId/following/count", async (c) => {
  try {
    const { userId } = c.req.param();
    const following = await withTimeout(() => kv.getByPrefix(`follower:${userId}:`), 800, []);
    const count = following ? following.length : 0;
    console.log(`📊 User ${userId} is following ${count} users`);
    return c.json({ count });
  } catch (err) {
    console.error('❌ Error fetching following count:', err);
    return c.json({ count: 0, error: err.message }, 500);
  }
});

// Get list of users that userId follows (with profile data)
app.get("/make-server-78efa14d/users/:userId/following", async (c) => {
  try {
    const { userId } = c.req.param();

    console.log(`👥 Fetching following list for user: ${userId}`);

    // Step 1 — get relationship records (1.2 s budget)
    const relationships = await withTimeout(
      kv.getByPrefix(`follower:${userId}:`),
      1200,
      []
    );

    if (!relationships || relationships.length === 0) {
      console.log(`ℹ️ User ${userId} follows nobody`);
      return c.json([]);
    }

    // Cap at 50 to keep the total response time predictable
    const limited = relationships.slice(0, 50);

    // Step 2 — fetch all profiles in parallel (1.8 s budget)
    const rawProfiles = await withTimeout(
      Promise.all(
        limited.map(async (rel: any) => {
          const fid = rel.followingId;
          const profile = await kv.get(`user:${fid}`).catch(() => null);
          return {
            id: fid,
            name: profile?.username || fid,
            username: profile?.username || fid,
            avatar: profile?.avatar ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
            bio: profile?.bio || '',
            isFollowing: true,
            followedAt: rel.createdAt,
          };
        })
      ),
      1800,
      []
    );

    const profiles = rawProfiles ?? [];
    console.log(`✅ User ${userId} follows ${profiles.length} users`);
    return c.json(profiles);
  } catch (err) {
    console.error('❌ Error fetching following list:', err);
    return c.json([]);
  }
});

// Check if user A follows user B
app.get("/make-server-78efa14d/follow/check/:followerId/:followingId", async (c) => {
  try {
    const { followerId, followingId } = c.req.param();
    
    const relationship = await withTimeout(
      kv.get(`follower:${followerId}:${followingId}`),
      2500,
      null
    );
    const isFollowing = !!relationship;
    
    return c.json({ isFollowing });
  } catch (err) {
    console.error('❌ Error checking follow status:', err);
    return c.json({ isFollowing: false, error: err.message }, 500);
  }
});

// Get list of users who follow userId (with profile data)
app.get("/make-server-78efa14d/users/:userId/followers", async (c) => {
  try {
    const { userId } = c.req.param();

    console.log(`👥 Fetching followers list for user: ${userId}`);

    // `following:${userId}:${followerId}` means followerId follows userId
    const relationships = await withTimeout(
      kv.getByPrefix(`following:${userId}:`),
      1200,
      []
    );

    if (!relationships || relationships.length === 0) {
      console.log(`ℹ️ User ${userId} has no followers`);
      return c.json([]);
    }

    const limited = relationships.slice(0, 50);

    const rawProfiles = await withTimeout(
      Promise.all(
        limited.map(async (rel: any) => {
          const fid = rel.followerId;
          const profile = await kv.get(`user:${fid}`).catch(() => null);
          return {
            id: fid,
            name: profile?.username || fid,
            username: profile?.username || fid,
            avatar: profile?.avatar ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
            bio: profile?.bio || '',
            isFollowing: false,
            followedAt: rel.createdAt,
          };
        })
      ),
      1800,
      []
    );

    const profiles = rawProfiles ?? [];
    console.log(`✅ User ${userId} has ${profiles.length} followers`);
    return c.json(profiles);
  } catch (err) {
    console.error('❌ Error fetching followers list:', err);
    return c.json([]);
  }
});

// --- Notifications API ---

// Get notifications for a user
app.get("/make-server-78efa14d/notifications/:userId", async (c) => {
  try {
    const { userId } = c.req.param();
    console.log('🔔 Fetching notifications for user:', userId);

    const notifications = await withTimeout(() => kv.getByPrefix(`notification:${userId}:`), 800, []);
    const sortedNotifications = (notifications || [])
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 50); // cap at 50 to keep response small

    console.log(`✅ Found ${sortedNotifications.length} notifications`);
    return c.json(sortedNotifications);
  } catch (err) {
    console.error('❌ Error fetching notifications:', err);
    return c.json([]);
  }
});

// Mark notification as read
app.put("/make-server-78efa14d/notifications/:userId/:notificationId/read", async (c) => {
  try {
    const { userId, notificationId } = c.req.param();
    const notification = await withTimeout(
      kv.get(`notification:${userId}:${notificationId}`), 800, null
    );
    if (notification) {
      await withTimeout(
        kv.set(`notification:${userId}:${notificationId}`, { ...notification, read: true }),
        800, null
      );
      return c.json({ success: true });
    }
    return c.json({ error: 'Notification not found' }, 404);
  } catch (err) {
    console.error('❌ Error marking notification as read:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Mark all notifications as read
app.put("/make-server-78efa14d/notifications/:userId/read-all", async (c) => {
  try {
    const { userId } = c.req.param();
    const notifications = await withTimeout(() => kv.getByPrefix(`notification:${userId}:`), 800, []);

    // Update all in parallel — single shared 1.5 s budget
    await withTimeout(
      Promise.all(
        (notifications || []).map((n: any) =>
          kv.set(`notification:${userId}:${n.id}`, { ...n, read: true })
        )
      ),
      1500,
      null
    );

    return c.json({ success: true });
  } catch (err) {
    console.error('❌ Error marking all notifications as read:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get unread notification count
app.get("/make-server-78efa14d/notifications/:userId/unread-count", async (c) => {
  try {
    const { userId } = c.req.param();
    const notifications = await withTimeout(() => kv.getByPrefix(`notification:${userId}:`), 800, []);
    const unreadCount = (notifications || []).filter((n: any) => !n.read).length;
    return c.json({ count: unreadCount });
  } catch (err) {
    console.error('❌ Error fetching unread notification count:', err);
    return c.json({ count: 0, error: err.message }, 500);
  }
});

// --- Messaging API ---

// Get conversations for a user
app.get("/make-server-78efa14d/conversations/:userId", async (c) => {
  try {
    const { userId } = c.req.param();
    const convs = await withTimeout(() => kv.getByPrefix(`conv:${userId}:`), 800, []);
    return c.json(convs ?? []);
  } catch (err) {
    console.error('❌ Error fetching conversations:', err);
    return c.json([]);
  }
});

// Get messages for a conversation
app.get("/make-server-78efa14d/messages/:conversationId", async (c) => {
  try {
    const { conversationId } = c.req.param();
    const msgs = await withTimeout(() => kv.getByPrefix(`msg:${conversationId}:`), 800, []);
    const sortedMsgs = (msgs || []).sort((a: any, b: any) =>
      (a.id || '').localeCompare(b.id || '')
    );
    return c.json(sortedMsgs);
  } catch (err) {
    console.error('❌ Error fetching messages:', err);
    return c.json([]);
  }
});

// Send a message
app.post("/make-server-78efa14d/message", async (c) => {
  try {
    const { conversationId, message, senderConv, receiverConv, receiverId } = await c.req.json();
    const operations: Promise<any>[] = [];

    if (message && conversationId)
      operations.push(kv.set(`msg:${conversationId}:${message.id}`, message));
    if (senderConv && message.senderId)
      operations.push(kv.set(`conv:${message.senderId}:${conversationId}`, senderConv));
    if (receiverConv && receiverId)
      operations.push(kv.set(`conv:${receiverId}:${conversationId}`, receiverConv));

    // Create a notification for the receiver so the popup triggers
    if (receiverId && message && message.senderId && receiverId !== message.senderId) {
      const notifId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      operations.push(kv.set(`notification:${receiverId}:${notifId}`, {
        id: notifId,
        type: 'message',
        message: message.text ? (message.text.length > 60 ? message.text.slice(0, 60) + '…' : message.text) : 'sent you a message',
        username: receiverConv?.username || senderConv?.username || 'Someone',
        userAvatar: receiverConv?.userAvatar || senderConv?.userAvatar || '',
        userId: message.senderId,
        conversationId,
        read: false,
        createdAt: new Date().toISOString(),
      }));
    }

    await withTimeout(Promise.all(operations), 1500, null);
    return c.json({ success: true });
  } catch (err) {
    console.error('❌ Error sending message:', err);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Delete a message (unsend)
app.delete("/make-server-78efa14d/message/:conversationId/:messageId", async (c) => {
  try {
    const { conversationId, messageId } = c.req.param();
    await withTimeout(() => kv.del(`msg:${conversationId}:${messageId}`), 800, null);
    return c.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting message:', err);
    return c.json({ error: 'Failed to delete message' }, 500);
  }
});

// Delete a conversation and all its messages
app.delete("/make-server-78efa14d/conversation/:userId/:conversationId", async (c) => {
  try {
    const { userId, conversationId } = c.req.param();
    const operations: Promise<any>[] = [];

    // Delete the conversation entry for this user
    operations.push(kv.del(`conv:${userId}:${conversationId}`));

    // Delete all messages in this conversation
    const msgs = await withTimeout(() => kv.getByPrefix(`msg:${conversationId}:`), 800, []);
    if (msgs && msgs.length > 0) {
      const msgKeys = msgs.map((m: any) => `msg:${conversationId}:${m.id}`);
      operations.push(kv.mdel(msgKeys));
    }

    await withTimeout(Promise.all(operations), 2000, null);
    return c.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting conversation:', err);
    return c.json({ error: 'Failed to delete conversation' }, 500);
  }
});

// Update a conversation
app.post("/make-server-78efa14d/conversation", async (c) => {
  try {
    const { userId, conversationId, conversation } = await c.req.json();
    if (userId && conversationId && conversation) {
      await withTimeout(() => kv.set(`conv:${userId}:${conversationId}`, conversation), 800, null);
    }
    return c.json({ success: true });
  } catch (err) {
    console.error('❌ Error updating conversation:', err);
    return c.json({ error: 'Failed to update conversation' }, 500);
  }
});

// --- Reports API ---

// Submit a report
app.post("/make-server-78efa14d/reports", async (c) => {
  try {
    const { postId, postUsername, reason, details, reporterId } = await c.req.json();
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🚩 New report submitted:', { reportId, postId, reason });

    const report = {
      id: reportId, postId, postUsername, reason, details, reporterId,
      status: 'pending', createdAt: new Date().toISOString()
    };

    await withTimeout(() => kv.set(`report:${reportId}`, report), 800, null);
    console.log('✅ Report saved successfully');
    return c.json({ success: true, reportId });
  } catch (err) {
    console.error('❌ Error submitting report:', err);
    return c.json({ error: 'Failed to submit report' }, 500);
  }
});

// Get reports for moderation (admin endpoint)
app.get("/make-server-78efa14d/reports", async (c) => {
  try {
    console.log('📋 Fetching all reports');
    const reports = await withTimeout(() => kv.getByPrefix('report:'), 800, []);
    const sortedReports = (reports || [])
      .sort((a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    console.log(`✅ Found ${sortedReports.length} reports`);
    return c.json(sortedReports);
  } catch (err) {
    console.error('❌ Error fetching reports:', err);
    return c.json([]);
  }
});

// --- Storage Upload API ---
const BUCKET_NAME = 'make-78efa14d-media';
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365; // 1 year in seconds

// Upload a file (base64) to Supabase Storage and return a signed URL
app.post("/make-server-78efa14d/upload", async (c) => {
  try {
    // Support both multipart/form-data (preferred) and JSON (legacy)
    const ct = c.req.header('content-type') || '';
    let fileBytes: Uint8Array;
    let fileName: string;
    let contentType: string;
    let folder: string;

    if (ct.includes('multipart/form-data')) {
      // ── Multipart upload (preferred — raw binary, no base64 inflation) ──
      const body = await c.req.parseBody();
      const file = body['file'];
      fileName = (body['fileName'] as string) || 'upload.jpg';
      contentType = (body['contentType'] as string) || 'image/jpeg';
      folder = (body['folder'] as string) || 'uploads';

      if (!file || !(file instanceof File)) {
        return c.json({ error: 'Missing file in multipart body' }, 400);
      }
      const arrayBuf = await file.arrayBuffer();
      fileBytes = new Uint8Array(arrayBuf);
    } else {
      // ── JSON / base64 upload (legacy fallback) ──
      const { base64Data, fileName: fn, contentType: ct2, folder: f } = await c.req.json();
      fileName = fn || 'upload.jpg';
      contentType = ct2 || 'image/jpeg';
      folder = f || 'uploads';

      if (!base64Data || !fileName) {
        return c.json({ error: 'Missing base64Data or fileName' }, 400);
      }

      const raw = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const binaryStr = atob(raw);
      fileBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        fileBytes[i] = binaryStr.charCodeAt(i);
      }
    }

    const sizeKB = (fileBytes.length / 1024).toFixed(1);
    console.log(`📤 Upload request: ${fileName} (${contentType}) folder=${folder} size=${sizeKB}KB`);

    // Build storage path: folder/timestamp-randomId-filename
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 80);
    const randomId = Math.random().toString(36).substring(2, 10);
    const storagePath = `${folder}/${Date.now()}-${randomId}-${safeName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBytes, {
        contentType: contentType || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      return c.json({ error: 'Upload failed', details: uploadError.message }, 500);
    }

    console.log('✅ File uploaded to storage:', uploadData.path);

    // Create a signed URL (valid for 1 year)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);

    if (signedError || !signedData?.signedUrl) {
      console.error('❌ Signed URL error:', signedError);
      return c.json({ error: 'Failed to create signed URL', details: signedError?.message }, 500);
    }

    console.log(`✅ Signed URL created for ${storagePath}`);

    return c.json({
      success: true,
      url: signedData.signedUrl,
      path: storagePath,
      size: fileBytes.length,
    });
  } catch (err: any) {
    console.error('❌ Upload endpoint error:', err);
    return c.json({ error: 'Upload failed', details: err.message }, 500);
  }
});

// Batch upload multiple files — accepts an array of { base64Data, fileName, contentType, folder }
// (legacy JSON endpoint — kept for backward compat but frontend now uses sequential single uploads)
app.post("/make-server-78efa14d/upload/batch", async (c) => {
  try {
    const { files } = await c.req.json();

    if (!Array.isArray(files) || files.length === 0) {
      return c.json({ error: 'No files provided' }, 400);
    }

    if (files.length > 10) {
      return c.json({ error: 'Maximum 10 files per batch' }, 400);
    }

    console.log(`📤 Batch upload: ${files.length} files`);

    const results = await Promise.all(
      files.map(async (file: any, index: number) => {
        try {
          const { base64Data, fileName, contentType, folder } = file;
          if (!base64Data || !fileName) {
            return { index, success: false, error: 'Missing data' };
          }

          const raw = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
          const binaryStr = atob(raw);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }

          const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 80);
          const randomId = Math.random().toString(36).substring(2, 10);
          const storagePath = `${folder || 'uploads'}/${Date.now()}-${randomId}-${safeName}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, bytes, {
              contentType: contentType || 'image/jpeg',
              upsert: false,
            });

          if (uploadError) {
            console.error(`❌ Batch file ${index} upload error:`, uploadError);
            return { index, success: false, error: uploadError.message };
          }

          const { data: signedData, error: signedError } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);

          if (signedError || !signedData?.signedUrl) {
            return { index, success: false, error: signedError?.message || 'Signed URL failed' };
          }

          return { index, success: true, url: signedData.signedUrl, path: storagePath };
        } catch (fileErr: any) {
          return { index, success: false, error: fileErr.message };
        }
      })
    );

    const succeeded = results.filter(r => r.success).length;
    console.log(`✅ Batch upload complete: ${succeeded}/${files.length} succeeded`);

    return c.json({ success: true, results });
  } catch (err: any) {
    console.error('❌ Batch upload error:', err);
    return c.json({ error: 'Batch upload failed', details: err.message }, 500);
  }
});

// ─── Collection endpoints ─────────────────────────────────────────────────

// GET /api/collections/posts — Get all collection-post mappings (returns full snapshots)
app.get('/make-server-78efa14d/api/collections/posts', async (c) => {
  try {
    const colIds = ['col1', 'col2', 'col3', 'col4'];
    const keys = colIds.map(id => `collection_posts:${id}`);
    const values = await withTimeout(() => kv.mget(keys), 800, []);
    const mapping: Record<string, any[]> = {};
    colIds.forEach((id, i) => {
      const raw = values[i];
      if (Array.isArray(raw)) {
        // Compat: old-format entries (plain strings) become {id: string}
        mapping[id] = raw.map((item: any) => typeof item === 'string' ? { id: item } : item);
      } else {
        mapping[id] = [];
      }
    });
    return c.json({ collections: mapping });
  } catch (error) {
    console.log(`❌ Error fetching collection posts: ${error}`);
    return c.json({ collections: {} });
  }
});

// POST /api/collections/:colId/posts — Add a post snapshot to a collection
app.post('/make-server-78efa14d/api/collections/:colId/posts', async (c) => {
  try {
    const colId = c.req.param('colId');
    const { postId, postSnapshot } = await c.req.json();
    if (!postId) return c.json({ error: 'postId is required' }, 400);

    const key = `collection_posts:${colId}`;
    const existing: any[] = await withTimeout(() => kv.get(key), 800, null) || [];
    // Normalise old string entries
    const normalised = existing.map((item: any) => typeof item === 'string' ? { id: item } : item);

    if (!normalised.some((item: any) => item.id === postId)) {
      const entry = postSnapshot ? { ...postSnapshot, id: postId } : { id: postId };
      normalised.push(entry);
      await withTimeout(() => kv.set(key, normalised), 800, undefined);
    }
    return c.json({ success: true, posts: normalised });
  } catch (error) {
    console.log(`❌ Error adding post to collection: ${error}`);
    return c.json({ error: 'Failed to add post to collection' }, 500);
  }
});

// DELETE /api/collections/:colId/posts/:postId — Remove a post from a collection
app.delete('/make-server-78efa14d/api/collections/:colId/posts/:postId', async (c) => {
  try {
    const colId = c.req.param('colId');
    const postId = c.req.param('postId');

    const key = `collection_posts:${colId}`;
    const existing: any[] = await withTimeout(() => kv.get(key), 800, null) || [];
    const updated = existing.filter((item: any) => {
      const itemId = typeof item === 'string' ? item : item.id;
      return itemId !== postId;
    });
    await withTimeout(() => kv.set(key, updated), 800, undefined);
    return c.json({ success: true, posts: updated });
  } catch (error) {
    console.log(`❌ Error removing post from collection: ${error}`);
    return c.json({ error: 'Failed to remove post from collection' }, 500);
  }
});

// ─── Poll Vote endpoint ───────────────────────────────────────────────────
app.post("/make-server-78efa14d/posts/:postId/poll-vote", async (c) => {
  try {
    const { postId } = c.req.param();
    const { userId, optionIndex } = await c.req.json();
    if (!userId || optionIndex === undefined) {
      return c.json({ error: 'Missing userId or optionIndex' }, 400);
    }
    const voteKey = `poll-vote:${userId}:${postId}`;
    const existingVote = await withTimeout(() => kv.get(voteKey), 1500, null);
    if (existingVote !== null) {
      return c.json({ error: 'Already voted' }, 409);
    }
    const existingPost = await withTimeout(() => kv.get(`post:${postId}`), 1500, null);
    if (existingPost && existingPost.poll) {
      const updatedVotes = [...(existingPost.poll.votes || [])];
      updatedVotes[optionIndex] = (updatedVotes[optionIndex] || 0) + 1;
      const updatedPost = { ...existingPost, poll: { ...existingPost.poll, votes: updatedVotes }, updatedAt: new Date().toISOString() };
      await withTimeout(() => Promise.all([kv.set(`post:${postId}`, updatedPost), kv.set(voteKey, { userId, postId, optionIndex, createdAt: new Date().toISOString() })]), 1500, null);
      return c.json({ success: true, votes: updatedVotes });
    }
    await withTimeout(() => kv.set(voteKey, { userId, postId, optionIndex, createdAt: new Date().toISOString() }), 800, null);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('❌ Error recording poll vote:', err);
    return c.json({ error: 'Failed to record vote', details: err.message }, 500);
  }
});

// Like / unlike a comment
app.post("/make-server-78efa14d/posts/:postId/comment/:commentId/like", async (c) => {
  try {
    const { postId, commentId } = c.req.param();
    const { userId } = await c.req.json();
    if (!userId) return c.json({ error: 'userId required' }, 400);

    const likeKey = `comment-like:${userId}:${commentId}`;
    const existing = await withTimeout(() => kv.get(likeKey), 1500, null);
    const existingPost = await withTimeout(() => kv.get(`post:${postId}`), 1500, null);
    if (!existingPost) return c.json({ error: 'Post not found' }, 404);

    const isLiked = existing !== null;

    function toggleCommentLike(comments: any[], targetId: string, liked: boolean): any[] {
      return comments.map((comment: any) => {
        if (comment.id === targetId) {
          return { ...comment, likes: liked ? Math.max((comment.likes || 0) - 1, 0) : (comment.likes || 0) + 1, isLiked: !liked };
        }
        if (comment.replies?.length) {
          return { ...comment, replies: toggleCommentLike(comment.replies, targetId, liked) };
        }
        return comment;
      });
    }

    const updatedPost = {
      ...existingPost,
      commentsList: toggleCommentLike(existingPost.commentsList || [], commentId, isLiked),
      updatedAt: new Date().toISOString(),
    };

    await withTimeout(() => Promise.all([
      kv.set(`post:${postId}`, updatedPost),
      isLiked ? kv.del(likeKey) : kv.set(likeKey, { userId, commentId, createdAt: new Date().toISOString() }),
    ]), 1500, null);

    console.log(`${isLiked ? '💔' : '❤️'} Comment ${commentId} like toggled by ${userId}`);
    return c.json({ success: true, isLiked: !isLiked });
  } catch (err: any) {
    console.error('❌ Error toggling comment like:', err);
    return c.json({ error: 'Failed to toggle like', details: err.message }, 500);
  }
});

// Add reply to a top-level comment
app.post("/make-server-78efa14d/posts/:postId/comment/:commentId/reply", async (c) => {
  try {
    const { postId, commentId } = c.req.param();
    const reply = await c.req.json();
    if (!reply?.id || !reply?.userId) return c.json({ error: 'Invalid reply payload' }, 400);

    const existingPost = await withTimeout(() => kv.get(`post:${postId}`), 1500, null);
    if (!existingPost) return c.json({ error: 'Post not found' }, 404);

    const updatedCommentsList = (existingPost.commentsList || []).map((comment: any) => {
      if (comment.id === commentId) {
        return { ...comment, replies: [...(comment.replies || []), reply] };
      }
      return comment;
    });

    await withTimeout(() => kv.set(`post:${postId}`, {
      ...existingPost,
      commentsList: updatedCommentsList,
      updatedAt: new Date().toISOString(),
    }), 1500, null);

    console.log(`↩️ Reply added to comment ${commentId} on post ${postId}`);
    return c.json({ success: true, reply });
  } catch (err: any) {
    console.error('❌ Error adding reply:', err);
    return c.json({ error: 'Failed to add reply', details: err.message }, 500);
  }
});

// Catch-all for undefined routes - MUST be last
app.all('*', (c) => {
  console.log('⚠️ Route not found:', c.req.method, c.req.url);
  return c.json({ error: 'Route not found', method: c.req.method, url: c.req.url }, 404);
});

// ─── Resilient response wrapper ───────────────────────────────────────────
// The "Http: connection closed before message completed" error is thrown
// inside Deno's internal respondWith() when the TCP socket closes while the
// response body is still being written (streaming). We cannot catch it with
// try/catch in the route handler because it fires AFTER the handler returns.
//
// Fix: buffer the entire response body into memory so Deno writes it as a
// single, non-streaming chunk. This eliminates the multi-step streaming that
// races against client disconnects. For API payloads (JSON) this is fine —
// they are small.
async function resilientResponse(res: Response): Promise<Response> {
  // No body (204, 304, HEAD, 499 …) — nothing to buffer.
  if (!res.body) return res;

  try {
    // Read the entire body into an ArrayBuffer — collapses the stream.
    const buf = await res.arrayBuffer();

    // Return a new Response with the buffered body — fully non-streaming.
    return new Response(buf, {
      status:     res.status,
      statusText: res.statusText,
      headers:    res.headers,
    });
  } catch (err: unknown) {
    // Body read failed (e.g., upstream error or abort).
    if (isConnectionError(err) || (err as any)?.name === 'AbortError') {
      return new Response(null, { status: 499 });
    }
    console.error('⚠️ Failed to buffer response body:', err);
    return new Response('Bad Gateway', { status: 502 });
  }
}
// ─────────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Client already gone before we even start — skip processing entirely.
  if (req.signal?.aborted) return new Response(null, { status: 499 });

  try {
    const res = await app.fetch(req);

    // Client disconnected while we were processing — no point sending.
    if (req.signal?.aborted) return new Response(null, { status: 499 });

    // Buffer the body so respondWith() writes a single non-streaming chunk.
    return await resilientResponse(res);
  } catch (err: unknown) {
    if (isConnectionError(err) || (err as any)?.name === 'AbortError') {
      return new Response(null, { status: 499 });
    }
    console.error('❌ Unhandled handler error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
});