import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Send, Heart, Eye, MessageCircle, UserPlus, UserCheck, Star } from "lucide-react";
import { Story } from "../types";
import { getFilterStyle } from "./PhotoFilterPicker";
import { getFilterOverlay } from "./PhotoFilterPicker";
import { getCameraEraFilter, getCameraEraOverlay, getCameraEraLightLeak } from "./PhotoFilterPicker";
import { getCameraEraGrain } from "./PhotoFilterPicker";
import { VHSNightVisionOverlay, isVHSFilter } from "./VHSNightVisionOverlay";

export type ViewerRelationship = "following_you" | "follows_you" | "friends" | "close_friends" | "none";

export interface StoryViewerEntry {
  userId: string;
  username: string;
  userAvatar: string;
  liked: boolean;
  timestamp: string;
  relationship?: ViewerRelationship;
  isCloseFriend?: boolean;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onViewProfile?: (userId: string) => void;
  onNavigateToMessages?: (user: { userId: string; username: string; userAvatar: string }) => void;
  onNextUser?: () => void;
  onPreviousUser?: () => void;
  onStoryView?: (storyId: string) => void;
  isOwnStory?: boolean;
  viewers?: StoryViewerEntry[];
}

// ─── Relationship label helper ────────────────────────────────────────────────
function RelationshipLabel({ rel, isCloseFriend }: { rel?: ViewerRelationship; isCloseFriend?: boolean }) {
  if (isCloseFriend) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-green-400">
        <Star size={9} fill="#4ade80" strokeWidth={0} />
        Close Friend
      </span>
    );
  }
  switch (rel) {
    case "friends":
      return <span className="text-[10px] font-bold text-blue-400">Friends</span>;
    case "following_you":
      return <span className="text-[10px] font-bold text-white/40">Following you</span>;
    case "follows_you":
      return <span className="text-[10px] font-bold text-white/40">Follows you</span>;
    case "close_friends":
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-green-400">
          <Star size={9} fill="#4ade80" strokeWidth={0} />
          Close Friend
        </span>
      );
    default:
      return <span className="text-[10px] font-bold text-white/25">Not connected</span>;
  }
}

// ─── Viewer Row ───────────────────────────────────────────────────────────────
function ViewerRow({
  viewer,
  onMessage,
  onAddFriend,
  friendStates,
  setFriendStates,
}: {
  viewer: StoryViewerEntry;
  onMessage: () => void;
  onAddFriend: () => void;
  friendStates: Record<string, "none" | "requested" | "friends">;
  setFriendStates: React.Dispatch<React.SetStateAction<Record<string, "none" | "requested" | "friends">>>;
}) {
  const friendState = friendStates[viewer.userId] ?? (
    viewer.relationship === "friends" || viewer.relationship === "close_friends" ? "friends" : "none"
  );

  const isFriendOrCF = viewer.relationship === "friends" || viewer.relationship === "close_friends";

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 active:bg-white/5">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`w-11 h-11 overflow-hidden border-2 ${viewer.liked ? "border-red-500" : viewer.isCloseFriend || viewer.relationship === "close_friends" ? "border-green-500" : "border-white/20"}`}>
          <img src={viewer.userAvatar} alt={viewer.username} className="w-full h-full object-cover" />
        </div>
        {viewer.liked && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-[#111]">
            <Heart size={8} fill="white" strokeWidth={0} />
          </div>
        )}
        {(viewer.isCloseFriend || viewer.relationship === "close_friends") && !viewer.liked && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#111]">
            <Star size={9} fill="white" strokeWidth={0} />
          </div>
        )}
      </div>

      {/* Name + relationship */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-white text-sm truncate">{viewer.username}</p>
          {viewer.liked && <Heart size={11} fill="#f87171" strokeWidth={0} className="shrink-0 text-red-400" />}
        </div>
        <RelationshipLabel rel={viewer.relationship} isCloseFriend={viewer.isCloseFriend} />
        <p className="text-[10px] text-white/25 mt-0.5">{viewer.timestamp}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Message */}
        <button
          onClick={onMessage}
          className="w-8 h-8 bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
          title="Message"
        >
          <MessageCircle size={14} strokeWidth={2.5} className="text-white" />
        </button>

        {/* Add Friend / Friends */}
        {!isFriendOrCF && (
          <button
            onClick={() => {
              if (friendState === "none") {
                setFriendStates(prev => ({ ...prev, [viewer.userId]: "requested" }));
                onAddFriend();
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase border transition-colors ${
              friendState === "requested"
                ? "bg-white/10 border-white/20 text-white/50 cursor-default"
                : "bg-orange-500 border-orange-600 text-white hover:bg-orange-600"
            }`}
            disabled={friendState === "requested"}
          >
            {friendState === "requested" ? (
              <><UserCheck size={10} strokeWidth={3} /> Sent</>
            ) : (
              <><UserPlus size={10} strokeWidth={3} /> Add</>
            )}
          </button>
        )}
        {(isFriendOrCF || friendState === "friends") && (
          <div className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase border border-green-500/40 text-green-400">
            <UserCheck size={10} strokeWidth={3} /> Friends
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Viewers Sheet — fully isolated portal ────────────────────────────────────
function ViewersSheet({
  viewers,
  story,
  onClose,
  onMessage,
}: {
  viewers: StoryViewerEntry[];
  story: { imageUrl: string; username: string; timestamp: string } | null;
  onClose: () => void;
  onMessage: (viewer: StoryViewerEntry) => void;
}) {
  const [tab, setTab] = useState<"viewers" | "likes">("viewers");
  const [dragOffset, setDragOffset] = useState(0);
  const [visible, setVisible] = useState(false);
  const [friendStates, setFriendStates] = useState<Record<string, "none" | "requested" | "friends">>({});
  const dragStartY = useRef<number | null>(null);

  // Animate in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const likedViewers = [...viewers].filter(v => v.liked).sort((a, b) => {
    // Most recent likes first — parse timestamps
    const parseTs = (ts: string) => {
      const n = parseInt(ts) || 0;
      if (ts.includes('m')) return n;
      if (ts.includes('h')) return n * 60;
      return n * 1440;
    };
    return parseTs(a.timestamp) - parseTs(b.timestamp);
  });

  // Priority order: Close Friends → Friends → Following → Not connected
  const sortedViewers = [...viewers].sort((a, b) => {
    const priority = (v: StoryViewerEntry) => {
      if (v.isCloseFriend || v.relationship === "close_friends") return 0;
      if (v.relationship === "friends") return 1;
      if (v.relationship === "following_you" || v.relationship === "follows_you") return 2;
      return 3;
    };
    return priority(a) - priority(b);
  });

  const displayedViewers = tab === "likes" ? likedViewers : sortedViewers;

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 380);
  };

  const onDragStart = (clientY: number) => {
    dragStartY.current = clientY;
    setDragOffset(0);
  };
  const onDragMove = (clientY: number) => {
    if (dragStartY.current === null) return;
    const d = clientY - dragStartY.current;
    if (d > 0) setDragOffset(d);
  };
  const onDragEnd = () => {
    if (dragOffset > 90) { close(); } else { setDragOffset(0); }
    dragStartY.current = null;
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col justify-end" style={{ touchAction: "none" }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }}
        onClick={close}
      />

      {/* Sheet panel */}
      <div
        className="relative flex flex-col bg-[#111]"
        style={{
          height: "82%",
          transform: visible ? `translateY(${Math.max(0, dragOffset)}px)` : "translateY(100%)",
          transition: dragOffset > 0 ? "none" : "transform 0.38s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: "0 -4px 0 0 #ea580c",
          borderTop: "4px solid #f97316",
        }}
        onTouchStart={e => { e.stopPropagation(); onDragStart(e.touches[0].clientY); }}
        onTouchMove={e => { e.stopPropagation(); onDragMove(e.touches[0].clientY); }}
        onTouchEnd={e => { e.stopPropagation(); onDragEnd(); }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab shrink-0">
          <div className="w-10 h-1 bg-white/25" />
        </div>

        {/* ── Story header (thumbnail + name + time) ─────────────────── */}
        {story && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
            <div className="w-10 h-14 border border-white/20 overflow-hidden shrink-0">
              <img src={story.imageUrl} alt="Story" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-sm uppercase truncate">{story.username}</p>
              <p className="text-[10px] font-mono text-white/40 mt-0.5">{story.timestamp}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <Eye size={11} strokeWidth={2.5} className="text-orange-400" />
                  <span className="text-xs font-bold text-white">{viewers.length}</span>
                  <span className="text-[10px] text-white/40">views</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart size={11} strokeWidth={0} fill="#f87171" className="text-red-400" />
                  <span className="text-xs font-bold text-white">{likedViewers.length}</span>
                  <span className="text-[10px] text-white/40">likes</span>
                </div>
              </div>
            </div>
            <button
              onClick={close}
              className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white shrink-0"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 border-b border-white/10">
          <button
            onClick={() => setTab("viewers")}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
              tab === "viewers" ? "text-orange-500 border-orange-500" : "text-white/40 border-transparent"
            }`}
          >
            <Eye size={12} className="inline mr-1.5" strokeWidth={2.5} />
            Viewers &nbsp;{viewers.length}
          </button>
          <button
            onClick={() => setTab("likes")}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              tab === "likes" ? "text-red-400 border-red-400" : "text-white/40 border-transparent"
            }`}
          >
            {tab === "likes"
              ? <Heart size={11} fill="#f87171" strokeWidth={0} />
              : <Heart size={11} fill="none" strokeWidth={2.5} />
            }
            Likes &nbsp;{likedViewers.length}
          </button>
        </div>

        {/* ── Viewer / Like list ───────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          onTouchStart={e => e.stopPropagation()}
        >
          {displayedViewers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              {tab === "likes" ? (
                <>
                  <Heart size={48} strokeWidth={1} className="text-white/10" />
                  <p className="font-black text-white/25 text-sm uppercase">No likes yet</p>
                  <p className="text-xs text-white/20 font-bold">People who liked your story appear here</p>
                </>
              ) : (
                <>
                  <Eye size={48} strokeWidth={1} className="text-white/10" />
                  <p className="font-black text-white/25 text-sm uppercase">No views yet</p>
                  <p className="text-xs text-white/20 font-bold">Share your vibe with the world</p>
                </>
              )}
            </div>
          ) : (
            displayedViewers.map(viewer => (
              <ViewerRow
                key={viewer.userId}
                viewer={viewer}
                friendStates={friendStates}
                setFriendStates={setFriendStates}
                onMessage={() => onMessage(viewer)}
                onAddFriend={() => console.log(`Friend request sent to ${viewer.username}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main StoryViewer ─────────────────────────────────────────────────────────
export function StoryViewer({
  stories,
  initialIndex,
  onClose,
  onViewProfile,
  onNavigateToMessages,
  onNextUser,
  onPreviousUser,
  onStoryView,
  isOwnStory = false,
  viewers = [],
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [showReplySuccess, setShowReplySuccess] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isUserSwitch, setIsUserSwitch] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  const storiesRef = useRef(stories);
  useEffect(() => { storiesRef.current = stories; }, [stories]);
  const showViewersSheetRef = useRef(showViewersSheet);
  useEffect(() => { showViewersSheetRef.current = showViewersSheet; }, [showViewersSheet]);

  const currentUserId = stories[0]?.userId;
  const prevUserIdRef = useRef<string | undefined>(currentUserId);
  const likedViewers = viewers.filter(v => v.liked);

  useEffect(() => {
    if (prevUserIdRef.current !== currentUserId) {
      setIsUserSwitch(true);
      const t = setTimeout(() => setIsUserSwitch(false), 1000);
      prevUserIdRef.current = currentUserId;
      return () => clearTimeout(t);
    } else {
      setIsUserSwitch(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!storiesRef.current[currentIndex]) {
      if (currentIndex > 0 && storiesRef.current.length > 0) setCurrentIndex(0);
      else onClose();
    }
  }, [currentIndex, onClose]);

  useEffect(() => {
    const story = storiesRef.current[currentIndex];
    if (story && onStoryView && !story.viewed) onStoryView(story.id);
  }, [currentIndex, onStoryView]);

  useEffect(() => {
    setProgress(0);
    setIsLiked(false);
    setReplyText("");
    setShowViewersSheet(false);
  }, [currentIndex, currentUserId]);

  const handleNext = useCallback(() => {
    const idx = currentIndexRef.current;
    const len = storiesRef.current.length;
    if (idx < len - 1) { setDirection("next"); setCurrentIndex(idx + 1); }
    else if (onNextUser) { setDirection("next"); onNextUser(); }
    else onClose();
  }, [onNextUser, onClose]);

  const handlePrevious = useCallback(() => {
    const idx = currentIndexRef.current;
    if (idx > 0) { setDirection("prev"); setCurrentIndex(idx - 1); }
    else if (onPreviousUser) { setDirection("prev"); onPreviousUser(); }
  }, [onPreviousUser]);

  const effectivePause = isPaused || showViewersSheet;

  useEffect(() => {
    if (effectivePause) return;
    const id = setInterval(() => setProgress(p => p >= 100 ? 100 : p + 2), 100);
    return () => clearInterval(id);
  }, [effectivePause, currentIndex]);

  useEffect(() => {
    if (progress >= 100 && !effectivePause) {
      const t = setTimeout(() => handleNext(), 100);
      return () => clearTimeout(t);
    }
  }, [progress, effectivePause, handleNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (showViewersSheetRef.current) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (showViewersSheetRef.current) return;
    setIsPaused(false);
    const ts = touchStartRef.current;
    if (!ts) return;
    touchStartRef.current = null;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = ts.x - endX;
    const diffY = ts.y - endY;
    const diffTime = Date.now() - ts.time;
    if (diffY > 40 && Math.abs(diffY) > Math.abs(diffX) && isOwnStory) { setShowViewersSheet(true); return; }
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) { if (onNextUser) { setDirection("next"); onNextUser(); } else onClose(); }
      else { if (onPreviousUser) { setDirection("prev"); onPreviousUser(); } }
      return;
    }
    if (diffTime < 250 && Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
      if (endX > window.innerWidth / 2) handleNext(); else handlePrevious();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (showViewersSheetRef.current) return;
    touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    setIsPaused(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (showViewersSheetRef.current) return;
    setIsPaused(false);
    const ts = touchStartRef.current;
    if (!ts) return;
    touchStartRef.current = null;
    const diffX = ts.x - e.clientX;
    const diffY = ts.y - e.clientY;
    const diffTime = Date.now() - ts.time;
    if (diffY > 40 && Math.abs(diffY) > Math.abs(diffX) && isOwnStory) { setShowViewersSheet(true); return; }
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) { if (onNextUser) { setDirection("next"); onNextUser(); } else onClose(); }
      else { if (onPreviousUser) { setDirection("prev"); onPreviousUser(); } }
      return;
    }
    if (diffTime < 250 && Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
      if (e.clientX > window.innerWidth / 2) handleNext(); else handlePrevious();
    }
  };

  const handleMouseLeave = () => {
    if (showViewersSheetRef.current) return;
    setIsPaused(false);
    touchStartRef.current = null;
  };

  const currentStory = stories[currentIndex];
  if (!currentStory) return null;

  function handleSendReply() {
    if (!replyText.trim()) return;
    setShowReplySuccess(true);
    setTimeout(() => { setShowReplySuccess(false); setReplyText(""); }, 2000);
  }

  function handleLike() {
    if (!isLiked) {
      setIsLiked(true);
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
    }
  }

  return (
    <>
      {createPortal(
        <div
          className="absolute inset-0 z-[9999] bg-black select-none overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* ── Media ─────────────────────────────────────────────────────── */}
          <div className="absolute inset-0">
            {currentStory.videoUrl ? (
              isVHSFilter(currentStory.filter) ? (
                <VHSNightVisionOverlay className={`w-full h-full animate-in fade-in ${isUserSwitch ? `duration-1000 ${direction === "next" ? "slide-in-from-right-full" : "slide-in-from-left-full"}` : "duration-200"}`}>
                  <video key={currentStory.id} src={currentStory.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                </VHSNightVisionOverlay>
              ) : (
                <video
                  key={currentStory.id}
                  src={currentStory.videoUrl}
                  autoPlay loop muted playsInline
                  className={`w-full h-full object-contain animate-in fade-in ${isUserSwitch ? `duration-1000 ${direction === "next" ? "slide-in-from-right-full" : "slide-in-from-left-full"}` : "duration-200"}`}
                  style={currentStory.cameraEra && getCameraEraFilter(currentStory.cameraEra) ? { filter: getCameraEraFilter(currentStory.cameraEra)! } : undefined}
                />
              )
            ) : (
              <img
                key={currentStory.id}
                src={currentStory.imageUrl}
                alt="Story"
                className={`w-full h-full object-contain animate-in fade-in ${isUserSwitch ? `duration-1000 ${direction === "next" ? "slide-in-from-right-full" : "slide-in-from-left-full"}` : "duration-200"}`}
                style={currentStory.filter || currentStory.cameraEra ? { filter: [currentStory.filter ? getFilterStyle(currentStory.filter) : null, getCameraEraFilter(currentStory.cameraEra)].filter(Boolean).join(" ") || undefined } : {}}
                draggable={false}
              />
            )}
            {currentStory.filter && !currentStory.videoUrl && (() => { const o = getFilterOverlay(currentStory.filter); return o ? <div className="absolute inset-0 pointer-events-none z-[1]" style={{ background: o.gradient, mixBlendMode: o.blend as any }} /> : null; })()}
            {currentStory.cameraEra && (() => { const o = getCameraEraOverlay(currentStory.cameraEra); return o ? <div className="absolute inset-0 pointer-events-none z-[2]" style={{ background: o.gradient, mixBlendMode: o.blend as any }} /> : null; })()}
            {currentStory.cameraEra && (() => { const g = getCameraEraGrain(currentStory.cameraEra); return g ? <div className="absolute inset-0 pointer-events-none z-[3]" style={{ backgroundImage: g.backgroundImage, backgroundSize: "300px 300px", opacity: g.opacity, mixBlendMode: "overlay", animation: "grainDrift 0.8s steps(4) infinite" }} /> : null; })()}
            {currentStory.cameraEra && (() => { const l = getCameraEraLightLeak(currentStory.cameraEra); return l ? <div className="absolute inset-0 pointer-events-none z-[4]" style={{ background: l.gradient, mixBlendMode: l.blend as any, animation: "lightLeakPulse 4s ease-in-out infinite" }} /> : null; })()}
            {stories[currentIndex + 1] && (stories[currentIndex + 1].videoUrl
              ? <video src={stories[currentIndex + 1].videoUrl} className="hidden" preload="auto" />
              : <img src={stories[currentIndex + 1].imageUrl} alt="" className="hidden" />
            )}
          </div>

          {/* ── Bottom gradient (own story) ────────────────────────────── */}
          {isOwnStory && (
            <div
              className="absolute bottom-0 left-0 right-0 h-56 pointer-events-none z-[5]"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)" }}
            />
          )}

          {/* ── Progress bars ──────────────────────────────────────────── */}
          <div className={`absolute top-0 left-0 right-0 flex gap-1 p-2 z-10 transition-opacity duration-300 ${effectivePause ? "opacity-0" : "opacity-100"}`}>
            {stories.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] bg-white/30 overflow-hidden">
                <div className="h-full bg-white transition-all ease-linear" style={{ width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%" }} />
              </div>
            ))}
          </div>

          {/* ── Header ────────────────────────────────────────────────── */}
          <div className={`absolute top-6 left-0 right-0 flex items-center justify-between px-4 z-20 pointer-events-none transition-opacity duration-300 ${effectivePause ? "opacity-0" : "opacity-100"}`}>
            {isOwnStory ? (
              <div className="flex items-center gap-2 bg-black border-2 border-orange-500 px-3 py-1.5 shadow-[4px_4px_0px_0px_#f97316]">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <p className="font-black text-sm text-orange-500 uppercase tracking-wider">MY VIBE</p>
                <p className="text-[10px] font-mono font-bold text-white/60">{currentStory.timestamp}</p>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); if (onViewProfile && currentStory?.userId) onViewProfile(currentStory.userId.trim()); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="flex items-center gap-3 bg-black border-2 border-white px-3 py-1.5 shadow-[4px_4px_0px_0px_white] pointer-events-auto cursor-pointer"
              >
                <div className="w-8 h-8 overflow-hidden border border-white">
                  <img src={currentStory.userAvatar} alt={currentStory.username} className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <p className="font-black text-sm text-white uppercase">{currentStory.username}</p>
                  <p className="text-[10px] font-mono font-bold text-white/70">{currentStory.timestamp}</p>
                </div>
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => { e.stopPropagation(); }}
              onTouchEnd={(e) => { e.stopPropagation(); onClose(); }}
              className="w-10 h-10 bg-black/60 border border-white/30 flex items-center justify-center pointer-events-auto cursor-pointer"
            >
              <X className="text-white" size={22} strokeWidth={2.5} />
            </button>
          </div>

          {/* ── OWNER BOTTOM BAR ───────────────────────────────────────── */}
          {isOwnStory && (
            <div className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${effectivePause ? "opacity-0" : "opacity-100"}`}>
              <button
                className="w-full flex items-center justify-between px-5 py-4 pointer-events-auto cursor-pointer active:opacity-70"
                onClick={(e) => { e.stopPropagation(); setShowViewersSheet(true); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => { e.stopPropagation(); }}
                onTouchEnd={(e) => { e.stopPropagation(); setShowViewersSheet(true); }}
              >
                <div className="flex items-center gap-3">
                  {viewers.length > 0 && (
                    <div className="flex items-center">
                      {viewers.slice(0, 3).map((v, i) => (
                        <div key={v.userId} className="w-8 h-8 rounded-full border-2 border-black overflow-hidden" style={{ marginLeft: i > 0 ? "-10px" : "0", zIndex: 3 - i }}>
                          <img src={v.userAvatar} alt={v.username} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Eye size={16} strokeWidth={2.5} className="text-white" />
                    <span className="font-bold text-white text-sm">{viewers.length}</span>
                  </div>
                  {likedViewers.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Heart size={14} strokeWidth={0} fill="#f87171" className="text-red-400" />
                      <span className="font-bold text-white text-sm">{likedViewers.length}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white/70 uppercase tracking-widest">See all</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white/70">
                    <path d="M7 11V3M3 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>
            </div>
          )}

          {/* ── VIEWER REPLY BAR (non-owner) ───────────────────────────── */}
          {!isOwnStory && (
            <div
              className={`absolute bottom-4 left-4 right-4 z-20 transition-opacity duration-300 ${isPaused ? "opacity-0" : "opacity-100"}`}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 bg-black border-2 border-white p-2 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <div className="w-10 h-10 border border-white overflow-hidden bg-white">
                  <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" alt="You" className="w-full h-full object-cover grayscale" />
                </div>
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                  placeholder={`MESSAGE ${currentStory.username.toUpperCase()}...`}
                  className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm font-bold font-mono uppercase focus:outline-none px-2"
                />
                {replyText.trim() ? (
                  <button onClick={handleSendReply} className="w-10 h-10 bg-white border border-white flex items-center justify-center text-black">
                    <Send size={18} strokeWidth={3} />
                  </button>
                ) : (
                  <button
                    onClick={handleLike}
                    className={`w-10 h-10 border border-white flex items-center justify-center transition-all ${isLiked ? "bg-red-600 text-white" : "bg-transparent text-white hover:bg-white hover:text-black"}`}
                  >
                    <Heart size={20} strokeWidth={3} fill={isLiked ? "currentColor" : "none"} />
                  </button>
                )}
              </div>
            </div>
          )}

          {showReplySuccess && (
            <div className="absolute bottom-24 left-0 right-0 flex justify-center z-30 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white border-2 border-black px-6 py-3 shadow-[4px_4px_0px_0px_black]">
                <p className="text-sm font-black text-black flex items-center gap-2 uppercase">
                  <Send size={16} strokeWidth={3} /> SENT TO {currentStory.username}
                </p>
              </div>
            </div>
          )}

          {showLikeAnimation && (
            <div className="absolute bottom-24 left-0 right-0 flex justify-center z-30 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-red-600 border-2 border-black px-6 py-3 shadow-[4px_4px_0px_0px_black]">
                <p className="text-sm font-black text-white flex items-center gap-2 uppercase">
                  <Heart size={16} fill="white" /> LIKED
                </p>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* ── Viewers sheet — own separate portal ──────────────────────────── */}
      {isOwnStory && showViewersSheet && (
        <ViewersSheet
          viewers={viewers}
          story={currentStory ? { imageUrl: currentStory.imageUrl, username: currentStory.username, timestamp: currentStory.timestamp } : null}
          onClose={() => setShowViewersSheet(false)}
          onMessage={(viewer) => {
            setShowViewersSheet(false);
            onClose();
            if (onNavigateToMessages) {
              onNavigateToMessages({ userId: viewer.userId, username: viewer.username, userAvatar: viewer.userAvatar });
            }
          }}
        />
      )}
    </>
  );
}