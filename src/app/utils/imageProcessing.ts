// Dynamic imports to avoid hard dependencies
let heic2any: any = null;
let imageCompression: any = null;

// Lazy load optional libraries
async function loadImageLibraries() {
  if (!heic2any) {
    try {
      heic2any = await import('heic2any').then(m => m.default);
    } catch (e) {
      console.warn('heic2any not available');
    }
  }
  if (!imageCompression) {
    try {
      imageCompression = await import('browser-image-compression').then(m => m.default);
    } catch (e) {
      console.warn('browser-image-compression not available');
    }
  }
}

// --- Constants ---
const MAX_FILE_SIZE_MB = 500;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const MASTER_WIDTH = 1440;         // up from 1080 — higher resolution master
const THUMBNAIL_WIDTH = 400;

// Target file sizes — 2 MB ceiling keeps quality high before compression kicks in
const TARGET_MASTER_KB_MIN = 150;
const TARGET_MASTER_KB_MAX = 2048;

// Supported aspect ratios — landscape widest, portrait tallest
export type AspectRatioKey = '1:1' | '4:5' | '9:16' | '1.91:1' | 'original';

export const ASPECT_RATIOS: Record<AspectRatioKey, { label: string; value: number }> = {
  '1:1':    { label: 'Square',    value: 1 },
  '4:5':    { label: 'Portrait',  value: 4 / 5 },
  '9:16':   { label: 'Story',     value: 9 / 16 },
  '1.91:1': { label: 'Landscape', value: 1.91 },
  'original': { label: 'Original', value: 0 }, // 0 = use natural ratio
};

// Max vertical ratio: 9:16 → anything taller must be cropped
const MAX_PORTRAIT_RATIO = 9 / 16; // width/height

export interface ProcessedImage {
  master: string;     // 1080px-wide blob URL (lightweight pointer, NOT a data URI)
  thumbnail: string;  // 400px-wide blob URL
  masterBlob: Blob;   // Raw blob for upload
  thumbBlob: Blob;    // Raw blob for upload
  originalSize: number;
  finalSize: number;
  aspectRatio: number; // width / height of final image
  needsCrop: boolean;  // true if original exceeded 4:5
}

export interface CropRect {
  x: number;      // 0–1 fraction from left
  y: number;      // 0–1 fraction from top
  width: number;  // 0–1 fraction of source width
  height: number; // 0–1 fraction of source height
}

// --- HEIC Conversion ---
// Strategy: modern browsers (Safari, Chrome 118+) can decode HEIC natively.
// 1. Try loading as <img> via blob URL → canvas → JPEG  (fastest, zero deps)
// 2. Fall back to heic2any WASM decoder if the browser can't render it
// 3. If both fail, give a clear error

function isHeicFile(file: File): boolean {
  return (
    file.type === 'image/heic' || file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
  );
}

/** Try to decode via native browser <img> + canvas re-encode */
function nativeHeicToJpeg(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    // Timeout — if the browser can't decode HEIC it may hang silently
    const timer = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('Native HEIC decode timed out'));
    }, 8000);

    img.onload = () => {
      clearTimeout(timer);
      try {
        // Sanity-check: a 0×0 or 1×1 image means the browser didn't really decode it
        if (img.naturalWidth < 2 || img.naturalHeight < 2) {
          URL.revokeObjectURL(url);
          reject(new Error('Native decode produced degenerate image'));
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); reject(new Error('No 2d context')); return; }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) { reject(new Error('Canvas toBlob returned null')); return; }
            const jpegName = file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
            resolve(new File([blob], jpegName, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.95,
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      reject(new Error('Native HEIC decode failed'));
    };

    img.src = url;
  });
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;

  // Attempt 1 — native browser decode (Safari, Chrome 118+, Edge 118+)
  try {
    console.log('🖼️ HEIC: trying native browser decode…');
    const result = await nativeHeicToJpeg(file);
    console.log('✅ HEIC: native decode succeeded');
    return result;
  } catch (nativeErr) {
    console.warn('⚠️ HEIC native decode failed, trying heic2any…', nativeErr);
  }

  // Attempt 2 — heic2any WASM decoder
  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.95,
    });
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    console.log('✅ HEIC: heic2any conversion succeeded');
    return new File([blob], file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'), {
      type: 'image/jpeg',
    });
  } catch (wasmErr) {
    console.error('❌ HEIC: heic2any also failed:', wasmErr);
  }

  // Both failed — give actionable guidance
  throw new Error(
    'Could not convert this HEIC image. Your browser may not support HEIC decoding.\n\n' +
    'Quick fix: open the photo in your device\'s Photos app, share/export it as JPEG or PNG, then upload that file instead.'
  );
}

// --- Validation ---
export function validateFileSize(file: File): boolean {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
  }
  return true;
}

// --- Helpers ---
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Load an image element from a data URL or object URL.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Get the natural dimensions of a File (image).
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number; ratio: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return { width: img.naturalWidth, height: img.naturalHeight, ratio: img.naturalWidth / img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Check if the image's aspect ratio exceeds the 9:16 portrait limit (too tall).
 */
export function needsAspectRatioCrop(ratio: number): boolean {
  return ratio < MAX_PORTRAIT_RATIO;
}

/**
 * Suggest the best default aspect ratio for a given natural ratio.
 */
export function suggestAspectRatio(ratio: number): AspectRatioKey {
  if (ratio < MAX_PORTRAIT_RATIO) return '9:16'; // too tall → clamp to 9:16
  if (ratio <= 0.65) return '9:16';
  if (ratio <= 0.85) return '4:5';
  if (ratio <= 1.15) return '1:1';
  return '1.91:1';
}

/**
 * Calculate a center crop rect for a target aspect ratio.
 */
export function getCenterCropRect(
  naturalWidth: number,
  naturalHeight: number,
  targetRatio: number
): CropRect {
  const naturalRatio = naturalWidth / naturalHeight;

  if (naturalRatio > targetRatio) {
    // Image is wider than target → crop sides
    const cropWidth = (targetRatio / naturalRatio);
    return { x: (1 - cropWidth) / 2, y: 0, width: cropWidth, height: 1 };
  } else {
    // Image is taller than target → crop top/bottom
    const cropHeight = (naturalRatio / targetRatio);
    return { x: 0, y: (1 - cropHeight) / 2, width: 1, height: cropHeight };
  }
}

/**
 * Apply a crop + resize on a canvas and return a Blob.
 */
export async function cropAndResize(
  img: HTMLImageElement,
  crop: CropRect,
  targetWidth: number,
  quality: number = 0.85
): Promise<Blob> {
  const srcX = Math.round(crop.x * img.naturalWidth);
  const srcY = Math.round(crop.y * img.naturalHeight);
  const srcW = Math.round(crop.width * img.naturalWidth);
  const srcH = Math.round(crop.height * img.naturalHeight);

  const targetHeight = Math.round(targetWidth / (srcW / srcH));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetWidth, targetHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/jpeg',
      quality
    );
  });
}

/**
 * Compress a blob to fit within the target size range using browser-image-compression.
 */
async function compressToTarget(blob: Blob, targetMaxKB: number): Promise<Blob> {
  const file = new File([blob], 'temp.jpg', { type: 'image/jpeg' });
  const currentKB = file.size / 1024;

  if (currentKB <= targetMaxKB) return blob;

  const compressed = await imageCompression(file, {
    maxSizeMB: targetMaxKB / 1024,
    maxWidthOrHeight: MASTER_WIDTH,
    useWebWorker: true,
    initialQuality: 0.8,
    fileType: 'image/jpeg',
  });

  return compressed;
}

// --- Main Process Functions ---

/**
 * Full image processing pipeline:
 * 1. Validate & convert HEIC
 * 2. Detect aspect ratio
 * 3. Apply crop (center-crop to selected or auto-detected ratio)
 * 4. Resize to 1080px master + 400px thumbnail
 * 5. Compress master to 150–400 KB target
 */
export async function processImage(
  file: File,
  cropRect?: CropRect,
  targetRatio?: AspectRatioKey
): Promise<ProcessedImage> {
  const originalSize = file.size;

  // Step 1: Validate
  validateFileSize(file);

  // Step 2: Convert HEIC/HEIF
  const convertedFile = await convertHeicToJpeg(file);

  // Step 3: Load image to get dimensions — use object URL (no multi-MB string!)
  const objectUrl = URL.createObjectURL(convertedFile);
  const img = await loadImage(objectUrl);
  URL.revokeObjectURL(objectUrl); // Free immediately — img already decoded
  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;
  const naturalRatio = naturalW / naturalH;

  // Step 4: Determine if cropping is needed
  const mustCrop = needsAspectRatioCrop(naturalRatio);

  let finalCrop: CropRect;

  if (cropRect) {
    // User provided an explicit crop
    finalCrop = cropRect;
  } else if (targetRatio && targetRatio !== 'original') {
    // Auto center-crop to the selected ratio
    const ratioValue = ASPECT_RATIOS[targetRatio].value;
    finalCrop = getCenterCropRect(naturalW, naturalH, ratioValue);
  } else if (mustCrop) {
    // Image is too tall — auto center-crop to 4:5
    finalCrop = getCenterCropRect(naturalW, naturalH, MAX_PORTRAIT_RATIO);
  } else {
    // No crop needed — use full image
    finalCrop = { x: 0, y: 0, width: 1, height: 1 };
  }

  // Step 5: Generate master (1080px wide)
  const masterBlob = await cropAndResize(img, finalCrop, MASTER_WIDTH, 0.93);

  // Step 6: Compress master to target 150–400 KB
  const compressedMaster = await compressToTarget(masterBlob, TARGET_MASTER_KB_MAX);

  // Step 7: Generate thumbnail (400px wide)
  const thumbnailBlob = await cropAndResize(img, finalCrop, THUMBNAIL_WIDTH, 0.75);

  // Create lightweight blob URLs for display (NOT data URIs — zero memory overhead)
  const masterBlobUrl = URL.createObjectURL(compressedMaster);
  const thumbnailBlobUrl = URL.createObjectURL(thumbnailBlob);

  const finalSize = compressedMaster.size;
  const croppedW = finalCrop.width * naturalW;
  const croppedH = finalCrop.height * naturalH;

  console.log('📸 Image processed:', {
    original: `${naturalW}x${naturalH} (${(originalSize / 1024 / 1024).toFixed(2)}MB)`,
    master: `1080px wide (${(finalSize / 1024).toFixed(0)}KB)`,
    thumbnail: `400px wide (${(thumbnailBlob.size / 1024).toFixed(0)}KB)`,
    aspectRatio: (croppedW / croppedH).toFixed(2),
    wasCropped: mustCrop || !!cropRect || (targetRatio && targetRatio !== 'original'),
  });

  return {
    master: masterBlobUrl,
    thumbnail: thumbnailBlobUrl,
    masterBlob: compressedMaster,
    thumbBlob: thumbnailBlob,
    originalSize,
    finalSize,
    aspectRatio: croppedW / croppedH,
    needsCrop: mustCrop,
  };
}

/**
 * Quick analysis of a file before the crop modal.
 * Returns dimensions, ratio, and whether cropping is needed.
 */
export async function analyzeImage(file: File): Promise<{
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  ratio: number;
  needsCrop: boolean;
  suggestedRatio: AspectRatioKey;
}> {
  validateFileSize(file);
  const convertedFile = await convertHeicToJpeg(file);
  // Use object URL instead of data URI — avoids multi-MB base64 strings in memory
  const objectUrl = URL.createObjectURL(convertedFile);
  const img = await loadImage(objectUrl);
  const ratio = img.naturalWidth / img.naturalHeight;

  return {
    file: convertedFile,
    dataUrl: objectUrl, // blob URL — works as <img> src, tiny memory footprint
    width: img.naturalWidth,
    height: img.naturalHeight,
    ratio,
    needsCrop: needsAspectRatioCrop(ratio),
    suggestedRatio: suggestAspectRatio(ratio),
  };
}

/**
 * Check if file is a supported image format
 */
export function isSupportedImageFormat(file: File): boolean {
  const supportedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/gif', 'image/avif', 'image/heic', 'image/heif',
    'image/svg+xml', 'image/bmp', 'image/tiff',
  ];
  const supportedExtensions = [
    '.jpg', '.jpeg', '.png', '.webp',
    '.gif', '.avif', '.heic', '.heif',
    '.svg', '.bmp', '.tiff', '.tif',
  ];

  const hasValidType = supportedTypes.includes(file.type);
  const hasValidExtension = supportedExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  return hasValidType || hasValidExtension;
}