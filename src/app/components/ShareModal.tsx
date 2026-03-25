import { useState, useEffect } from "react";
import { X, Search, Send, Check, Users, Loader2 } from "lucide-react";
import { User, Post, Message } from "../types";
import { projectId, publicAnonKey } from "../supabaseClient";

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d`;

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postUrl: string;
  post?: Post;
  currentUserId?: string;
  currentUsername?: string;
  currentUserAvatar?: string;
}

export function ShareModal({ isOpen, onClose, postUrl, post, currentUserId, currentUsername, currentUserAvatar }: ShareModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch friends (following list) when modal opens
  useEffect(() => {
    if (!isOpen || !currentUserId) return;
    
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
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  const filteredFriends = friends.filter(friend => 
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSendToSelected = async () => {
    if (selectedUsers.size === 0) return;
    
    setIsSending(true);
    
    // Send to each selected friend via backend
    for (const userId of selectedUsers) {
      const friend = friends.find(f => f.id === userId);
      if (!friend) continue;

      // Deterministic conversation ID
      const convId = `conv-${[currentUserId || 'unknown', friend.id].sort().join('-')}`;

      // Create message
      const newMessage: Message = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        senderId: currentUserId || 'unknown',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        text: post ? '' : `Check this out: ${postUrl}`,
        sharedPost: post ? {
          id: post.id,
          imageUrl: post.imageUrls?.[0] || post.imageUrl || '',
          caption: post.caption,
          username: post.username,
          userAvatar: post.userAvatar
        } : undefined
      };

      const lastMsg = post ? 'Shared a post' : `Check this out: ${postUrl}`;
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
    }
    
    setIsSending(false);
    setSelectedUsers(new Set());
    onClose();
  };

  return (
    <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md border-4 border-foreground shadow-[8px_8px_0px_0px_var(--foreground)] flex flex-col h-[70%]"
        style={{ animation: 'bounceIn 0.4s cubic-bezier(.22,.68,0,1.2) both' }}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b-4 border-foreground bg-background flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send size={20} strokeWidth={3} className="text-foreground" />
            <h3 className="font-black text-lg text-foreground uppercase italic tracking-tight">Share Post</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-foreground text-background flex items-center justify-center border-2 border-foreground hover:bg-card hover:text-foreground transition-colors shadow-[2px_2px_0px_0px_var(--card)]"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b-4 border-foreground bg-foreground/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground" size={16} strokeWidth={3} />
            <input
              type="text"
              placeholder="SEARCH FRIENDS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border-2 border-foreground text-foreground font-bold font-mono text-sm outline-none placeholder:text-foreground/40 focus:shadow-[4px_4px_0px_0px_var(--foreground)] transition-all uppercase"
            />
          </div>
        </div>

        {/* Selection Count */}
        {selectedUsers.size > 0 && (
          <div className="px-4 py-2 bg-background border-b-2 border-foreground">
            <p className="text-xs font-black text-foreground uppercase">
              {selectedUsers.size} friend{selectedUsers.size !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-2 bg-card">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="animate-spin text-foreground mb-2" size={32} strokeWidth={3} />
              <p className="text-sm font-black text-foreground/50 uppercase">Loading Friends...</p>
            </div>
          ) : filteredFriends.length > 0 ? (
            filteredFriends.map(friend => {
              const isSelected = selectedUsers.has(friend.id);
              return (
                <button
                  key={friend.id}
                  onClick={() => toggleUserSelection(friend.id)}
                  className={`w-full flex items-center justify-between p-3 mb-2 border-2 border-foreground transition-all ${
                    isSelected 
                      ? 'bg-background shadow-[4px_4px_0px_0px_var(--foreground)]' 
                      : 'bg-card hover:bg-foreground/5 shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 border-2 border-foreground bg-foreground overflow-hidden shadow-[2px_2px_0px_0px_var(--foreground)]">
                      <img 
                        src={friend.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'} 
                        alt={friend.username} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-black text-sm text-foreground uppercase truncate max-w-[150px]">
                        {friend.name || friend.username}
                      </span>
                      <span className="text-xs font-mono font-bold text-foreground/50 truncate max-w-[150px]">
                        @{friend.username}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`w-6 h-6 border-2 border-foreground flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-foreground' : 'bg-card'
                  }`}>
                    {isSelected && <Check size={14} strokeWidth={4} className="text-background" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-foreground/50 font-mono font-bold">
              <Users size={48} strokeWidth={2} className="mb-2" />
              <p className="text-sm uppercase">
                {searchQuery ? 'No friends found' : 'No friends yet'}
              </p>
              <p className="text-xs mt-1">
                {searchQuery ? 'Try a different search' : 'Follow people to see them here'}
              </p>
            </div>
          )}
        </div>

        {/* Footer - Send Button */}
        <div className="p-4 border-t-4 border-foreground bg-card">
          <button
            onClick={handleSendToSelected}
            disabled={selectedUsers.size === 0 || isSending}
            className={`w-full py-3 font-black uppercase text-sm border-2 border-foreground transition-all ${
              selectedUsers.size === 0 || isSending
                ? 'bg-foreground/10 text-foreground/30 cursor-not-allowed'
                : 'bg-foreground text-background shadow-[4px_4px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] active:scale-[0.98]'
            }`}
          >
            {isSending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" strokeWidth={3} />
                Sending...
              </span>
            ) : (
              `Send to ${selectedUsers.size || ''} ${selectedUsers.size === 1 ? 'Friend' : 'Friends'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}