import { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Sparkles, MapPin, Clock, UserCheck, Users, Globe, Plus, Trash2, Loader2, Sliders, Volume2, VolumeX } from 'lucide-react';
import { Post, Story } from "../types";
import { processImage, analyzeImage, isSupportedImageFormat, AspectRatioKey, CropRect } from '../utils/imageProcessing';
import { AspectRatioCropModal } from './AspectRatioCropModal';
import { PhotoFilterPicker, getFilterStyle, getFilterById, getFilterOverlay, getCombinedFilterStyle, getCameraEraFilter, getCameraEraOverlay, getCameraEraGrain, getCameraEraLightLeak } from './PhotoFilterPicker';
import { VHSNightVisionOverlay, VHS_NIGHT_VISION_ID } from './VHSNightVisionOverlay';
import * as db from '../db';
import { useCreatePost, useUploadMedia } from '../hooks/useApi';

interface CreatePostPageProps {
  onClose: () => void;
  onAddPost: (
    post: Omit<Post, 'id' | 'userId' | 'username' | 'userAvatar' | 'timestamp' | 'likes' | 'comments' | 'shares' | 'isLiked' | 'isSaved'>,
    blobs?: { masterBlobs: Blob[]; thumbBlobs: Blob[] }
  ) => void;
  onAddStory?: (story: Story) => void;
  dailyPrompt?: string;
  currentUserId?: string;
}

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;  // For images
  masterBlob?: Blob;   // Raw blob for upload (images only)
  thumbBlob?: Blob;    // Raw blob for upload (images only)
  fileSize?: number;   // For size badge display
}

export function CreatePostPage({ onClose, onAddPost, onAddStory, dailyPrompt, currentUserId }: CreatePostPageProps) {
  const [caption, setCaption] = useState(dailyPrompt ? `Daily Prompt: ${dailyPrompt}\n\n` : '');
  const [visibility, setVisibility] = useState<'public' | 'followers'>('followers');
  const [postType, setPostType] = useState<'post' | 'vibe'>('post');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [location, setLocation] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  const [collabUsername, setCollabUsername] = useState('');
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());

  // API Hooks
  const { createPost, loading: createPostLoading, error: createPostError } = useCreatePost(currentUserId || '');
  const { uploadMedia, loading: uploadLoading } = useUploadMedia();

  // Filter state
  const [mediaFilters, setMediaFilters] = useState<Record<number, string>>({});
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [mediaFilterIntensities, setMediaFilterIntensities] = useState<Record<number, number>>({});
  const [mediaCameraEras, setMediaCameraEras] = useState<Record<number, string>>({});
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [vhsEnabled, setVhsEnabled] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false); // Videos default to sound ON

  // Derived active filter values for the currently selected media
  const activeFilter = mediaFilters[activeMediaIndex] || 'none';
  const activeIntensity = mediaFilterIntensities[activeMediaIndex] ?? 100;
  const activeEra = mediaCameraEras[activeMediaIndex] || 'modern';

  // Clamp activeMediaIndex when media is removed
  const clampedActiveIndex = Math.min(activeMediaIndex, Math.max(0, mediaItems.length - 1));
  if (clampedActiveIndex !== activeMediaIndex && mediaItems.length > 0) {
    setActiveMediaIndex(clampedActiveIndex);
  }

  // Crop modal state
  const [cropModalData, setCropModalData] = useState<{
    file: File;
    dataUrl: string;
    width: number;
    height: number;
    ratio: number;
    needsCrop: boolean;
    suggestedRatio: AspectRatioKey;
  } | null>(null);

  // Unified file queue — processes ALL files (videos + images) one at a time in order
  const fileQueueRef = useRef<File[]>([]);
  const processingRef = useRef(false);
  const [queueLength, setQueueLength] = useState(0); // For UI display only

  // Track mount state to avoid setState on unmounted component
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Track blob URLs for cleanup — only on unmount so the feed can still use them
  const blobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      console.log('🧹 Revoking CreatePostPage blob URLs on unmount');
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
    };
  }, []);

  // Process next file from the unified queue — called explicitly, NOT from useEffect
  const processNextFile = async () => {
    if (processingRef.current) return;
    if (fileQueueRef.current.length === 0) return;
    if (!isMountedRef.current) return;

    const file = fileQueueRef.current[0];
    const isVideo = file.type.startsWith('video/');

    if (isVideo) {
      // Videos are quick — create blob URL and add immediately, then advance
      processingRef.current = true;
      try {
        const blobUrl = URL.createObjectURL(file);
        blobUrlsRef.current.add(blobUrl);
        const newItem: MediaItem = { url: blobUrl, type: 'video', fileSize: file.size };
        if (isMountedRef.current) {
          setMediaItems(prev => postType === 'vibe' ? [newItem] : [...prev, newItem]);
        }
      } catch (error: any) {
        console.error('Error creating video blob URL:', error);
      }
      // Remove from queue and continue to next
      fileQueueRef.current = fileQueueRef.current.slice(1);
      processingRef.current = false;
      if (isMountedRef.current) {
        setQueueLength(fileQueueRef.current.length);
        setIsProcessing(fileQueueRef.current.length > 0);
      }
      // Process next (setTimeout avoids recursive stack overflow with many videos)
      if (fileQueueRef.current.length > 0) {
        setTimeout(() => processNextFile(), 0);
      }
    } else {
      // Image — analyze and show crop modal, then wait for user confirm/cancel
      processingRef.current = true;
      if (isMountedRef.current) setIsProcessing(true);

      try {
        const analysis = await analyzeImage(file);
        if (isMountedRef.current) {
          setCropModalData(analysis);
        }
      } catch (error: any) {
        console.error('Error analyzing image:', error);
        if (isMountedRef.current) {
          alert(error.message || 'Error processing image. Please try again.');
        }
        // Remove failed file and try next
        fileQueueRef.current = fileQueueRef.current.slice(1);
        if (isMountedRef.current) setQueueLength(fileQueueRef.current.length);
        processingRef.current = false;
        if (isMountedRef.current) setIsProcessing(fileQueueRef.current.length > 0);
        setTimeout(() => processNextFile(), 0);
        return;
      }

      // Crop modal is now open — wait for handleCropConfirm / handleCropCancel
      processingRef.current = false;
      if (isMountedRef.current) setIsProcessing(false);
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (postType === 'vibe' && mediaItems.length > 0) return;

    const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB
    const MAX_PHOTO_SIZE = 500 * 1024 * 1024;  // 500 MB
    const MAX_VIDEOS = 2;
    const MAX_PHOTOS = 8;

    const currentVideos = mediaItems.filter(i => i.type === 'video').length;
    const currentPhotos = mediaItems.filter(i => i.type === 'image').length;

    const validFiles: File[] = [];
    let videoCount = currentVideos;
    let photoCount = currentPhotos;

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/') || isSupportedImageFormat(file);

      if (!isVideo && !isImage) {
        console.warn(`Skipping "${file.name}" — not a valid image or video.`);
        continue;
      }

      if (isVideo) {
        if (videoCount >= MAX_VIDEOS) {
          console.warn(`Skipping "${file.name}" — max ${MAX_VIDEOS} videos reached.`);
          continue;
        }
        if (file.size > MAX_VIDEO_SIZE) {
          alert(`"${file.name}" is too large. Max 500 MB for videos.`);
          continue;
        }
        validFiles.push(file);
        videoCount++;
      } else {
        if (photoCount >= MAX_PHOTOS) {
          console.warn(`Skipping "${file.name}" — max ${MAX_PHOTOS} photos reached.`);
          continue;
        }
        if (file.size > MAX_PHOTO_SIZE) {
          alert(`"${file.name}" is too large. Max 500 MB for photos.`);
          continue;
        }
        validFiles.push(file);
        photoCount++;
      }
    }

    e.target.value = '';

    // Add all valid files to the unified queue and start processing
    if (validFiles.length > 0) {
      fileQueueRef.current = [...fileQueueRef.current, ...validFiles];
      setQueueLength(fileQueueRef.current.length);
      setIsProcessing(true);
      // Kick off sequential processing
      processNextFile();
    }
  };

  // Called when user confirms crop in the modal
  const handleCropConfirm = async (ratio: AspectRatioKey, cropRect: CropRect) => {
    if (!cropModalData) return;
    const fileToProcess = cropModalData.file;
    setCropModalData(null);
    setIsProcessing(true);
    processingRef.current = true;

    try {
      const processed = await processImage(fileToProcess, cropRect, ratio);
      if (isMountedRef.current) {
        const newItem: MediaItem = {
          url: processed.master,
          type: 'image',
          thumbnail: processed.thumbnail,
          masterBlob: processed.masterBlob,
          thumbBlob: processed.thumbBlob,
          fileSize: processed.finalSize,
        };
        setMediaItems(prev => postType === 'vibe' ? [newItem] : [...prev, newItem]);
      }
    } catch (error: any) {
      console.error('Error processing image:', error);
      if (isMountedRef.current) {
        alert(error.message || 'Error processing image. Please try again.');
      }
    } finally {
      // Remove processed file from queue and advance
      fileQueueRef.current = fileQueueRef.current.slice(1);
      processingRef.current = false;
      if (isMountedRef.current) {
        setQueueLength(fileQueueRef.current.length);
        setIsProcessing(fileQueueRef.current.length > 0);
      }
      // Process next file in queue
      processNextFile();
    }
  };

  const handleCropCancel = () => {
    setCropModalData(null);
    // Skip this file, move to next in queue
    fileQueueRef.current = fileQueueRef.current.slice(1);
    setQueueLength(fileQueueRef.current.length);
    setIsProcessing(fileQueueRef.current.length > 0);
    // Process next file in queue
    processNextFile();
  };

  const removeMedia = (index: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const item = mediaItems[index];
    if (item?.type === 'video' && item.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url);
      blobUrlsRef.current.delete(item.url);
    }
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (postType === 'vibe' && onAddStory) {
        if (mediaItems.length === 0) {
          alert('Please add media to your Vibe.');
          setIsSubmitting(false);
          return;
        }
        const firstMedia = mediaItems[0];
        // Don't revoke submitted blob on unmount
        if (firstMedia.type === 'video' && firstMedia.url.startsWith('blob:')) {
          blobUrlsRef.current.delete(firstMedia.url);
        }
        onAddStory({
          id: `story-${Date.now()}`,
          userId: 'currentUser',
          username: isAnonymous ? 'Anonymous' : 'You',
          userAvatar: '',
          imageUrl: firstMedia.type === 'image' ? firstMedia.url : '',
          videoUrl: firstMedia.type === 'video' ? firstMedia.url : undefined,
          timestamp: 'Just now',
          viewed: false,
          isCloseFriends,
          filter: mediaFilters[0] !== 'none' ? mediaFilters[0] : undefined,
          cameraEra: mediaCameraEras[0] !== 'modern' ? mediaCameraEras[0] : undefined,
        });
      } else {
        if (!caption.trim() && mediaItems.length === 0 && !showPollBuilder) {
          alert('Please add some content to your post.');
          setIsSubmitting(false);
          return;
        }
        if (showPollBuilder && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) {
          alert('Polls need a question and at least 2 options.');
          setIsSubmitting(false);
          return;
        }

        const images = mediaItems.filter(i => i.type === 'image').map(i => i.url);
        const thumbnails = mediaItems.filter(i => i.type === 'image').map(i => i.thumbnail || i.url);
        const videoItem = mediaItems.find(i => i.type === 'video');
        const submittedVideoUrl = videoItem?.url;

        // Don't revoke submitted blob on unmount — feed still needs it
        if (submittedVideoUrl?.startsWith('blob:')) {
          blobUrlsRef.current.delete(submittedVideoUrl);
        }

        const poll = showPollBuilder && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2
          ? {
              question: pollQuestion.trim(),
              options: pollOptions.filter(o => o.trim()),
              votes: pollOptions.filter(o => o.trim()).map(() => Math.floor(Math.random() * 30)),
            }
          : undefined;

        // Build per-media filter arrays
        const filtersArr = mediaItems.map((_, i) => mediaFilters[i] || 'none');
        const cameraErasArr = mediaItems.map((_, i) => mediaCameraEras[i] || 'modern');
        const hasPerMediaFilters = filtersArr.some(f => f !== 'none') || cameraErasArr.some(e => e !== 'modern');

        onAddPost({
          caption: caption.trim(),
          imageUrls: images.length > 0 ? images : undefined,
          thumbnailUrls: thumbnails.length > 0 ? thumbnails : undefined,
          videoUrl: submittedVideoUrl,
          type: submittedVideoUrl ? 'video' : images.length > 0 ? 'image' : undefined,
          location: location.trim() || undefined,
          isAnonymous: isAnonymous || undefined,
          expiresAt: isExpiring ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() : undefined,
          collabUsername: collabUsername.trim() || undefined,
          poll,
          visibility,
          filter: mediaFilters[0] !== 'none' ? mediaFilters[0] : (vhsEnabled ? VHS_NIGHT_VISION_ID : undefined),
          cameraEra: mediaCameraEras[0] !== 'modern' ? mediaCameraEras[0] : undefined,
          filters: hasPerMediaFilters ? filtersArr : undefined,
          cameraEras: hasPerMediaFilters ? cameraErasArr : undefined,
          isMuted: videoMuted || undefined,
        }, {
          masterBlobs: mediaItems.map(i => i.masterBlob).filter((blob): blob is Blob => !!blob),
          thumbBlobs: mediaItems.map(i => i.thumbBlob).filter((blob): blob is Blob => !!blob),
        });

        // Also save to real API if user is logged in
        if (currentUserId) {
          try {
            await createPost({
              caption: caption.trim(),
              imageUrls: images.length > 0 ? images : undefined,
              videoUrl: submittedVideoUrl,
              location: location.trim() || undefined,
              visibility
            });
            console.log('✅ Post saved to API successfully');
          } catch (error) {
            console.error('Error saving post to API:', error);
            // Post still created locally, so don't show error to user
          }
        }
      }
      console.log('✅ Post submitted, closing');
      // Defer onClose to a separate frame so React doesn't batch the heavy
      // post-creation state update with the screen-change re-render.
      // This prevents simultaneous unmount + mount from overwhelming the renderer.
      requestAnimationFrame(() => onClose());
    } catch (error) {
      console.error('❌ Error in handlePost:', error);
      alert(`Error creating post: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="shrink-0 z-40 bg-background border-b-4 border-foreground shadow-[0px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_10%,transparent)]"
          style={{
            animation: 'fadeSlideUp 0.35s cubic-bezier(.22,.68,0,1.2) both',
            paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
            paddingRight: 'calc(1rem + env(safe-area-inset-right))',
            paddingTop: '1rem',
            paddingBottom: '1rem'
          }}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:scale-95"
            >
              <X className="text-foreground" size={24} strokeWidth={3} />
            </button>
            <h1 className="text-xl font-black text-foreground uppercase italic tracking-tight">CREATE NEW</h1>
            <button
              type="button"
              onClick={handlePost}
              disabled={
                isSubmitting ||
                (postType === 'vibe' && mediaItems.length === 0) ||
                (postType === 'post' && !caption.trim() && mediaItems.length === 0 && !showPollBuilder)
              }
              className="px-6 py-2 bg-foreground text-background border-2 border-foreground font-black uppercase shadow-[2px_2px_0px_0px_var(--background)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'POSTING...' : postType === 'vibe' ? 'SHARE' : 'POST'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-background m-4 border-2 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)]"
          style={{
            animation: 'cardEntrance 0.5s cubic-bezier(.22,.68,0,1.2) 0.1s both',
            paddingBottom: 'calc(80px + 1rem + env(safe-area-inset-bottom))'
          }}>
          {/* Post Type Selector */}
          <div className="p-3 border-b-2 border-foreground/30">
            <div className="flex gap-2">
              {(['post', 'vibe'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPostType(type)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-foreground font-black uppercase text-sm transition-all ${
                    postType === type
                      ? 'bg-foreground text-background'
                      : 'bg-background text-foreground hover:bg-foreground/5'
                  }`}
                >
                  {type === 'post' ? <ImageIcon size={16} strokeWidth={3} /> : <Sparkles size={16} strokeWidth={3} />}
                  <span>{type.toUpperCase()}</span>
                </button>
              ))}
            </div>
            {postType === 'vibe' && (
              <p className="text-[10px] font-mono font-bold text-foreground/60 mt-2">
                ⚠️ Vibes disappear after 24h
              </p>
            )}
          </div>

          {/* Media Upload */}
          <div className="p-3 border-b-2 border-foreground/30">
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 py-3 mb-2">
                <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-black uppercase text-foreground/60">
                  Processing{queueLength > 1 ? ` (${queueLength} left)` : ''}…
                </span>
              </div>
            )}

            {!isProcessing && queueLength > 0 && (
              <div className="flex items-center justify-center gap-2 py-2 mb-2">
                <span className="text-xs font-black uppercase text-foreground/60">
                  {queueLength} file{queueLength > 1 ? 's' : ''} queued
                </span>
              </div>
            )}

            {mediaItems.length > 0 ? (
              <div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {mediaItems.map((item, index) => (
                    <div key={index} className="relative aspect-square w-full overflow-hidden border-2 border-foreground bg-foreground/10">
                      {item.type === 'image' ? (
                        <ImagePreviewWithLoader url={item.url} fileSize={item.fileSize} index={index} filterStyle={getFilterStyle(mediaFilters[index], mediaFilterIntensities[index])} filterId={mediaFilters[index]} cameraEra={mediaCameraEras[index]} />
                      ) : (
                        <div className="relative w-full h-full">
                          {vhsEnabled ? (
                            <VHSNightVisionOverlay className="w-full h-full" showHUD={false} intensity={80}>
                              <video
                                ref={(el) => { if (el) el.muted = true; }}
                                src={item.url}
                                preload="metadata"
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            </VHSNightVisionOverlay>
                          ) : (
                            <>
                              <video
                                ref={(el) => { if (el) el.muted = videoMuted; }}
                                src={item.url}
                                preload="metadata"
                                playsInline
                                className="w-full h-full object-cover"
                                style={(() => {
                                  const filterStyle = getFilterStyle(mediaFilters[index], mediaFilterIntensities[index]);
                                  const eraFilter = getCameraEraFilter(mediaCameraEras[index]);
                                  const parts = [filterStyle !== 'none' ? filterStyle : '', eraFilter || ''].filter(Boolean);
                                  return parts.length > 0 ? { filter: parts.join(' ') } : undefined;
                                })()}
                              />
                              {/* Filter overlay for video */}
                              {mediaFilters[index] && mediaFilters[index] !== 'none' && (() => {
                                const overlay = getFilterOverlay(mediaFilters[index]);
                                if (!overlay) return null;
                                return (
                                  <div
                                    className="absolute inset-0 pointer-events-none z-[5]"
                                    style={{ background: overlay.gradient, mixBlendMode: overlay.blend as any }}
                                  />
                                );
                              })()}
                              {/* Camera era overlays for video */}
                              {mediaCameraEras[index] && mediaCameraEras[index] !== 'modern' && (() => {
                                const eraOverlay = getCameraEraOverlay(mediaCameraEras[index]);
                                const grain = getCameraEraGrain(mediaCameraEras[index]);
                                return (
                                  <>
                                    {eraOverlay && (
                                      <div
                                        className="absolute inset-0 pointer-events-none z-[6]"
                                        style={{ background: eraOverlay.gradient, mixBlendMode: eraOverlay.blend as any }}
                                      />
                                    )}
                                    {grain && (
                                      <div
                                        className="absolute inset-0 pointer-events-none z-[7]"
                                        style={{
                                          backgroundImage: grain.backgroundImage,
                                          backgroundSize: '300px 300px',
                                          opacity: grain.opacity,
                                          mixBlendMode: 'overlay',
                                          animation: 'grainDrift 0.8s steps(4) infinite',
                                        }}
                                      />
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          )}
                          <div className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 pointer-events-none">
                            <span className="text-white text-[9px] font-black uppercase">▶ VID</span>
                          </div>
                        </div>
                      )}
                      {/* Active media indicator */}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMediaIndex(index); setShowFilterPicker(true); }}
                        className={`absolute bottom-1 right-8 w-6 h-6 flex items-center justify-center border transition-all z-10 ${
                          activeMediaIndex === index && showFilterPicker
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-black/60 text-white/80 border-white/30 hover:bg-black/80'
                        }`}
                        title="Edit filter"
                      >
                        <Sliders size={10} strokeWidth={3} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => removeMedia(index, e)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 border border-foreground flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                      >
                        <X className="text-white" size={12} strokeWidth={3} />
                      </button>
                      {/* Per-media filter badge */}
                      {mediaFilters[index] && mediaFilters[index] !== 'none' && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-foreground/80 text-background z-10 pointer-events-none">
                          <span className="text-[8px] font-black uppercase">{getFilterById(mediaFilters[index]).name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {postType === 'post' && !(mediaItems.filter(i => i.type === 'image').length >= 8 && mediaItems.filter(i => i.type === 'video').length >= 2) && (
                    <label
                      className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-foreground/30 hover:border-foreground hover:bg-foreground/5 transition-all cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Plus size={24} strokeWidth={2} className="text-foreground/40" />
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleMediaUpload}
                        className="hidden"
                        multiple
                      />
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-foreground/30 hover:border-foreground hover:bg-foreground/5 transition-all cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageIcon className="text-foreground/40 mb-2" size={32} strokeWidth={2} />
                <p className="text-sm font-black text-foreground uppercase">TAP TO UPLOAD</p>
                <p className="text-[10px] font-mono text-foreground/40 mt-1">PHOTOS & VIDEOS</p>
                <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" multiple />
              </label>
            )}
          </div>

          {/* Filters Section — shown when media is present */}
          {mediaItems.length > 0 && (
            <div className="p-3 border-b-2 border-foreground/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-foreground uppercase tracking-widest opacity-60">FILTER</p>
                  {mediaItems.length > 1 && (
                    <span className="text-[9px] font-mono font-bold text-foreground/40">
                      #{activeMediaIndex + 1} of {mediaItems.length}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilterPicker(!showFilterPicker)}
                  className={`px-3 py-1 text-xs font-black border-2 border-foreground uppercase transition-all flex items-center gap-1.5 ${
                    activeFilter !== 'none'
                      ? 'bg-foreground text-background'
                      : 'bg-background text-foreground hover:bg-foreground/5'
                  }`}
                >
                  <Sliders size={12} strokeWidth={3} />
                  {activeFilter !== 'none' ? getFilterById(activeFilter).name.toUpperCase() : 'ADD'}
                </button>
              </div>

              {/* Media selector strip — tap to select which media to filter */}
              {mediaItems.length > 1 && showFilterPicker && (
                <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide pb-1">
                  {mediaItems.map((item, idx) => {
                    const isActive = idx === activeMediaIndex;
                    const itemFilter = mediaFilters[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveMediaIndex(idx)}
                        className={`shrink-0 relative w-14 h-14 border-2 overflow-hidden transition-all ${
                          isActive
                            ? 'border-foreground scale-105 shadow-[2px_2px_0px_0px_var(--foreground)]'
                            : 'border-foreground/30 opacity-60 hover:opacity-85'
                        }`}
                      >
                        {item.type === 'image' ? (
                          <img src={item.url} alt="" className="w-full h-full object-cover" draggable={false} />
                        ) : (
                          <video src={item.url} className="w-full h-full object-cover" preload="metadata" muted playsInline draggable={false} />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-foreground/70 text-background text-center">
                          <span className="text-[7px] font-black uppercase">
                            {itemFilter && itemFilter !== 'none' ? getFilterById(itemFilter).name : item.type === 'video' ? `▶ ${idx + 1}` : `#${idx + 1}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {showFilterPicker && (
                <PhotoFilterPicker
                  selectedFilter={activeFilter}
                  onSelectFilter={(id) => setMediaFilters(prev => ({ ...prev, [activeMediaIndex]: id }))}
                  previewImage={mediaItems[activeMediaIndex]?.type === 'image' ? mediaItems[activeMediaIndex]?.url : undefined}
                  previewVideo={mediaItems[activeMediaIndex]?.type === 'video' ? mediaItems[activeMediaIndex]?.url : undefined}
                  onClose={() => setShowFilterPicker(false)}
                  intensity={activeIntensity}
                  onIntensityChange={(val) => setMediaFilterIntensities(prev => ({ ...prev, [activeMediaIndex]: val }))}
                  cameraEra={activeEra}
                  onCameraEraChange={(val) => setMediaCameraEras(prev => ({ ...prev, [activeMediaIndex]: val }))}
                />
              )}
              {!showFilterPicker && activeFilter !== 'none' && (
                <div className="flex items-center gap-2 p-2 bg-foreground/5 border border-foreground/15">
                  <div className="w-8 h-8 border border-foreground overflow-hidden shrink-0">
                    <img
                      src={mediaItems[activeMediaIndex]?.url || mediaItems.find(i => i.type === 'image')?.url}
                      alt="Filter preview"
                      className="w-full h-full object-cover"
                      style={{ filter: getFilterStyle(activeFilter, activeIntensity) }}
                    />
                  </div>
                  <span className="text-xs font-black text-foreground uppercase flex-1">
                    {getFilterById(activeFilter).name}
                    {mediaItems.length > 1 && <span className="text-foreground/40 ml-1">#{activeMediaIndex + 1}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaFilters(prev => ({ ...prev, [activeMediaIndex]: 'none' }));
                      setMediaFilterIntensities(prev => ({ ...prev, [activeMediaIndex]: 100 }));
                      setMediaCameraEras(prev => ({ ...prev, [activeMediaIndex]: 'modern' }));
                    }}
                    className="text-[10px] font-black text-foreground/50 uppercase hover:text-foreground transition-colors px-2"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VHS Night Vision Filter — shown when videos are present */}
          {mediaItems.some(i => i.type === 'video') && (
            <div className="p-3 border-b-2 border-foreground/30">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground uppercase tracking-widest opacity-60">VIDEO EFFECT</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVideoMuted(!videoMuted)}
                    className={`px-3 py-1 text-xs font-black border-2 border-foreground uppercase transition-all flex items-center gap-1.5 ${
                      videoMuted
                        ? 'bg-foreground text-background'
                        : 'bg-background text-foreground hover:bg-foreground/5'
                    }`}
                  >
                    {videoMuted ? <VolumeX size={12} strokeWidth={3} /> : <Volume2 size={12} strokeWidth={3} />}
                    {videoMuted ? 'MUTED' : 'SOUND ON'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVhsEnabled(!vhsEnabled)}
                    className={`px-3 py-1 text-xs font-black border-2 border-foreground uppercase transition-all flex items-center gap-1.5 ${
                      vhsEnabled
                        ? 'bg-green-900 text-green-300 border-green-500'
                        : 'bg-background text-foreground hover:bg-foreground/5'
                    }`}
                  >
                    <span className="text-sm">📼</span>
                    {vhsEnabled ? '✓ VHS' : 'VHS'}
                  </button>
                </div>
              </div>
              {vhsEnabled && (
                <div className="mt-2" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
                  <VHSNightVisionOverlay className="w-full aspect-video border-2 border-green-900">
                    <video
                      ref={(el) => { if (el) { el.muted = true; el.play().catch(() => {}); } }}
                      src={mediaItems.find(i => i.type === 'video')?.url}
                      preload="metadata"
                      playsInline
                      loop
                      className="w-full h-full object-cover"
                    />
                  </VHSNightVisionOverlay>
                </div>
              )}
            </div>
          )}

          {/* Caption */}
          <div className="p-3 border-b-2 border-foreground/30">
            <textarea
              placeholder={postType === 'vibe' ? 'Add context...' : 'Write a caption...'}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="w-full p-3 bg-background border-2 border-foreground/30 outline-none text-sm font-bold font-mono placeholder:text-foreground/30 resize-none focus:border-foreground transition-colors"
            />
          </div>

          {/* Location */}
          <div className="p-3 border-b-2 border-foreground/30">
            <div className="flex items-center border-2 border-foreground/30 bg-background focus-within:border-foreground transition-colors">
              <div className="px-3 py-2.5">
                <MapPin size={16} strokeWidth={2.5} className="text-foreground/50" />
              </div>
              <input
                type="text"
                placeholder="Add location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 px-2 py-2.5 bg-transparent outline-none text-sm font-bold font-mono placeholder:text-foreground/30"
              />
              {location && (
                <button type="button" onClick={() => setLocation('')} className="px-3 py-2.5">
                  <X size={14} strokeWidth={3} className="text-foreground/40" />
                </button>
              )}
            </div>
          </div>

          {/* Poll Builder */}
          {postType === 'post' && (
            <div className="p-3 border-b-2 border-foreground/30">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground uppercase tracking-widest opacity-60">POLL</p>
                <button
                  type="button"
                  onClick={() => setShowPollBuilder(!showPollBuilder)}
                  className={`px-3 py-1 text-xs font-black border-2 border-foreground uppercase transition-all ${
                    showPollBuilder
                      ? 'bg-foreground text-background'
                      : 'bg-background text-foreground hover:bg-foreground/5'
                  }`}
                >
                  {showPollBuilder ? '✓ ADDED' : '+ ADD'}
                </button>
              </div>
              {showPollBuilder && (
                <div className="space-y-2 mt-2">
                  <input
                    type="text"
                    placeholder="Poll question..."
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-foreground/30 font-bold font-mono text-sm placeholder:text-foreground/30 outline-none focus:border-foreground transition-colors"
                  />
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Option ${i + 1}...`}
                        value={opt}
                        onChange={(e) => setPollOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                        className="flex-1 px-3 py-2 border-2 border-foreground/30 font-bold font-mono text-sm placeholder:text-foreground/30 outline-none focus:border-foreground transition-colors"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))}
                          className="w-9 h-9 border-2 border-foreground/30 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions(prev => [...prev, ''])}
                      className="w-full py-2 border-2 border-dashed border-foreground/30 text-xs font-black text-foreground/40 uppercase hover:border-foreground hover:text-foreground transition-colors"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Options & Visibility */}
          <div className="p-3">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`flex items-center gap-1.5 px-3 py-2 border-2 border-foreground text-xs font-black uppercase transition-all ${isAnonymous ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-foreground/5'}`}
              >
                <span>👤</span> ANON {isAnonymous && '✓'}
              </button>
              <button
                type="button"
                onClick={() => setIsExpiring(!isExpiring)}
                className={`flex items-center gap-1.5 px-3 py-2 border-2 border-foreground text-xs font-black uppercase transition-all ${isExpiring ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-foreground/5'}`}
              >
                <Clock size={14} strokeWidth={3} /> 24H {isExpiring && '✓'}
              </button>
              {postType === 'vibe' && (
                <button
                  type="button"
                  onClick={() => setIsCloseFriends(!isCloseFriends)}
                  className={`flex items-center gap-1.5 px-3 py-2 border-2 border-foreground text-xs font-black uppercase transition-all ${isCloseFriends ? 'bg-green-600 text-white border-green-600' : 'bg-background text-foreground hover:bg-foreground/5'}`}
                >
                  <UserCheck size={14} strokeWidth={3} /> CLOSE {isCloseFriends && '✓'}
                </button>
              )}
            </div>

            {postType === 'post' && (
              <div className="flex items-center border-2 border-foreground/30 bg-background mb-3 focus-within:border-foreground transition-colors">
                <div className="px-3 py-2.5">
                  <UserCheck size={16} strokeWidth={2.5} className="text-foreground/50" />
                </div>
                <input
                  type="text"
                  placeholder="Tag collaborator..."
                  value={collabUsername}
                  onChange={(e) => setCollabUsername(e.target.value)}
                  className="flex-1 px-2 py-2.5 bg-transparent outline-none text-sm font-bold font-mono placeholder:text-foreground/30"
                />
              </div>
            )}

            <div className="flex gap-2">
              {([
                { value: 'followers' as const, icon: Users, label: 'FOLLOWERS' },
                { value: 'public' as const, icon: Globe, label: 'PUBLIC' },
              ]).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVisibility(value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-foreground text-xs font-black uppercase transition-all ${
                    visibility === value
                      ? 'bg-foreground text-background'
                      : 'bg-background text-foreground hover:bg-foreground/5'
                  }`}
                >
                  <Icon size={14} strokeWidth={2.5} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {cropModalData && (
        <AspectRatioCropModal
          data={cropModalData}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}

function ImagePreviewWithLoader({ url, fileSize, index, filterStyle, filterId, cameraEra }: { url: string, fileSize?: number, index: number, filterStyle?: string, filterId?: string, cameraEra?: string }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const img = new window.Image();
    img.src = url;
    img.onload = () => setIsLoading(false);
    img.onerror = () => setIsLoading(false);
  }, [url]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center gap-3 overflow-hidden">
          {/* Animated shimmer scan line */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute left-0 right-0 h-1 bg-background opacity-60"
              style={{
                animation: 'shimmerScan 1.5s ease-in-out infinite',
              }}
            />
          </div>
          <Loader2 className="text-background animate-spin" size={28} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase text-white/70 tracking-widest">Loading preview...</span>
          <style>{`
            @keyframes shimmerScan {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
          `}</style>
        </div>
      )}
      <img
        src={url}
        alt="Selected"
        className={`w-full h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        loading="lazy"
        style={filterStyle || (cameraEra && getCameraEraFilter(cameraEra))
          ? { filter: [filterStyle, getCameraEraFilter(cameraEra)].filter(Boolean).join(' ') || undefined }
          : undefined
        }
      />
      {/* File size badge for images — matches video badge style */}
      {!isLoading && fileSize != null && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/80 px-2 py-0.5 border border-white/30 pointer-events-none">
          <span className="text-white text-[10px] font-black uppercase tracking-wider">OPTIMIZED</span>
          <span className="text-white/60 text-[10px] font-mono">
            {fileSize >= 1024 * 1024
              ? `${(fileSize / 1024 / 1024).toFixed(1)} MB`
              : `${(fileSize / 1024).toFixed(0)} KB`}
          </span>
        </div>
      )}
      {/* Filter preview badge */}
      {filterId && filterId !== 'none' && !isLoading && (() => {
        const overlay = getFilterOverlay(filterId);
        if (!overlay) return null;
        return (
          <div
            className="absolute inset-0 pointer-events-none z-[5]"
            style={{ background: overlay.gradient, mixBlendMode: overlay.blend as any }}
          />
        );
      })()}
      {/* Camera era vignette overlay */}
      {cameraEra && !isLoading && (() => {
        const eraOverlay = getCameraEraOverlay(cameraEra);
        if (!eraOverlay) return null;
        return (
          <div
            className="absolute inset-0 pointer-events-none z-[6]"
            style={{ background: eraOverlay.gradient, mixBlendMode: eraOverlay.blend as any }}
          />
        );
      })()}
      {/* Camera era sensor grain overlay */}
      {cameraEra && !isLoading && (() => {
        const grain = getCameraEraGrain(cameraEra);
        if (!grain) return null;
        return (
          <div
            className="absolute inset-0 pointer-events-none z-[7]"
            style={{
              backgroundImage: grain.backgroundImage,
              backgroundSize: '300px 300px',
              opacity: grain.opacity,
              mixBlendMode: 'overlay',
              animation: 'grainDrift 0.8s steps(4) infinite',
            }}
          />
        );
      })()}
      {/* Camera era light leak overlay */}
      {cameraEra && !isLoading && (() => {
        const lightLeak = getCameraEraLightLeak(cameraEra);
        if (!lightLeak) return null;
        return (
          <div
            className="absolute inset-0 pointer-events-none z-[8]"
            style={{
              background: lightLeak.gradient,
              mixBlendMode: lightLeak.blend as any,
              animation: 'lightLeakPulse 4s ease-in-out infinite',
            }}
          />
        );
      })()}
    </div>
  );
}