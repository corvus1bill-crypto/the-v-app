import { useState, useRef, useEffect } from 'react';
import { X, Send, Heart, MoreVertical, Play, Pause, ThumbsDown, Trash2, Mic, Image as ImageIcon, StopCircle, Maximize2, Copy, Flag } from 'lucide-react';
import { Post, Comment } from "../types";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { projectId, publicAnonKey } from "../supabaseClient";
import * as db from "../db";

interface CommentsModalProps {
  post: Post;
  onClose: () => void;
  onAddComment: (postId: string, comment: Comment) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  currentUserId?: string;
  currentUserAvatar?: string;
  currentUsername?: string;
  onNavigateToProfile?: (userId: string) => void;
}

/** Render comment text with tappable @mention spans */
function CommentText({ text, onNavigateToProfile }: { text: string; onNavigateToProfile?: (userId: string) => void }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <p className="text-sm text-foreground font-medium leading-relaxed break-words">
      {parts.map((part, i) =>
        part.startsWith('@') && onNavigateToProfile ? (
          <button
            key={i}
            onClick={() => onNavigateToProfile(part.slice(1))}
            className="font-black text-foreground underline decoration-dotted underline-offset-1 hover:no-underline transition-all"
          >
            {part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

// Helper component for playing voice messages
const VoicePlayer = ({ text, autoPlay = false }: { text: string, autoPlay?: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Parse text format: "🎤 Voice Message (0:05)|blob:..."
  const parts = text.split('|');
  const displayLabel = parts[0]; 
  const audioUrl = parts[1]; 

  const durationMatch = displayLabel.match(/\((\d+):(\d+)\)/);
  const totalSeconds = durationMatch ? parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2]) : 15;
  
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };

      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      return () => {
        audio.pause();
        audioRef.current = null;
      };
    }
  }, [audioUrl]);

  useEffect(() => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.play().catch(e => {
          console.error("Audio play failed:", e);
          setIsPlaying(false);
        });
      } else {
        const utterance = new SpeechSynthesisUtterance("This is a voice message.");
        utterance.volume = 0.5;
        utterance.rate = 1;
        window.speechSynthesis.speak(utterance);
        
        let simProgress = 0;
        const interval = setInterval(() => {
          simProgress += (100 / totalSeconds / 10);
          if (simProgress >= 100) {
            setIsPlaying(false);
            setProgress(0);
            clearInterval(interval);
          } else {
            setProgress(simProgress);
          }
        }, 100);
        
        return () => {
             clearInterval(interval);
             window.speechSynthesis.cancel();
        };
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      } else {
        window.speechSynthesis.cancel();
      }
    }
  }, [isPlaying, totalSeconds]);

  return (
    <div className="flex items-center gap-3 bg-card border-2 border-foreground px-3 py-1.5 w-fit min-w-[200px] shadow-[4px_4px_0px_0px_var(--foreground)]">
      <button 
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-8 h-8 bg-foreground text-background flex items-center justify-center hover:bg-background hover:text-foreground border-2 border-foreground transition-colors flex-shrink-0"
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col justify-center gap-1">
        <div className="h-2 bg-foreground/10 border border-foreground overflow-hidden w-full">
          <div 
            className="h-full bg-foreground transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-foreground font-mono font-bold">
          <span>{isPlaying && audioRef.current ? `${Math.floor(audioRef.current.currentTime)}s` : (isPlaying ? `${Math.floor((progress/100) * totalSeconds)}s` : '0:00')}</span>
          <span>{Math.floor(totalSeconds / 60)}:{String(totalSeconds % 60).padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
};

// Mock data
const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    userId: 'user2',
    username: 'UrbanPhotog',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    text: 'Absolutely stunning! 🔥',
    timestamp: '2h',
    likes: 12,
    replies: [
      {
        id: 'r1-2',
        userId: 'user5',
        username: 'TravelAddict',
        userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
        text: '@UrbanPhotog couldn\'t agree more!',
        timestamp: '45m',
        likes: 2,
      },
      {
        id: 'r1-1',
        userId: 'user3',
        username: 'FoodieDreams',
        userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
        text: '@UrbanPhotog yes the lighting is 🔥🔥',
        timestamp: '1h',
        likes: 5,
      },
    ]
  },
  {
    id: 'c2',
    userId: 'user3',
    username: 'FoodieDreams',
    userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    text: 'The colors in this are amazing',
    timestamp: '1h',
    likes: 8
  },
  {
    id: 'c3',
    userId: 'user5',
    username: 'TravelAddict',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    text: 'Where is this location?',
    timestamp: '30m',
    likes: 5
  }
];

export function CommentsModal({ post, onClose, onAddComment, onDeleteComment, currentUserId = 'currentUser', currentUserAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', currentUsername = 'You', onNavigateToProfile }: CommentsModalProps) {
  const [localComments, setLocalComments] = useState<Comment[]>(() => {
    return post.commentsList || MOCK_COMMENTS;
  });

  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [activeMenuCommentId, setActiveMenuCommentId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'new' | 'top'>('new');
  const [pinnedCommentId, setPinnedCommentId] = useState<string | null>(post.pinnedCommentId || null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentsListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const isSimulatedRef = useRef<boolean>(false);

  useEffect(() => {
    if (post.commentsList) {
      setLocalComments(post.commentsList);
    }
  }, [post.commentsList]);

  const handleCommentLike = (commentId: string) => {
    setLocalComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const newIsLiked = !comment.isLiked;
        const newLikes = newIsLiked 
          ? comment.likes + 1 
          : Math.max(comment.likes - 1, 0);
        
        return {
          ...comment,
          isLiked: newIsLiked,
          likes: newLikes,
          // If liking, remove dislike
          isDisliked: newIsLiked ? false : comment.isDisliked,
          dislikes: newIsLiked && comment.isDisliked 
            ? Math.max((comment.dislikes || 0) - 1, 0) 
            : (comment.dislikes || 0)
        };
      }
      return comment;
    }));
    // Persist to backend (fire-and-forget)
    if (currentUserId) {
      fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/posts/${post.id}/comment/${commentId}/like`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` }, body: JSON.stringify({ userId: currentUserId }) }
      ).catch(err => console.warn('Comment like persist failed:', err));
    }
  };

  const handleCommentDislike = (commentId: string) => {
    setLocalComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const newIsDisliked = !comment.isDisliked;
        const newDislikes = newIsDisliked 
          ? (comment.dislikes || 0) + 1 
          : Math.max((comment.dislikes || 0) - 1, 0);
        
        return {
          ...comment,
          isDisliked: newIsDisliked,
          dislikes: newDislikes,
          // If disliking, remove like
          isLiked: newIsDisliked ? false : comment.isLiked,
          likes: newIsDisliked && comment.isLiked 
            ? Math.max(comment.likes - 1, 0) 
            : comment.likes
        };
      }
      return comment;
    }));
  };

  const handleSend = (overrideText?: string) => {
    const textToSend = overrideText || newComment;
    if (!textToSend.trim()) return;
    
    setIsSubmitting(true);
    
    setTimeout(async () => {
      const comment: Comment = {
        id: `c-${Date.now()}`,
        userId: currentUserId,
        username: currentUsername,
        userAvatar: currentUserAvatar,
        text: textToSend,
        timestamp: 'Just now',
        likes: 0
      };

      if (replyingTo) {
        // Nest reply under parent comment, newest first (prepend)
        setLocalComments(prev => prev.map(c =>
          c.id === replyingTo.id
            ? { ...c, replies: [comment, ...(c.replies || [])] }
            : c
        ));
        // Auto-expand the reply thread
        setExpandedReplies(prev => new Set([...prev, replyingTo.id]));
        // Persist reply to backend
        try {
          if (currentUserId && replyingTo.id) {
            await db.createComment(post.id, {
              text: textToSend,
              user_id: currentUserId,
              parent_comment_id: replyingTo.id
            } as any);
          }
        } catch (error) {
          console.warn('Reply persist failed:', error);
        }
      } else {
        setLocalComments(prev => [...prev, comment]);
        onAddComment(post.id, comment);
        
        // Persist to real database
        try {
          if (currentUserId) {
            await db.createComment(post.id, {
              text: textToSend,
              user_id: currentUserId
            } as any);
          }
        } catch (error) {
          console.error('Failed to save comment to database:', error);
        }
      }

      setNewComment("");
      setReplyingTo(null);
      setIsSubmitting(false);
      
      setTimeout(() => {
        if (commentsListRef.current) {
          commentsListRef.current.scrollTo({ top: commentsListRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    }, 500);
  };

  const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        isSimulatedRef.current = false;
        
        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const durationSecs = Math.round((Date.now() - startTimeRef.current) / 1000);
            const minutes = Math.floor(durationSecs / 60);
            const seconds = durationSecs % 60;
            
            setNewComment(`🎤 Voice Message (${minutes}:${seconds.toString().padStart(2, '0')})|${audioUrl}`);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordingTime(0);
        startTimeRef.current = Date.now();
        
        recordingIntervalRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
        
      } catch (err) {
        isSimulatedRef.current = true;
        setIsRecording(true);
        setRecordingTime(0);
        
        recordingIntervalRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
      }
  };

  const stopRecording = () => {
      if (isRecording) {
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        setIsRecording(false);

        if (!isSimulatedRef.current && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        } else if (isSimulatedRef.current) {
             const minutes = Math.floor(recordingTime / 60);
             const seconds = recordingTime % 60;
             setNewComment(`🎤 Voice Message (${minutes}:${seconds.toString().padStart(2, '0')})`);
        }
      }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 150 || info.velocity.y > 500) {
      onClose();
    }
  };

  useEffect(() => {
      return () => {
          if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
          window.speechSynthesis.cancel();
      };
  }, []);

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'absolute';
    textArea.style.left = '0';
    textArea.style.top = '0';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  // Sort and pin logic
  const sortedComments = [...localComments].sort((a, b) => {
    if (a.id === pinnedCommentId) return -1;
    if (b.id === pinnedCommentId) return 1;
    if (sortMode === 'top') return b.likes - a.likes;
    return 0; // Keep original order for 'new'
  });

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={handleDragEnd}
          className="relative w-full max-w-lg bg-card border-t-4 sm:border-4 border-foreground shadow-[0_-8px_0px_0px_color-mix(in_srgb,var(--foreground)_20%,transparent)] overflow-hidden flex flex-col sm:h-[800px]"
          style={{ height: '90%' }}
        >
          {/* Drag Handle / Header */}
          <div className="flex-shrink-0 relative pt-3 pb-4 px-6 border-b-4 border-foreground bg-background">
            {/* Swipe Indicator */}
            <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none">
              <div className="w-12 h-1.5 bg-foreground rounded-full" />
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <div className="bg-foreground p-1">
                    <Heart className="text-background" size={18} fill="currentColor" />
                </div>
                <h3 className="font-black text-lg text-foreground uppercase italic">
                  {localComments.length} Replies
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Sort toggle */}
                <div className="flex border-2 border-foreground overflow-hidden">
                  <button
                    onClick={() => setSortMode('new')}
                    className={`px-2 py-1 text-[10px] font-black uppercase transition-colors ${sortMode === 'new' ? 'bg-foreground text-background' : 'bg-card text-foreground hover:bg-foreground/10'}`}
                  >New</button>
                  <button
                    onClick={() => setSortMode('top')}
                    className={`px-2 py-1 text-[10px] font-black uppercase border-l-2 border-foreground transition-colors ${sortMode === 'top' ? 'bg-foreground text-background' : 'bg-card text-foreground hover:bg-foreground/10'}`}
                  >Top</button>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 bg-card border-2 border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors shadow-[2px_2px_0px_0px_var(--foreground)]"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div ref={commentsListRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide bg-card">
            {localComments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                <div className="w-16 h-16 border-4 border-foreground flex items-center justify-center mb-4">
                  <Heart className="text-foreground" size={32} />
                </div>
                <p className="font-black text-lg text-foreground uppercase">No comments yet</p>
                <p className="text-sm font-mono font-bold text-foreground">BE THE FIRST TO ENGAGE</p>
              </div>
            ) : (
              sortedComments.map((comment, commentIndex) => (
                <div key={comment.id} className="flex gap-3 group"
                  style={{ animation: `springUp 0.4s cubic-bezier(.22,.68,0,1.2) ${commentIndex * 40}ms both` }}
                >
                  <button
                    className="w-10 h-10 border-2 border-foreground bg-foreground flex-shrink-0 overflow-hidden shadow-[2px_2px_0px_0px_var(--foreground)] hover:scale-105 transition-transform"
                    onClick={() => onNavigateToProfile && comment.userId && onNavigateToProfile(comment.userId)}
                    aria-label={`View ${comment.username}'s profile`}
                  >
                      <img 
                        src={comment.userAvatar} 
                        alt={comment.username} 
                        className="w-full h-full object-cover"
                      />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <button
                        className="font-black text-sm text-foreground uppercase hover:underline decoration-2 underline-offset-2 transition-all"
                        onClick={() => onNavigateToProfile && comment.userId && onNavigateToProfile(comment.userId)}
                      >{comment.username}</button>
                      <span className="text-[10px] text-foreground/50 font-bold font-mono uppercase">{comment.timestamp}</span>
                    </div>
                    {(comment.text || '').startsWith('🎤 Voice Message') ? (
                      <VoicePlayer text={comment.text || ''} />
                    ) : (comment.text || '').startsWith('📷 [Photo]|') ? (
                       <div 
                         className="mt-2 group/image relative inline-block cursor-pointer overflow-hidden border-2 border-foreground bg-foreground"
                         onClick={() => setFullScreenImage((comment.text || '').split('|')[1])}
                       >
                         <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 size={20} className="text-white drop-shadow-md" />
                         </div>
                         <img 
                           src={(comment.text || '').split('|')[1]} 
                           alt="Uploaded photo" 
                           className="w-32 h-32 object-cover transition-all" 
                         />
                       </div>
                    ) : (
                      <CommentText text={comment.text || ''} onNavigateToProfile={onNavigateToProfile} />
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {/* Like Button */}
                      <button 
                        onClick={() => handleCommentLike(comment.id)}
                        className={`flex items-center gap-1.5 px-2 py-1 border-2 border-foreground text-xs font-bold uppercase transition-all shadow-[1px_1px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] ${
                          comment.isLiked 
                            ? 'bg-red-500 text-white' 
                            : 'bg-card text-foreground hover:bg-red-100'
                        }`}
                      >
                        <Heart size={12} className={comment.isLiked ? 'fill-current' : ''} strokeWidth={3} />
                        <span>{comment.likes > 0 ? comment.likes : 'LIKE'}</span>
                      </button>

                      {/* Dislike Button */}
                      <button 
                        onClick={() => handleCommentDislike(comment.id)}
                        className={`flex items-center gap-1.5 px-2 py-1 border-2 border-foreground text-xs font-bold uppercase transition-all shadow-[1px_1px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] ${
                          comment.isDisliked 
                            ? 'bg-gray-500 text-white' 
                            : 'bg-card text-foreground hover:bg-gray-100'
                        }`}
                      >
                        <ThumbsDown size={12} className={comment.isDisliked ? 'fill-current' : ''} strokeWidth={3} />
                        {(comment.dislikes || 0) > 0 && <span>{comment.dislikes}</span>}
                      </button>
                      
                      <button className="text-xs font-bold text-foreground/50 hover:text-foreground uppercase transition-colors"
                        onClick={() => {
                          setReplyingTo({ id: comment.id, username: comment.username });
                          setNewComment(`@${comment.username} `);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                      >Reply</button>
                      
                      {/* Pin badge */}
                      {comment.id === pinnedCommentId && (
                        <span className="text-[9px] font-black text-background uppercase tracking-wide">📌 Pinned</span>
                      )}
                      {/* Menu Button */}
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuCommentId(activeMenuCommentId === comment.id ? null : comment.id);
                          }}
                          className={`p-1 transition-colors ${activeMenuCommentId === comment.id ? 'text-foreground' : 'text-foreground/30 hover:text-foreground'}`}
                          title="More options"
                        >
                          <div className="flex gap-0.5">
                            <div className="w-1 h-1 bg-current rounded-full" />
                            <div className="w-1 h-1 bg-current rounded-full" />
                            <div className="w-1 h-1 bg-current rounded-full" />
                          </div>
                        </button>
                        {/* Dropdown menu */}
                        {activeMenuCommentId === comment.id && (
                          <div className="absolute right-0 top-7 z-50 bg-card border-2 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] min-w-[140px]"
                            style={{ animation: 'scaleIn 0.15s cubic-bezier(.22,.68,0,1.3) both' }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPinnedCommentId(pinnedCommentId === comment.id ? null : comment.id);
                                setActiveMenuCommentId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-black text-foreground uppercase hover:bg-background border-b border-foreground/10 flex items-center gap-2"
                            >
                              📌 {pinnedCommentId === comment.id ? 'Unpin' : 'Pin Comment'}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveMenuCommentId(null); }}
                              className="w-full text-left px-3 py-2 text-xs font-black text-foreground/50 uppercase hover:bg-foreground/5 flex items-center gap-2"
                            >
                              <Copy size={12} strokeWidth={3} /> Copy Text
                            </button>
                            {(comment.userId === currentUserId) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteComment(post.id, comment.id);
                                  setActiveMenuCommentId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-black text-red-500 uppercase hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 size={12} strokeWidth={3} /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Replies thread */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedReplies(prev => {
                            const next = new Set(prev);
                            next.has(comment.id) ? next.delete(comment.id) : next.add(comment.id);
                            return next;
                          })}
                          className="flex items-center gap-1.5 text-[11px] font-black uppercase text-foreground/50 hover:text-foreground transition-colors"
                        >
                          <div className="w-4 h-px bg-foreground/30" />
                          {expandedReplies.has(comment.id)
                            ? `Hide replies`
                            : `View ${comment.replies.length} repl${comment.replies.length === 1 ? 'y' : 'ies'}`}
                          <span className="text-[9px]">{expandedReplies.has(comment.id) ? '▲' : '▼'}</span>
                        </button>

                        {expandedReplies.has(comment.id) && (
                          <div className="mt-2 ml-2 pl-3 border-l-2 border-foreground/20 space-y-3">
                            {comment.replies.map((reply, replyIndex) => (
                              <div
                                key={reply.id}
                                className="flex gap-2"
                                style={{ animation: `springUp 0.3s cubic-bezier(.22,.68,0,1.2) ${replyIndex * 30}ms both` }}
                              >
                                <div className="w-7 h-7 border-2 border-foreground bg-foreground flex-shrink-0 overflow-hidden shadow-[1px_1px_0px_0px_var(--foreground)]">
                                  <img src={reply.userAvatar} alt={reply.username} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2 mb-0.5">
                                    <span className="font-black text-xs text-foreground uppercase">{reply.username}</span>
                                    <span className="text-[10px] text-foreground/40 font-bold font-mono uppercase">{reply.timestamp}</span>
                                  </div>
                                  <p className="text-xs text-foreground font-medium leading-relaxed break-words">{reply.text}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <button className={`flex items-center gap-1 px-1.5 py-0.5 border border-foreground text-[10px] font-bold uppercase transition-all ${reply.isLiked ? 'bg-red-500 text-white' : 'bg-card text-foreground hover:bg-red-100'}`}>
                                      <Heart size={9} className={reply.isLiked ? 'fill-current' : ''} strokeWidth={3} />
                                      <span>{reply.likes > 0 ? reply.likes : 'Like'}</span>
                                    </button>
                                    <button
                                      className="text-[10px] font-bold text-foreground/40 hover:text-foreground uppercase transition-colors"
                                      onClick={() => {
                                        setReplyingTo({ id: comment.id, username: reply.username });
                                        setNewComment(`@${reply.username} `);
                                        setTimeout(() => inputRef.current?.focus(), 50);
                                      }}
                                    >Reply</button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-foreground/30 hover:text-red-600 transition-colors">
                      <Heart size={14} strokeWidth={3} />
                    </button>
                    {onDeleteComment && (comment.userId === currentUserId) && (
                      <button 
                        onClick={() => onDeleteComment(post.id, comment.id)}
                        className="text-foreground/30 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 bg-card border-t-4 border-foreground">
            {/* Replying-to banner */}
            {replyingTo && (
              <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-foreground/5 border-2 border-foreground/20">
                <span className="text-[11px] font-black uppercase text-foreground/60 tracking-wide">
                  Replying to <span className="text-foreground">@{replyingTo.username}</span>
                </span>
                <button
                  onClick={() => { setReplyingTo(null); setNewComment(''); }}
                  className="text-foreground/40 hover:text-foreground transition-colors ml-2"
                >
                  <X size={13} strokeWidth={3} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-2 border-foreground bg-foreground overflow-hidden shadow-[2px_2px_0px_0px_var(--foreground)]">
                  <img 
                    src={currentUserAvatar}
                    alt="You" 
                    className="w-full h-full object-cover"
                  />
              </div>
              <div className="flex-1 relative">
                {isRecording ? (
                    <div className="w-full h-[46px] flex items-center justify-between bg-red-600 border-2 border-foreground px-4 shadow-[4px_4px_0px_0px_var(--foreground)]">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-card animate-pulse border border-foreground" />
                            <span className="text-sm font-black text-white uppercase font-mono">REC {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</span>
                        </div>
                        <button 
                            onClick={stopRecording}
                            className="w-8 h-8 bg-card border-2 border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                        >
                            <StopCircle size={16} fill="currentColor" />
                        </button>
                    </div>
                ) : (
                    <div className="relative w-full flex items-center bg-card border-2 border-foreground transition-all min-h-[46px] shadow-[4px_4px_0px_0px_var(--foreground)] focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:shadow-[2px_2px_0px_0px_var(--foreground)]">
                    {newComment.startsWith('🎤 Voice Message') ? (
                       <div className="flex-1 flex items-center gap-2 pl-4 py-1">
                          <VoicePlayer text={newComment} />
                          <button 
                            onClick={() => setNewComment('')}
                            className="p-1.5 text-foreground hover:text-red-600 transition-colors ml-auto"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                    ) : newComment.startsWith('📷 [Photo]|') ? (
                       <div className="flex-1 flex items-center gap-2 pl-4 py-1">
                          <div 
                            className="relative h-8 w-8 border border-foreground overflow-hidden group cursor-pointer"
                            onClick={() => setFullScreenImage(newComment.split('|')[1])}
                          >
                              <img src={newComment.split('|')[1]} alt="Preview" className="h-full w-full object-cover" />
                          </div>
                          <span className="text-xs text-foreground font-bold uppercase">Photo attached</span>
                          <button 
                            onClick={() => setNewComment('')}
                            className="p-1.5 text-foreground hover:text-red-600 transition-colors ml-auto"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                    ) : (
                      <input
                          type="text"
                          ref={inputRef}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                          placeholder={replyingTo ? `REPLY TO @${replyingTo.username.toUpperCase()}...` : `REPLY TO ${post.username.toUpperCase()}...`}
                          className="flex-1 bg-transparent py-2.5 pl-4 pr-2 text-sm outline-none placeholder:text-foreground/40 font-bold font-mono uppercase"
                      />
                    )}
                    
                    {/* Media Actions or Send Button */}
                    <div className="flex items-center gap-1 pr-2">
                        {newComment.trim() ? (
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSend();
                              }}
                              disabled={isSubmitting}
                              className="w-8 h-8 bg-foreground text-background border border-foreground flex items-center justify-center hover:bg-background hover:text-foreground transition-colors disabled:opacity-50"
                            >
                              <Send size={14} className="ml-0.5" strokeWidth={3} />
                            </button>
                        ) : (
                        <>
                            <button 
                            onClick={startRecording}
                            className="p-1.5 text-foreground hover:bg-foreground hover:text-background transition-colors"
                            title="Record Voice"
                            >
                            <Mic size={18} strokeWidth={2.5} />
                            </button>
                            <button 
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                        const imageUrl = URL.createObjectURL(file);
                                        setNewComment(`📷 [Photo]|${imageUrl}`);
                                    }
                                };
                                input.click();
                            }}
                            className="p-1.5 text-foreground hover:bg-foreground hover:text-background transition-colors"
                            title="Upload Photo"
                            >
                            <ImageIcon size={18} strokeWidth={2.5} />
                            </button>
                        </>
                        )}
                    </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {fullScreenImage && (
            <div 
                className="absolute inset-0 z-[130] bg-black flex items-center justify-center p-4"
                onClick={() => setFullScreenImage(null)}
            >
                <img src={fullScreenImage} alt="Full screen" className="max-w-full max-h-full object-contain border-4 border-white shadow-[0_0_50px_rgba(0,0,0,0.5)]" />
                <button className="absolute top-4 right-4 w-12 h-12 bg-card border-4 border-foreground flex items-center justify-center hover:bg-foreground transition-colors">
                    <X size={24} strokeWidth={3} />
                </button>
            </div>
        )}
      </div>
    </AnimatePresence>
  );
}