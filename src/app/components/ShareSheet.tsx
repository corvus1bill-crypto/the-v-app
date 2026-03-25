import { useState, useEffect } from 'react';
import { X, Search, Send, Check, Copy, Share2, Users, Loader2, Repeat2 } from 'lucide-react';
import { toast } from 'sonner';
import { Post, Message } from '../types';
import { projectId, publicAnonKey } from '../supabaseClient';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d`;

interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
}

interface ShareSheetProps {
  post?: Post;
  onClose: () => void;
  onNavigateToMessages?: () => void;
  currentUserId?: string;
  currentUsername?: string;
  currentUserAvatar?: string;
  onRepost?: (post: Post) => void;
}

export function ShareSheet({ post, onClose, onNavigateToMessages, currentUserId, currentUsername, currentUserAvatar, onRepost }: ShareSheetProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [reposted, setReposted] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Fetch friends (following list) when component mounts
  useEffect(() => {
    if (!currentUserId) return;
    
    const fetchFriends = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${SERVER_URL}/users/${currentUserId}/following`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Loaded friends list:', data);
          setFriends(data || []);
        } else {
          console.error('❌ Failed to load friends');
          setFriends([]);
        }
      } catch (error) {
        console.error('❌ Error fetching friends:', error);
        setFriends([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, [currentUserId]);

  const filteredUsers = friends.filter(friend => 
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(u => u !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0) return;
    
    setIsSending(true);
    const sentNames: string[] = [];

    for (const userId of selectedUsers) {
      const friend = friends.find(f => f.id === userId);
      if (!friend) continue;

      // Deterministic conversation ID (sorted so both users get the same one)
      const convId = `conv-${[currentUserId || 'unknown', friend.id].sort().join('-')}`;

      // Create the message
      const newMessage: Message = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        senderId: currentUserId || 'unknown',
        text: message || undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        sharedPost: post ? {
          id: post.id,
          imageUrl: post.imageUrl || (post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls[0] : ''),
          caption: post.caption,
          username: post.username,
          userAvatar: post.userAvatar
        } : undefined
      };

      // Build conversation entries for both users
      const lastMsg = message || (post ? 'Shared a post' : 'Sent a message');
      const senderConv = {
        id: convId,
        userId: friend.id,
        username: friend.username,
        userAvatar: friend.avatar,
        lastMessage: lastMsg,
        timestamp: 'Just now',
        unreadCount: 0
      };
      const receiverConv = {
        id: convId,
        userId: currentUserId || 'unknown',
        username: currentUsername || '',
        userAvatar: currentUserAvatar || '',
        lastMessage: lastMsg,
        timestamp: 'Just now',
        unreadCount: 1
      };

      try {
        await fetch(`${SERVER_URL}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            conversationId: convId,
            message: newMessage,
            senderConv,
            receiverConv,
            receiverId: friend.id
          })
        });
      } catch (err) {
        console.error('Failed to persist shared message:', err);
      }

      sentNames.push(friend.name || friend.username);
    }

    setIsSending(false);
    
    if (sentNames.length > 0) {
      toast.success(`Sent to ${sentNames.length > 2 ? `${sentNames.length} people` : sentNames.join(', ')}!`);
    } else {
      toast.success('Sent!');
    }
    
    onClose();
  };

  const postUrl = post ? `https://vibe.app/post/${post.id}` : '';

  // Fallback copy method for when Clipboard API is blocked
  const fallbackCopyToClipboard = (text: string) => {
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
      return successful;
    } catch (err) {
      console.error('Fallback copy failed', err);
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handleCopyLink = async () => {
    const success = fallbackCopyToClipboard(postUrl);
    
    if (success) {
      toast.success('Link copied to clipboard');
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleRepost = () => {
    if (!post || !onRepost) return;
    setReposted(true);
    onRepost(post);
    toast.success('Reposted to your feed!');
    setTimeout(onClose, 600);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full bg-card overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 rounded-t-2xl border-t-4 border-x-4 border-foreground"
        style={{ height: '90%' }}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b-4 border-foreground bg-background flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send size={20} strokeWidth={3} className="text-foreground" />
            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Share Post</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center border-2 border-foreground bg-foreground text-background hover:bg-card hover:text-foreground transition-colors shadow-[2px_2px_0px_0px_var(--card)]"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b-2 border-foreground bg-background">
          {/* Repost to feed button */}
          {onRepost && post && post.userId !== currentUserId && (
            <button
              onClick={handleRepost}
              disabled={reposted}
              className={`w-full flex items-center gap-3 p-3 border-2 border-foreground mb-3 transition-all ${
                reposted
                  ? 'bg-foreground text-background cursor-not-allowed'
                  : 'bg-background text-foreground shadow-[3px_3px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]'
              }`}
            >
              <Repeat2 size={18} strokeWidth={2.5} />
              <span className="font-black text-sm uppercase">{reposted ? '✓ Reposted!' : 'Repost to Your Feed'}</span>
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground" size={18} strokeWidth={3} />
            <input
              type="text"
              placeholder="SEARCH FRIENDS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border-2 border-foreground pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-background text-foreground placeholder:text-foreground/50 uppercase transition-colors shadow-[2px_2px_0px_0px_var(--foreground)]"
            />
          </div>
        </div>

        {/* Selection Count */}
        {selectedUsers.length > 0 && (
          <div className="px-4 py-2 bg-background border-b-2 border-foreground">
            <p className="text-xs font-black text-foreground uppercase">
              {selectedUsers.length} friend{selectedUsers.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-background custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="animate-spin text-foreground mb-2" size={32} strokeWidth={3} />
              <p className="text-sm font-black text-foreground/50 uppercase">Loading Friends...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(friend => {
              const isSelected = selectedUsers.includes(friend.id);
              return (
                <button
                  key={friend.id}
                  onClick={() => toggleUser(friend.id)}
                  className={`w-full flex items-center justify-between p-3 border-2 border-foreground transition-all ${
                    isSelected 
                      ? 'bg-background shadow-[4px_4px_0px_0px_var(--foreground)]' 
                      : 'bg-background hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border-2 border-foreground overflow-hidden bg-foreground">
                      <img 
                        src={friend.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'} 
                        alt={friend.username} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-sm text-foreground uppercase truncate max-w-[180px]">
                        {friend.name || friend.username}
                      </p>
                      <p className="text-xs text-foreground/60 font-bold font-mono truncate max-w-[180px]">
                        @{friend.username}
                      </p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 border-2 border-foreground flex items-center justify-center transition-all ${
                    isSelected ? 'bg-foreground' : 'bg-background'
                  }`}>
                    {isSelected && <Check size={14} className="text-background" strokeWidth={4} />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-foreground/50">
              <Users size={48} strokeWidth={2} className="mb-2" />
              <p className="text-sm font-bold uppercase">
                {searchQuery ? 'No friends found' : 'No friends yet'}
              </p>
              <p className="text-xs mt-1 font-mono">
                {searchQuery ? 'Try a different search' : 'Follow people to see them here'}
              </p>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t-2 border-foreground bg-background">
          <input
            type="text"
            placeholder="ADD A MESSAGE (OPTIONAL)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-background border-2 border-foreground py-3 px-3 text-sm font-bold focus:outline-none focus:border-background text-foreground placeholder:text-foreground/50 uppercase transition-colors shadow-[2px_2px_0px_0px_var(--foreground)] mb-3"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={selectedUsers.length === 0 || isSending}
            className={`w-full py-4 font-black uppercase text-sm border-2 border-foreground transition-all flex items-center justify-center gap-2 ${
              selectedUsers.length === 0 || isSending
                ? 'bg-foreground/10 text-foreground/30 cursor-not-allowed'
                : 'bg-foreground hover:bg-background text-background hover:text-foreground shadow-[4px_4px_0px_0px_var(--foreground)] hover:shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px]'
            }`}
          >
            {isSending ? (
              <>
                <Loader2 size={18} className="animate-spin" strokeWidth={3} />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} strokeWidth={3} />
                {selectedUsers.length > 0 
                  ? `Send to ${selectedUsers.length}`
                  : 'Select Friends'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}