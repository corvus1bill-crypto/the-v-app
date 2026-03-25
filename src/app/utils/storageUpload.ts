/**
 * Supabase Storage upload utility.
 *
 * Uploads raw Blob / File objects to the server's `/upload` endpoint
 * using multipart/form-data (NOT base64 JSON) for reliability.
 * The server stores them in Supabase Storage and returns persistent signed URLs.
 */

import { projectId, publicAnonKey } from '../supabaseClient';

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d`;

export interface UploadResult {
  success: boolean;
  url?: string;      // Signed URL that persists across sessions
  path?: string;     // Storage path for reference
  error?: string;
}

/**
 * Upload a single Blob/File to Supabase Storage via multipart form-data.
 *
 * Also accepts a base64 data-URL string for backward compatibility — it will
 * be converted to a Blob on the client side before uploading.
 *
 * @param data       Blob, File, or base64 data-URL string
 * @param fileName   Desired filename (e.g. "post-image.jpg")
 * @param folder     Storage folder — "posts", "avatars", "thumbnails", etc.
 * @param contentType MIME type, defaults to "image/jpeg"
 */
export async function uploadToStorage(
  data: Blob | string,
  fileName: string,
  folder: string = 'posts',
  contentType: string = 'image/jpeg'
): Promise<UploadResult> {
  try {
    // Skip if already a remote URL
    if (typeof data === 'string' && data.startsWith('http')) {
      return { success: true, url: data };
    }

    // Convert base64/data-URL string → Blob (backward compat)
    let blob: Blob;
    if (typeof data === 'string') {
      // Must be a data URI or raw base64
      if (!data.startsWith('data:') && !data.startsWith('/9j/')) {
        console.warn('⚠️ uploadToStorage: unrecognised data format, skipping');
        return { success: false, error: 'Invalid data format' };
      }
      blob = dataUrlToBlob(data);
    } else {
      blob = data;
    }

    const sizeKB = (blob.size / 1024).toFixed(1);
    console.log(`📤 Uploading ${fileName} (${sizeKB} KB) to storage (folder: ${folder})…`);

    // Build FormData — sends raw binary, no base64 inflation
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('fileName', fileName);
    formData.append('folder', folder);
    formData.append('contentType', contentType);

    const response = await fetch(`${SERVER_BASE}/upload`, {
      method: 'POST',
      headers: {
        // Do NOT set Content-Type — browser sets it with boundary for multipart
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('❌ Upload failed:', response.status, err);
      return { success: false, error: err.error || `HTTP ${response.status}` };
    }

    const result = await response.json();

    if (result.success && result.url) {
      console.log(`✅ Uploaded ${fileName} → ${result.url.substring(0, 80)}…`);
      return { success: true, url: result.url, path: result.path };
    }

    return { success: false, error: result.error || 'Unknown upload error' };
  } catch (err: any) {
    console.error('❌ Upload error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Upload multiple files sequentially.
 * Each file can be a Blob or base64 string.
 */
export async function uploadBatchToStorage(
  files: Array<{
    data: Blob | string;       // Blob preferred; base64 string for compat
    base64Data?: string;       // DEPRECATED — use `data` instead
    fileName: string;
    folder?: string;
    contentType?: string;
  }>
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const file of files) {
    // Resolve the data source: prefer `data`, fall back to `base64Data`
    const source = file.data || file.base64Data || '';

    // Skip remote URLs
    if (typeof source === 'string' && source.startsWith('http')) {
      results.push({ success: true, url: source });
      continue;
    }

    const result = await uploadToStorage(
      source,
      file.fileName,
      file.folder || 'posts',
      file.contentType || 'image/jpeg'
    );
    results.push(result);
  }

  return results;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Convert a data-URL (or raw base64) string into a Blob.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  let mime = 'image/jpeg';
  let b64 = dataUrl;

  if (dataUrl.includes(',')) {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    if (mimeMatch) mime = mimeMatch[1];
    b64 = parts[1];
  }

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}
