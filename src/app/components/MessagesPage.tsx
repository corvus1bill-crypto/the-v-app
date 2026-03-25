import { useState, useEffect, useRef } from "react";
import { Search, ArrowLeft, Image, Mic, Send, Play, X, Loader2, Trash2, Users, Plus, Check } from "lucide-react";
import { Conversation, Message } from "../types";
// Layout: sent messages RIGHT, received messages LEFT (standard messaging convention)
import { formatDistanceToNow } from "date-fns";
import { io, type Socket } from "socket.io-client";
import { supabase, projectId, publicAnonKey } from "../supabaseClient";
import { isRestApi, restApiBase } from "../config/restApi";
import * as backendApi from "../services/backendApi";
import { useAuthStore } from "../store/authStore";

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d`;

function pendingConvId(id: string) {
  return id.startsWith("conv-");
}

function restRowToMessage(row: backendApi.RestMessageRow): Message {
  let ts = "";
  try {
    ts = new Date(row.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    ts = "";
  }
  return {
    id: row.id,
    senderId: row.sender_id,
    text: row.content || undefined,
    imageUrl: row.media_url || undefined,
    timestamp: ts,
    read: row.seen,
  };
}

export function MessagesPage({ 
  initialChatUser, 
  onBack, 
  onViewProfile,
  onViewPost,
  currentUserProfile,
  cachedConversations = []
}: { 
  initialChatUser?: { userId: string; username: string; userAvatar: string } | null; 
  onBack?: () => void; 
  onViewProfile?: (user: { userId: string; username: string; userAvatar: string }) => void;
  onViewPost?: (postId: string) => void;
  currentUserProfile: { userId: string; username: string; userAvatar: string };
  cachedConversations?: any[];
}) {
  const [conversationsList, setConversationsList] = useState<Conversation[]>(
    cachedConversations.length > 0 ? cachedConversations : []
  );
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [messageToUnsend, setMessageToUnsend] = useState<string | null>(null);
  const [showUnsendForMessage, setShowUnsendForMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messageReactions, setMessageReactions] = useState<Record<string, string>>({});
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [deleteConversationTarget, setDeleteConversationTarget] = useState<Conversation | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  // Group chat state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMemberSearch, setGroupMemberSearch] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<Set<string>>(new Set());
  const [availableContacts, setAvailableContacts] = useState<Array<{userId: string; username: string; avatar: string}>>([]);
  const lastMsgTapRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });
  const MSG_REACTIONS = ['❤️', '🔥', '😂', '😮', '👍', '👎'];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const convLongPressTimer = useRef<NodeJS.Timeout | null>(null);
  const convLongPressTriggered = useRef(false);
  const restMsgSocketRef = useRef<Socket | null>(null);
  const typingEmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Typing indicator + read receipts
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [readReceipts, setReadReceipts] = useState<Record<string, boolean>>({});
  // Track which sent messages are "Displayed" (visible on recipient's screen)
  const [displayedMessages, setDisplayedMessages] = useState<Set<string>>(new Set());
  
  // Listen for typing indicators from the other user (Supabase broadcast)
  useEffect(() => {
    if (!selectedConversation || isRestApi()) return;
    const channel = supabase.channel(`typing-listen:${selectedConversation.id}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== currentUserProfile.userId) {
          setIsOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 2500);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); setIsOtherTyping(false); };
  }, [selectedConversation?.id]);

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (!selectedConversation || messages.length === 0) return;
    const unreadFromOther = messages.filter(m => m.senderId !== currentUserProfile.userId);
    if (unreadFromOther.length > 0) {
      const newReceipts: Record<string, boolean> = {};
      unreadFromOther.forEach(m => { newReceipts[m.id] = true; });
      setReadReceipts(prev => ({ ...prev, ...newReceipts }));
    }
  }, [messages, selectedConversation]);

  // "Displayed" status: 3s after a message gets a read receipt → shown on screen
  useEffect(() => {
    const newlySeenIds = Object.entries(readReceipts)
      .filter(([, seen]) => seen)
      .map(([id]) => id)
      .filter(id => !displayedMessages.has(id));

    if (newlySeenIds.length === 0) return;
    const timer = setTimeout(() => {
      setDisplayedMessages(prev => {
        const next = new Set(prev);
        newlySeenIds.forEach(id => next.add(id));
        return next;
      });
    }, 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readReceipts]);

  // Realtime channels refs
  const chatChannelRef = useRef<any>(null);
  const userChannelRef = useRef<any>(null);

  const scrollToBottom = (smooth = true) => {
    const container = messagesScrollRef.current;
    if (!container) return;
    if (smooth) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  };

  const scrollToMessage = (messageId: string) => {
    const container = messagesScrollRef.current;
    const element = document.getElementById(`message-${messageId}`);
    if (element && container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const offset = elementRect.top - containerRect.top + container.scrollTop - container.clientHeight / 2;
      container.scrollTo({ top: offset, behavior: 'smooth' });
      element.classList.add('ring-4', 'ring-background', 'transition-all', 'duration-500');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-background');
      }, 1500);
    }
  };

  // 1. Fetch Conversations on Mount
  useEffect(() => {
    fetchConversations();

    if (isRestApi()) {
      const id = setInterval(() => fetchConversations(), 25000);
      return () => clearInterval(id);
    }

    const channel = supabase.channel(`user-updates:${currentUserProfile.userId}`)
      .on('broadcast', { event: 'update_conversation' }, () => {
        fetchConversations();
      })
      .subscribe();
      
    userChannelRef.current = channel;

    return () => {
      if (userChannelRef.current) supabase.removeChannel(userChannelRef.current);
    };
  }, [currentUserProfile.userId]);

  // Update conversations list when cached data changes
  useEffect(() => {
    if (cachedConversations && cachedConversations.length > 0) {
      setConversationsList(cachedConversations);
    }
  }, [cachedConversations]);

  // Build contacts from existing conversations
  useEffect(() => {
    const contacts = conversationsList
      .filter(c => !c.isGroup)
      .map(c => ({ userId: c.userId, username: c.username, avatar: c.userAvatar }));
    setAvailableContacts(contacts);
  }, [conversationsList]);

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedGroupMembers.size < 2) return;
    const members = availableContacts.filter(c => selectedGroupMembers.has(c.userId));
    const groupConv: Conversation = {
      id: `group-${Date.now()}`,
      userId: currentUserProfile.userId,
      username: groupName.trim(),
      userAvatar: '',
      lastMessage: 'Group created',
      timestamp: 'Just now',
      unreadCount: 0,
      isGroup: true,
      groupName: groupName.trim(),
      groupMembers: [
        { userId: currentUserProfile.userId, username: currentUserProfile.username, avatar: currentUserProfile.userAvatar },
        ...members,
      ],
    };
    setConversationsList(prev => [groupConv, ...prev]);
    setShowCreateGroup(false);
    setGroupName('');
    setSelectedGroupMembers(new Set());
    setSelectedConversation(groupConv);
  };

  const fetchConversations = async () => {
    try {
      if (isRestApi()) {
        const { conversations } = await backendApi.listConversations();
        const mapped: Conversation[] = conversations.map((c) => ({
          id: c.id,
          userId: c.otherUserId || "",
          username: c.username,
          userAvatar: c.avatarUrl || "",
          lastMessage: c.lastMessage || "",
          timestamp: formatDistanceToNow(new Date(c.lastAt), { addSuffix: true }),
          unreadCount: 0,
        }));
        setConversationsList((prev) => {
          const groups = prev.filter((x) => x.isGroup);
          const restIds = new Set(mapped.map((m) => m.id));
          const keptGroups = groups.filter((g) => !restIds.has(g.id));
          return [...keptGroups, ...mapped];
        });
        return;
      }

      const response = await fetch(`${SERVER_URL}/conversations/${currentUserProfile.userId}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      if (!data || data.length === 0) {
        setConversationsList((prev) => prev);
      } else {
        setConversationsList(data);
      }
    } catch (error: any) {
      console.error('Failed to fetch conversations', error);
    }
  };

  const handleDeleteConversation = async (conv: Conversation) => {
    setIsDeletingConversation(true);
    try {
      if (!isRestApi()) {
        await fetch(`${SERVER_URL}/conversation/${currentUserProfile.userId}/${conv.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        });
      }
      setConversationsList(prev => prev.filter(c => c.id !== conv.id));
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setIsDeletingConversation(false);
      setDeleteConversationTarget(null);
    }
  };

  const startConvLongPress = (conv: Conversation) => {
    convLongPressTriggered.current = false;
    convLongPressTimer.current = setTimeout(() => {
      convLongPressTriggered.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      setDeleteConversationTarget(conv);
    }, 500);
  };

  const cancelConvLongPress = () => {
    if (convLongPressTimer.current) {
      clearTimeout(convLongPressTimer.current);
      convLongPressTimer.current = null;
    }
  };

  // 2. Handle Initial Chat User (Deep Link)
  useEffect(() => {
    if (!initialChatUser) return;

    if (isRestApi()) {
      let cancelled = false;
      (async () => {
        try {
          const { id } = await backendApi.ensureConversationWith(initialChatUser.userId);
          if (cancelled) return;
          const newConv: Conversation = {
            id,
            userId: initialChatUser.userId,
            username: initialChatUser.username,
            userAvatar: initialChatUser.userAvatar,
            lastMessage: "Start a conversation",
            timestamp: "Now",
            unreadCount: 0,
          };
          setSelectedConversation(newConv);
          setConversationsList((prev) => {
            if (prev.some((c) => c.id === id)) {
              return prev.map((c) => (c.id === id ? { ...c, ...newConv } : c));
            }
            return [newConv, ...prev.filter((c) => !(c.userId === initialChatUser.userId && !c.isGroup))];
          });
        } catch (e) {
          console.error("REST: ensure conversation failed", e);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    const existingConv = conversationsList.find(c => c.userId === initialChatUser.userId);
    if (existingConv) {
      setSelectedConversation(existingConv);
    } else {
      const newConv: Conversation = {
        id: `conv-${[currentUserProfile.userId, initialChatUser.userId].sort().join('-')}`,
        userId: initialChatUser.userId,
        username: initialChatUser.username,
        userAvatar: initialChatUser.userAvatar,
        lastMessage: 'Start a conversation',
        timestamp: 'Now',
        unreadCount: 0
      };
      setSelectedConversation(newConv);
    }
  }, [initialChatUser, conversationsList, currentUserProfile.userId]);

  // 3. Fetch Messages & Subscribe when Conversation Selected
  useEffect(() => {
    if (!selectedConversation) return;

    if (isRestApi()) {
      if (pendingConvId(selectedConversation.id) || selectedConversation.isGroup) {
        setMessages([]);
        setIsLoading(false);
        return;
      }

      const token = useAuthStore.getState().token;
      if (!token) {
        setMessages([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      fetchMessages(selectedConversation.id);

      const socket = io(restApiBase(), {
        auth: { token },
        transports: ["websocket", "polling"],
      });
      restMsgSocketRef.current = socket;
      chatChannelRef.current = { __restSocket: true, socket } as any;

      socket.emit("join_conversation", selectedConversation.id);
      socket.on("new_message", (raw: backendApi.RestMessageRow) => {
        const msg = restRowToMessage(raw);
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      });
      socket.on("typing", (p: { userId?: string; conversationId?: string }) => {
        if (p.conversationId !== selectedConversation.id) return;
        if (p.userId === currentUserProfile.userId) return;
        setIsOtherTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 2500);
      });

      return () => {
        socket.emit("leave_conversation", selectedConversation.id);
        socket.disconnect();
        restMsgSocketRef.current = null;
        chatChannelRef.current = null;
      };
    }

    setIsLoading(true);
    fetchMessages(selectedConversation.id);

    const channel = supabase.channel(`chat:${selectedConversation.id}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const msg = payload.payload as Message;
        setMessages(prev => {
           if (prev.some(m => m.id === msg.id)) return prev;
           return [...prev, msg];
        });
        scrollToBottom();
      })
      .on('broadcast', { event: 'unsend_message' }, (payload) => {
        const { messageId } = payload.payload as { messageId: string };
        setMessages(prev => prev.filter(m => m.id !== messageId));
      })
      .subscribe();
      
    chatChannelRef.current = channel;

    return () => {
      if (chatChannelRef.current) supabase.removeChannel(chatChannelRef.current);
    };
  }, [selectedConversation]);

  const fetchMessages = async (conversationId: string) => {
    try {
      if (isRestApi()) {
        const { messages: rows } = await backendApi.getConversationMessages(conversationId);
        setMessages(rows.map(restRowToMessage));
        return;
      }

      const response = await fetch(`${SERVER_URL}/messages/${conversationId}`, {
         headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      if (!data || data.length === 0) {
        setMessages([]);
      } else {
        setMessages(data);
      }
    } catch (error: any) {
      console.error('Failed to fetch messages', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
      scrollToBottom(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, replyingTo]);

  // Helper: notify all members of a conversation to refresh their list
  const notifyConversationMembers = (conv: Conversation | null) => {
    if (!conv) return;
    const membersToNotify: string[] = conv.isGroup && conv.groupMembers
      ? conv.groupMembers
          .map((m) => m.userId)
          .filter((uid) => uid !== currentUserProfile.userId)
      : [conv.userId];
    for (const memberId of membersToNotify) {
      const ch = supabase.channel(`user-updates:${memberId}-${Date.now()}`);
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          ch.send({ type: 'broadcast', event: 'update_conversation', payload: { conversationId: conv.id } });
          setTimeout(() => supabase.removeChannel(ch), 1200);
        }
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    const text = newMessage.trim();
    const replySnap = replyingTo;

    if (isRestApi()) {
      if (selectedConversation.isGroup) return;
      let convId = selectedConversation.id;
      let tempId = "";
      const replyToBlock = replySnap
        ? {
            id: replySnap.id,
            username:
              replySnap.senderId === currentUserProfile.userId ? "You" : selectedConversation.username,
            text: replySnap.text,
            imageUrl: replySnap.imageUrl,
            mediaType: replySnap.imageUrl
              ? ("image" as const)
              : replySnap.voiceUrl
                ? ("voice" as const)
                : replySnap.sharedPost
                  ? ("post" as const)
                  : ("text" as const),
          }
        : undefined;
      try {
        if (pendingConvId(convId)) {
          const { id } = await backendApi.ensureConversationWith(selectedConversation.userId);
          convId = id;
          setSelectedConversation((prev) => (prev ? { ...prev, id: convId } : prev));
        }
        tempId = `temp-${Date.now()}`;
        const optimistic: Message = {
          id: tempId,
          senderId: currentUserProfile.userId,
          text,
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          read: false,
          replyTo: replyToBlock,
        };
        setMessages((prev) => [...prev, optimistic]);
        setNewMessage("");
        setReplyingTo(null);
        const sent = await backendApi.sendConversationMessage(convId, text);
        const finalMsg = restRowToMessage(sent);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...finalMsg, replyTo: replyToBlock } : m))
        );
        setConversationsList((prev) => {
          const row: Conversation = {
            id: convId,
            userId: selectedConversation.userId,
            username: selectedConversation.username,
            userAvatar: selectedConversation.userAvatar,
            lastMessage: text,
            timestamp: "Just now",
            unreadCount: 0,
          };
          const exists = prev.some((c) => c.id === convId);
          if (exists) return prev.map((c) => (c.id === convId ? { ...c, ...row } : c));
          return [row, ...prev];
        });
        void fetchConversations();
      } catch (error) {
        console.error("REST send failed", error);
        if (tempId) setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setNewMessage(text);
        if (replySnap) setReplyingTo(replySnap);
      }
      return;
    }

    {
      const message: Message = {
        id: Date.now().toString(),
        senderId: currentUserProfile.userId,
        text,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        replyTo: replySnap ? {
          id: replySnap.id,
          username: replySnap.senderId === currentUserProfile.userId ? 'You' : selectedConversation.username,
          text: replySnap.text,
          imageUrl: replySnap.imageUrl,
          mediaType: replySnap.imageUrl ? 'image' : replySnap.voiceUrl ? 'voice' : replySnap.sharedPost ? 'post' : 'text'
        } : undefined
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setReplyingTo(null);
      
      if (chatChannelRef.current && !(chatChannelRef.current as any).__restSocket) {
        chatChannelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: message
        });
      }

      notifyConversationMembers(selectedConversation);

      try {
        // Build sender's conversation entry so it's persisted to the server and survives refreshes
        const senderConv = {
          id: selectedConversation.id,
          userId: selectedConversation.userId,
          username: selectedConversation.username,
          userAvatar: selectedConversation.userAvatar,
          lastMessage: message.text || (message.imageUrl ? 'Sent a photo' : 'Sent a message'),
          timestamp: 'Just now',
          unreadCount: 0
        };

        const receiverConv = {
          id: selectedConversation.id,
          userId: currentUserProfile.userId,
          username: currentUserProfile.username,
          userAvatar: currentUserProfile.userAvatar,
          lastMessage: message.text || (message.imageUrl ? 'Sent a photo' : 'Sent a message'),
          timestamp: 'Just now',
          unreadCount: 1 
        };

        // Optimistically update the sender's local conversations list so search works immediately
        setConversationsList(prev => {
          const exists = prev.some(c => c.id === selectedConversation.id);
          if (exists) {
            return prev.map(c =>
              c.id === selectedConversation.id
                ? { ...c, lastMessage: senderConv.lastMessage, timestamp: 'Just now' }
                : c
            );
          } else {
            return [senderConv, ...prev];
          }
        });

        await fetch(`${SERVER_URL}/message`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            conversationId: selectedConversation.id,
            message,
            senderConv, // Now saved so conversations persist across refreshes
            receiverConv,
            receiverId: selectedConversation.userId
          })
        });
        
      } catch (error) {
        console.error('Failed to persist message', error);
      }
    }
  };

  const handleTouchStart = (message: Message) => {
    longPressTimer.current = setTimeout(() => {
      // If it's the current user's message, show unsend option
      if (message.senderId === currentUserProfile.userId) {
        setShowUnsendForMessage(message.id);
      } else {
        // If it's someone else's message, show reply option
        setReplyingTo(message);
      }
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleUnsendMessage = async (messageId: string) => {
    if (!selectedConversation) return;
    
    // Optimistically remove from UI
    const updatedMessages = messages.filter(m => m.id !== messageId);
    setMessages(updatedMessages);
    setMessageToUnsend(null);
    
    // Vibration feedback
    if (navigator.vibrate) navigator.vibrate(50);
    
    if (chatChannelRef.current && !(chatChannelRef.current as any).__restSocket) {
      chatChannelRef.current.send({
        type: 'broadcast',
        event: 'unsend_message',
        payload: { messageId }
      });
    }
    
    // Calculate new last message for CURRENT user (messages received by them)
    const receivedByCurrentUser = updatedMessages.filter(m => m.senderId !== currentUserProfile.userId);
    const currentUserLastMessage = receivedByCurrentUser.length > 0 
      ? receivedByCurrentUser[receivedByCurrentUser.length - 1].text || 'Photo'
      : 'No messages';
    
    // Calculate new last message for OTHER user (messages received by them)
    const receivedByOtherUser = updatedMessages.filter(m => m.senderId === currentUserProfile.userId);
    const otherUserLastMessage = receivedByOtherUser.length > 0 
      ? receivedByOtherUser[receivedByOtherUser.length - 1].text || 'Photo'
      : 'No messages';
    
    // Update conversation preview for current user
    const updatedConversationForCurrentUser = {
      ...selectedConversation,
      lastMessage: currentUserLastMessage,
      timestamp: receivedByCurrentUser.length > 0 
        ? receivedByCurrentUser[receivedByCurrentUser.length - 1].timestamp 
        : selectedConversation.timestamp
    };
    
    // Update conversation preview for other user
    const updatedConversationForOtherUser = {
      id: selectedConversation.id,
      userId: currentUserProfile.userId,
      username: currentUserProfile.username,
      userAvatar: currentUserProfile.userAvatar,
      lastMessage: otherUserLastMessage,
      timestamp: receivedByOtherUser.length > 0 
        ? receivedByOtherUser[receivedByOtherUser.length - 1].timestamp 
        : selectedConversation.timestamp,
      unreadCount: 0
    };
    
    // Update local state
    setConversationsList(prev => 
      prev.map(c => c.id === selectedConversation.id ? updatedConversationForCurrentUser : c)
    );
    
    try {
      if (!isRestApi()) {
      await fetch(`${SERVER_URL}/message/${selectedConversation.id}/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      
      await Promise.all([
        fetch(`${SERVER_URL}/conversation`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            userId: currentUserProfile.userId,
            conversationId: selectedConversation.id,
            conversation: updatedConversationForCurrentUser
          })
        }),
        fetch(`${SERVER_URL}/conversation`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            userId: selectedConversation.userId,
            conversationId: selectedConversation.id,
            conversation: updatedConversationForOtherUser
          })
        })
      ]);
      
      notifyConversationMembers(selectedConversation);
      }
      
    } catch (error) {
      console.error('Failed to unsend message', error);
    }
  };

  if (selectedConversation) {
    return (
      <div className="flex flex-col bg-background overflow-hidden" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {/* Chat Header */}
        <div className="shrink-0 z-40 bg-background border-b-4 border-primary px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="w-10 h-10 bg-card border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all active:scale-95"
            >
              <ArrowLeft className="text-foreground" size={20} strokeWidth={3} />
            </button>
            {selectedConversation.isGroup ? (
              <div className="w-10 h-10 bg-foreground border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Users size={20} className="text-background" strokeWidth={2.5} />
              </div>
            ) : (
              <button
                onClick={() => onViewProfile?.({ userId: selectedConversation.userId, username: selectedConversation.username, userAvatar: selectedConversation.userAvatar })}
                className="relative group"
              >
                <div className="w-10 h-10 bg-primary border-2 border-primary overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:translate-y-[1px] group-hover:translate-x-[1px] group-hover:shadow-none transition-all">
                  <img
                    src={selectedConversation.userAvatar}
                    alt={selectedConversation.username}
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-black text-lg text-foreground uppercase leading-none truncate">
                {selectedConversation.isGroup ? (selectedConversation.groupName || selectedConversation.username) : selectedConversation.username}
              </p>
              {selectedConversation.isGroup ? (
                <p className="text-xs font-mono font-bold text-foreground/60 bg-foreground/10 inline-block px-1 mt-1">
                  {selectedConversation.groupMembers?.length ?? 2} MEMBERS
                </p>
              ) : isOtherTyping ? (
                <p className="text-xs font-mono font-bold text-foreground/80 inline-block px-1 mt-1" style={{ animation: 'typingPulse 1.5s ease-in-out infinite' }}>TYPING...</p>
              ) : (
                <p className="text-xs font-mono font-bold text-foreground/60 bg-foreground/10 inline-block px-1 mt-1">ONLINE</p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesScrollRef} className="flex-1 overflow-y-auto px-4 py-4 bg-background flex flex-col" style={{ overscrollBehavior: 'none' }}>
          <div className="mt-auto" />
          <div className="flex flex-col space-y-4">
          {isLoading && messages.length === 0 ? (
             <div className="flex justify-center py-10">
               <Loader2 className="animate-spin text-foreground" size={32} />
             </div>
          ) : (
             messages.map((message, msgIdx) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === currentUserProfile.userId ? 'justify-end' : 'justify-start'}`}
              style={{
                animation: `${message.senderId === currentUserProfile.userId ? 'slideInRight' : 'slideInLeft'} 0.28s cubic-bezier(.22,.68,0,1.2) ${Math.min(msgIdx, 10) * 25}ms both`,
              }}
            >
              <div 
                id={`message-${message.id}`}
                className={`max-w-[75%] cursor-pointer active:scale-95 transition-transform relative ${message.senderId === currentUserProfile.userId ? 'ml-auto' : 'mr-auto'}`}
                onTouchStart={() => handleTouchStart(message)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={() => handleTouchStart(message)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setReplyingTo(message);
                }}
                onDoubleClick={() => setReactionPickerFor(reactionPickerFor === message.id ? null : message.id)}
              >
                {/* Group chat: show sender name above incoming messages */}
                {selectedConversation.isGroup && message.senderId !== currentUserProfile.userId && (
                  <p className="text-[10px] font-black uppercase text-foreground/50 mb-0.5 ml-1">
                    {selectedConversation.groupMembers?.find(m => m.userId === message.senderId)?.username || 'Member'}
                  </p>
                )}
                {/* Reaction picker popup */}
                {reactionPickerFor === message.id && (
                  <div
                    className={`absolute bottom-full mb-1 z-30 flex gap-1 bg-background border-2 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] px-2 py-1.5 ${message.senderId === currentUserProfile.userId ? 'right-0' : 'left-0'}`}
                    style={{ animation: 'scaleIn 0.15s cubic-bezier(.22,.68,0,1.3) both' }}
                  >
                    {MSG_REACTIONS.map(emoji => (
                      <button
                        key={emoji}
                        className={`text-xl transition-all hover:scale-125 ${messageReactions[message.id] === emoji ? 'scale-125' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMessageReactions(prev => ({
                            ...prev,
                            [message.id]: prev[message.id] === emoji ? '' : emoji
                          }));
                          setReactionPickerFor(null);
                          if (navigator.vibrate) navigator.vibrate(30);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                {/* Existing reaction display */}
                {messageReactions[message.id] && (
                  <div
                    className={`flex ${message.senderId === currentUserProfile.userId ? 'justify-end' : 'justify-start'} mt-0.5`}
                  >
                    <button
                      onClick={() => setMessageReactions(prev => ({ ...prev, [message.id]: '' }))}
                      className="text-base bg-background border-2 border-foreground px-1.5 py-0.5 shadow-[1px_1px_0px_0px_var(--foreground)] hover:scale-110 transition-transform"
                    >
                      {messageReactions[message.id]}
                    </button>
                  </div>
                )}
                {/* Reply Context */}
                {message.replyTo && (
                    <div className={`mb-1 text-xs font-bold font-mono flex flex-col ${message.senderId === currentUserProfile.userId ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1 text-foreground/60 uppercase">
                            <span>Replying to</span>
                            <span className="text-foreground">{message.replyTo.username}</span>
                        </div>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToMessage(message.replyTo!.id);
                          }}
                          className={`mt-1 px-2 py-1 bg-black/5 border-l-4 ${message.senderId === currentUserProfile.userId ? 'border-primary' : 'border-background'} max-w-full truncate cursor-pointer hover:bg-black/10 transition-colors`}
                        >
                            {message.replyTo.mediaType === 'image' && <span className="italic">📷 Photo</span>}
                            {message.replyTo.mediaType === 'voice' && <span className="italic">🎤 Voice Message</span>}
                            {message.replyTo.mediaType === 'post' && <span className="italic">🔗 Shared Post</span>}
                            {message.replyTo.mediaType === 'text' && <span>{message.replyTo.text}</span>}
                        </div>
                    </div>
                )}

                {/* Shared Post */}
                {message.sharedPost && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      if (onViewPost) onViewPost(message.sharedPost!.id);
                    }}
                    className={`block w-64 border-4 border-foreground bg-background shadow-[4px_4px_0px_0px_var(--foreground)] hover:shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-left group/post mb-2 ${message.senderId === currentUserProfile.userId ? 'ml-auto' : ''}`}
                  >
                    <div className="relative aspect-[4/5] bg-black">
                        {message.sharedPost.imageUrl && (
                          <img 
                              src={message.sharedPost.imageUrl} 
                              alt="Post" 
                              className="w-full h-full object-cover transition-all duration-300"
                          />
                        )}
                        <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 bg-black border border-white shadow-[2px_2px_0px_0px_white]">
                            <span className="text-xs font-black text-white uppercase truncate max-w-[100px]">{message.sharedPost.username}</span>
                        </div>
                    </div>
                    <div className="p-2 bg-background border-t-4 border-foreground">
                        <p className="text-xs text-foreground font-bold line-clamp-2">{message.sharedPost.caption}</p>
                    </div>
                  </button>
                )}

                {/* Text Message */}
                {message.text && (
                  <div
                    className={`transition-all border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] ${
                      message.text?.match(/https:\/\/vibe\.app\/p\//)
                        ? 'p-0 bg-transparent w-full max-w-[280px] border-0 shadow-none'
                        : `px-4 py-3 ${
                            message.senderId === currentUserProfile.userId
                              ? 'bg-foreground text-background rounded-tl-xl rounded-tr-xl rounded-bl-xl'
                              : 'bg-background text-foreground rounded-tr-xl rounded-tl-xl rounded-br-xl'
                          }`
                    }`}
                  >
                    {(() => {
                      const profileMatch = message.text?.match(/https:\/\/vibe\.app\/p\/([^?&\s]+)(?:[?&]u=([^&\s]+))?/);
                      
                      if (profileMatch) {
                        const sharedUserId = profileMatch[1];
                        const sharedUsername = profileMatch[2] || 'User';
                        const messageContent = message.text?.replace(profileMatch[0], '').trim();
                        
                        return (
                          <div className={`flex flex-col gap-2 ${message.senderId === currentUserProfile.userId ? 'items-end' : 'items-start'}`}>
                            {messageContent && (
                              <div className={`px-4 py-3 border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] ${
                                message.senderId === currentUserProfile.userId 
                                  ? 'bg-foreground text-background rounded-tl-xl rounded-tr-xl rounded-bl-xl' 
                                  : 'bg-background text-foreground rounded-tr-xl rounded-tl-xl rounded-br-xl'
                              }`}>
                                <p className="text-sm font-bold font-mono">{messageContent}</p>
                              </div>
                            )}
                            
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onViewProfile) {
                                  onViewProfile({
                                    userId: sharedUserId,
                                    username: sharedUsername,
                                    userAvatar: '' 
                                  });
                                }
                              }}
                              className="relative w-full overflow-hidden border-4 border-foreground bg-background shadow-[4px_4px_0px_0px_var(--foreground)] group/card transition-all hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_var(--foreground)] cursor-pointer p-4"
                            >
                                <div className="flex flex-col items-center">
                                  <div className="w-20 h-20 border-4 border-foreground bg-background mb-3 flex items-center justify-center shadow-[4px_4px_0px_0px_var(--foreground)]">
                                      <span className="text-4xl">👤</span>
                                  </div>
                                  
                                  <div className="text-center w-full space-y-1 mb-4">
                                    <h3 className="font-black text-xl text-foreground uppercase tracking-tight">{sharedUsername}</h3>
                                    <p className="text-xs font-bold text-foreground/50 uppercase font-mono tracking-widest">PROFILE SHARE</p>
                                  </div>
                                  
                                  <button
                                      className="w-full py-2 px-4 bg-primary text-primary-foreground font-black uppercase hover:bg-background hover:text-foreground border-2 border-primary transition-colors"
                                  >
                                      VISIT PROFILE
                                  </button>
                                </div>
                            </div>
                          </div>
                        );
                      }
                      
                      return <p className="text-sm font-bold font-mono">{message.text}</p>;
                    })()}
                  </div>
                )}

                {/* Image Message */}
                {message.imageUrl && (
                  <div className="border-4 border-foreground bg-foreground shadow-[4px_4px_0px_0px_var(--foreground)]">
                    <img
                      src={message.imageUrl}
                      alt="Sent image"
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {/* Voice Message */}
                {message.voiceUrl && (
                  <div
                    className={`flex items-center gap-2 px-3 py-3 border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] ${
                      message.senderId === currentUserProfile.userId
                        ? 'bg-foreground text-background'
                        : 'bg-background text-foreground'
                    }`}
                  >
                    <button className={`w-8 h-8 flex items-center justify-center border-2 ${
                      message.senderId === currentUserProfile.userId ? 'bg-background border-background' : 'bg-foreground border-foreground'
                    }`}>
                      <Play
                        className={message.senderId === currentUserProfile.userId ? 'text-foreground fill-foreground' : 'text-background fill-background'}
                        size={14}
                      />
                    </button>
                    <div className={`flex-1 h-2 border-2 ${
                      message.senderId === currentUserProfile.userId ? 'border-background bg-background/20' : 'border-foreground bg-foreground/10'
                    }`}>
                      <div className={`h-full w-1/3 ${
                        message.senderId === currentUserProfile.userId ? 'bg-background' : 'bg-black'
                      }`} />
                    </div>
                    <span className="text-xs font-mono font-bold">{message.voiceDuration}s</span>
                  </div>
                )}

                <p className={`text-[10px] font-mono font-bold text-foreground mt-1 uppercase px-2 py-0.5 bg-background/20 inline-block border border-foreground/10 ${
                  message.senderId === currentUserProfile.userId ? 'text-right' : 'text-left'
                }`}>
                  {message.timestamp}
                </p>
                {/* Unsend Button - Only shows when holding down your own message */}
                {message.senderId === currentUserProfile.userId && showUnsendForMessage === message.id && (
                  <div className={`flex gap-2 mt-2 animate-in slide-in-from-bottom duration-200 ${message.senderId === currentUserProfile.userId ? 'justify-end' : 'justify-start'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUnsendForMessage(null);
                      }}
                      className="px-3 py-1 bg-background text-foreground border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-[10px] font-black uppercase flex items-center gap-1"
                    >
                      <X size={12} strokeWidth={3} />
                      Cancel
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMessageToUnsend(message.id);
                      }}
                      className="px-3 py-1 bg-destructive text-destructive-foreground border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-[10px] font-black uppercase flex items-center gap-1"
                    >
                      <Trash2 size={12} strokeWidth={3} />
                      Unsend
                    </button>
                  </div>
                )}
              </div>
            </div>
          )))}
          {/* Typing Indicator */}
          {isOtherTyping && (
            <div className="flex justify-start mt-2" style={{ animation: 'slideInLeft 0.2s ease both' }}>
              <div className="px-4 py-3 bg-background border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] rounded-tr-xl rounded-tl-xl rounded-br-xl">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-foreground rounded-full" style={{ animation: 'typingDot 1.2s ease-in-out infinite' }} />
                  <div className="w-2 h-2 bg-foreground rounded-full" style={{ animation: 'typingDot 1.2s ease-in-out 0.2s infinite' }} />
                  <div className="w-2 h-2 bg-foreground rounded-full" style={{ animation: 'typingDot 1.2s ease-in-out 0.4s infinite' }} />
                </div>
              </div>
            </div>
          )}
          {/* Message status for last sent message — Sent → Delivered → Seen → Displayed */}
          {(() => {
            const lastSent = [...messages].reverse().find(m => m.senderId === currentUserProfile.userId);
            if (!lastSent) return null;
            const isSeen = readReceipts[lastSent.id];
            const isDisplayed = displayedMessages.has(lastSent.id);
            // Status hierarchy
            let status: string;
            let color: string;
            if (isDisplayed) {
              status = "👁 Displayed";
              color = "text-orange-400";
            } else if (isSeen) {
              status = "✓✓ Seen";
              color = "text-blue-400";
            } else {
              status = "✓✓ Delivered";
              color = "text-foreground/40";
            }
            return (
              <div
                className="flex justify-end mt-0.5 pr-2 animate-in fade-in duration-300"
                key={`${lastSent.id}-${status}`}
              >
                <span className={`text-[9px] font-mono font-bold uppercase ${color}`}>
                  {status}
                </span>
              </div>
            );
          })()}
          <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Unsend Confirmation Modal */}
        {messageToUnsend && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_var(--foreground)] max-w-sm w-full">
              <div className="p-6">
                <h3 className="text-xl font-black uppercase mb-2">UNSEND MESSAGE?</h3>
                <p className="text-sm font-mono font-bold text-foreground/70 mb-6">
                  This message will be deleted for everyone in this conversation.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setMessageToUnsend(null)}
                    className="flex-1 py-3 bg-background border-2 border-foreground text-foreground font-black uppercase shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUnsendMessage(messageToUnsend)}
                    className="flex-1 py-3 bg-red-500 border-2 border-foreground text-white font-black uppercase shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Unsend
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reply Banner */}
        {replyingTo && (
            <div className="shrink-0 bg-background px-4 py-2 border-t-4 border-primary flex items-center justify-between animate-in slide-in-from-bottom duration-200 shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-1 h-8 bg-primary"></div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-foreground font-black uppercase mb-0.5">
                            Replying to {replyingTo.senderId === currentUserProfile.userId ? 'Yourself' : selectedConversation.username}
                        </div>
                        <div className="text-xs text-foreground font-mono truncate font-bold opacity-70">
                            {replyingTo.text || (replyingTo.imageUrl ? 'Photo' : replyingTo.voiceUrl ? 'Voice Message' : replyingTo.sharedPost ? 'Shared Post' : 'Message')}
                        </div>
                    </div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-primary hover:text-primary-foreground text-foreground border-2 border-primary transition-colors">
                    <X size={16} strokeWidth={3} />
                </button>
            </div>
        )}

        {/* Input Area */}
        <div className="shrink-0 p-4 bg-background border-t-4 border-foreground" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <div className="flex items-end gap-2">
            <button className="p-3 bg-background border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none active:bg-foreground active:text-background transition-all">
              <Image size={20} strokeWidth={2.5} />
            </button>
            <div className="flex-1 bg-background border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] flex items-center gap-2 px-3 py-2 focus-within:shadow-[4px_4px_0px_0px_var(--foreground)] transition-all">
              <textarea
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (!selectedConversation || !e.target.value.trim()) return;

                  if (isRestApi()) {
                    const sock = restMsgSocketRef.current;
                    if (sock?.connected && !pendingConvId(selectedConversation.id)) {
                      if (typingEmitTimerRef.current) clearTimeout(typingEmitTimerRef.current);
                      typingEmitTimerRef.current = setTimeout(() => {
                        sock.emit("typing", { conversationId: selectedConversation.id });
                      }, 400);
                    }
                    return;
                  }

                  const typingChannel = supabase.channel(`typing:${selectedConversation.id}`);
                  typingChannel.subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                      typingChannel.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUserProfile.userId } });
                      setTimeout(() => supabase.removeChannel(typingChannel), 500);
                    }
                  });
                }}
                placeholder="TYPE MESSAGE..."
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-foreground/40 font-mono font-bold text-sm resize-none max-h-24 py-1"
                rows={1}
                onFocus={(e) => {
                  // Prevent iOS Safari from scrolling the scaled container
                  e.target.scrollIntoView = () => {};
                  setTimeout(() => {
                    e.target.style.transform = 'translateZ(0)';
                  }, 50);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button className="p-1 hover:bg-foreground/5 rounded">
                <Mic size={20} className="text-foreground" />
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-3 bg-primary text-primary-foreground border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none active:bg-background active:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation List View
  return (
    <div className="flex flex-col bg-background overflow-hidden" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Header */}
      <div className="shrink-0 z-40 bg-background border-b-4 border-foreground px-4 py-4 shadow-[0px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             {onBack && (
                <button onClick={onBack} className="p-2 border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    <ArrowLeft size={20} strokeWidth={3} />
                </button>
             )}
             <h1 className="text-2xl font-black text-foreground tracking-tight uppercase italic">INBOX</h1>
          </div>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-1.5 px-3 py-2 border-2 border-foreground bg-foreground text-background text-xs font-black uppercase shadow-[3px_3px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all active:scale-95"
          >
            <Plus size={14} strokeWidth={3} /> Group
          </button>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 group-focus-within:text-foreground transition-colors" size={20} strokeWidth={3} />
          <input
            type="text"
            placeholder="SEARCH MESSAGES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background border-4 border-foreground outline-none text-sm font-black text-foreground placeholder:text-foreground/30 shadow-[4px_4px_0px_0px_var(--foreground)] focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[2px_2px_0px_0px_var(--foreground)] transition-all uppercase font-mono"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-background" style={{ overscrollBehavior: 'none' }}>
        <style>{`
          @keyframes slideInRow {
            from { opacity: 0; transform: translateX(-24px) scale(0.97); }
            to   { opacity: 1; transform: translateX(0) scale(1); }
          }
          @keyframes pulseBadge {
            0%        { transform: scale(1);    box-shadow: 0 0 0 0 rgba(255,122,46,0.85); }
            40%       { transform: scale(1.22); box-shadow: 0 0 0 7px rgba(255,122,46,0); }
            100%      { transform: scale(1);    box-shadow: 0 0 0 0 rgba(255,122,46,0); }
          }
          @keyframes onlinePing {
            0%   { opacity: 1; transform: scale(1); }
            60%  { opacity: 0; transform: scale(2.4); }
            100% { opacity: 0; transform: scale(2.4); }
          }
          @keyframes ringRotate {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes emptyBounce {
            0%, 100% { transform: translateY(0); }
            50%       { transform: translateY(-10px); }
          }
          @keyframes typingDot {
            0%, 80%, 100% { transform: translateY(0);    opacity: 0.35; }
            40%            { transform: translateY(-5px); opacity: 1; }
          }
          @keyframes waveBar {
            0%, 100% { transform: scaleY(0.4); }
            50%       { transform: scaleY(1); }
          }
          @keyframes rowGlow {
            0%, 100% { box-shadow: 4px 4px 0 0 #000, 0 0 0 0 rgba(255,122,46,0); }
            50%       { box-shadow: 4px 4px 0 0 #000, 0 0 12px 2px rgba(255,122,46,0.35); }
          }
          @keyframes liveFlash {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.3; }
          }
          @keyframes shimmer {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.85); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes slideInFromBottom {
            from { opacity: 0; transform: translateY(100%); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div className="p-2 space-y-2">
          {conversationsList.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-20 h-20 border-4 border-foreground bg-background flex items-center justify-center shadow-[6px_6px_0_0_var(--foreground)]"
                     style={{ animation: 'emptyBounce 1.8s ease-in-out infinite' }}>
                    <Send size={36} className="text-foreground" />
                </div>
                <p className="font-black text-xl uppercase tracking-widest text-foreground">No Messages Yet</p>
                <p className="text-xs font-mono font-bold text-foreground/40 uppercase">Start a conversation!</p>
             </div>
          ) : (
             (() => {
               // Retro video game lime green highlight for matched letters
               const highlightMatch = (text: string, query: string) => {
                 if (!query.trim()) return <>{text}</>;
                 const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                 const regex = new RegExp(`(${escaped})`, 'gi');
                 const parts = text.split(regex);
                 return (
                   <>
                     {parts.map((part, i) =>
                       regex.test(part) ? (
                         <span
                           key={i}
                           style={{
                             backgroundColor: '#39ff14',
                             color: '#000',
                             fontFamily: "'Courier New', monospace",
                             fontWeight: 900,
                             textShadow: '0 0 6px #39ff14, 0 0 14px #39ff14',
                             padding: '0 1px',
                             letterSpacing: '0.05em',
                           }}
                         >
                           {part}
                         </span>
                       ) : (
                         <span key={i}>{part}</span>
                       )
                     )}
                   </>
                 );
               };

               // Helpers
               const isTyping   = (_idx: number, conv: Conversation) => !!conv.isTyping;

               const waveDelays = ['0ms','80ms','160ms','240ms','320ms'];

               // Filter conversations based on search query
               const filteredConversations = searchQuery.trim() 
                 ? conversationsList.filter(conversation => 
                     conversation.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     conversation.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
                   )
                 : conversationsList;

               return filteredConversations.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 gap-3">
                   <div className="w-16 h-16 border-4 border-foreground bg-background flex items-center justify-center shadow-[4px_4px_0_0_var(--foreground)]"
                        style={{ animation: 'emptyBounce 1.8s ease-in-out infinite' }}>
                     <Search size={28} className="text-foreground" />
                   </div>
                   <p className="font-black text-lg uppercase text-foreground">No Results</p>
                   <p className="text-xs font-mono font-bold text-foreground/40 uppercase">Try a different search</p>
                 </div>
               ) : (
                 filteredConversations.map((conversation, idx) => (
                   <button
                     key={conversation.id}
                     onClick={() => {
                       if (convLongPressTriggered.current) return;
                       setSelectedConversation(conversation);
                     }}
                     onTouchStart={() => startConvLongPress(conversation)}
                     onTouchEnd={cancelConvLongPress}
                     onTouchMove={cancelConvLongPress}
                     onMouseDown={() => startConvLongPress(conversation)}
                     onMouseUp={cancelConvLongPress}
                     onMouseLeave={cancelConvLongPress}
                     onContextMenu={(e) => e.preventDefault()}
                     style={{
                       animation: `slideInRow 0.38s cubic-bezier(.22,.68,0,1.28) ${idx * 60}ms both${conversation.unreadCount > 0 ? ', rowGlow 2.5s ease-in-out 1s infinite' : ''}`,
                     }}
                     className="w-full flex items-center gap-4 p-3 bg-background border-2 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] hover:shadow-[2px_2px_0px_0px_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-orange-50 active:scale-[0.98] transition-all group relative overflow-hidden"
                   >
                     {/* Shimmer sweep on hover */}
                     <span
                       className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                       style={{
                         background: 'linear-gradient(105deg, transparent 40%, rgba(255,122,46,0.12) 50%, transparent 60%)',
                         backgroundSize: '200% 100%',
                         animation: 'shimmer 1.2s linear infinite',
                       }}
                     />

                     {/* Avatar */}
                     <div className="relative flex-shrink-0">
                       <div
                         className="w-14 h-14 bg-foreground border-2 border-foreground overflow-hidden group-hover:scale-105 transition-transform duration-200"
                       >
                         {conversation.isGroup ? (
                           <div className="w-full h-full bg-foreground/90 flex items-center justify-center">
                             <Users size={24} className="text-background" strokeWidth={2.5} />
                           </div>
                         ) : (
                           <img
                             src={conversation.userAvatar}
                             alt={conversation.username}
                             className="w-full h-full object-cover"
                           />
                         )}
                       </div>

                       {/* Online indicator — removed (no real presence tracking) */}
                       {false && (
                         <>
                           <span
                             className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-background border-2 border-white rounded-full"
                             style={{ zIndex: 2 }}
                           />
                           <span
                             className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-background rounded-full"
                             style={{ animation: 'onlinePing 1.8s ease-out infinite', zIndex: 2 }}
                           />
                         </>
                       )}

                       {/* Unread badge */}
                       {conversation.unreadCount > 0 && (
                         <div
                           className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1 bg-background border-2 border-foreground flex items-center justify-center"
                           style={{ animation: 'pulseBadge 1.4s ease-out infinite', zIndex: 3 }}
                         >
                           <span className="text-foreground text-[10px] font-black leading-none">{conversation.unreadCount}</span>
                         </div>
                       )}
                     </div>
                     
                     <div className="flex-1 text-left min-w-0 relative">
                       <div className="flex justify-between items-center mb-0.5">
                         <div className="flex items-center gap-1.5 min-w-0">
                           <h3 className="font-black text-base text-foreground uppercase truncate group-hover:text-background transition-colors duration-150">
                             {highlightMatch(conversation.isGroup ? (conversation.groupName || conversation.username) : conversation.username, searchQuery)}
                           </h3>
                           {conversation.isGroup && (
                             <span className="text-[8px] font-black bg-foreground text-background px-1 py-0.5 uppercase shrink-0">GRP</span>
                           )}

                         </div>
                         <span className="text-[10px] font-bold font-mono text-foreground/40 flex-shrink-0 ml-2">{conversation.timestamp}</span>
                       </div>

                       {/* Typing indicator OR last message */}
                       {isTyping(idx, conversation) ? (
                         <div className="flex items-center gap-1 h-5">
                           <span className="text-[11px] font-mono font-bold text-background uppercase">typing</span>
                           {[0,1,2].map(i => (
                             <span
                               key={i}
                               className="inline-block w-1.5 h-1.5 bg-background rounded-full"
                               style={{ animation: `typingDot 1.1s ease-in-out ${i * 180}ms infinite` }}
                             />
                           ))}
                         </div>
                       ) : conversation.lastMessage?.startsWith('🎵') || conversation.lastMessage?.includes('voice') ? (
                         /* Waveform bars for audio messages */
                         <div className="flex items-end gap-[3px] h-5">
                           {waveDelays.map((delay, i) => (
                             <span
                               key={i}
                               className="inline-block w-[3px] bg-foreground/40 group-hover:bg-background transition-colors origin-bottom"
                               style={{
                                 height: `${[10,16,8,14,6][i]}px`,
                                 animation: `waveBar 0.7s ease-in-out ${delay} infinite`,
                               }}
                             />
                           ))}
                           <span className="ml-1 text-[11px] font-mono text-foreground/50">Voice message</span>
                         </div>
                       ) : (
                         <p className={`text-sm truncate font-mono ${
                           conversation.unreadCount > 0 ? 'text-foreground font-bold' : 'text-foreground/55'
                         }`}>
                           {highlightMatch(conversation.lastMessage || '', searchQuery)}
                         </p>
                       )}
                     </div>

                     {/* Magnetic chevron */}
                     <div className="flex-shrink-0 flex flex-col items-center gap-1">
                       <span className="text-foreground/20 group-hover:text-background group-hover:translate-x-1 transition-all duration-150 font-black text-xl leading-none">›</span>
                       {conversation.unreadCount > 0 && (
                         <span className="w-1.5 h-1.5 rounded-full bg-background" style={{ animation: 'pulseBadge 2s ease-in-out infinite' }} />
                       )}
                     </div>
                   </button>
                 ))
               );
             })()
          )}
        </div>
      </div>

      {/* Delete Conversation Confirmation Modal */}
      {deleteConversationTarget && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
          onClick={() => setDeleteConversationTarget(null)}
        >
          <div 
            className="bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_var(--foreground)] max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'scaleIn 0.2s cubic-bezier(.22,.68,0,1.3) both' }}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500 border-2 border-foreground flex items-center justify-center shadow-[3px_3px_0px_0px_var(--foreground)]">
                  <Trash2 size={24} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase leading-tight">DELETE CHAT</h3>
                  <p className="text-[10px] font-mono font-bold text-foreground/40 uppercase">This cannot be undone</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-foreground/5 border-2 border-foreground/10 mb-5">
                <div className="w-10 h-10 border-2 border-foreground overflow-hidden flex-shrink-0">
                  <img src={deleteConversationTarget.userAvatar} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-sm uppercase truncate">{deleteConversationTarget.username}</p>
                  <p className="text-xs font-mono text-foreground/50 truncate">{deleteConversationTarget.lastMessage}</p>
                </div>
              </div>
              <p className="text-sm font-mono font-bold text-foreground/70 mb-6">
                Delete your entire conversation with <span className="text-foreground font-black uppercase">{deleteConversationTarget.username}</span>? All messages will be removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConversationTarget(null)}
                  disabled={isDeletingConversation}
                  className="flex-1 py-3 bg-background border-2 border-foreground text-foreground font-black uppercase shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteConversation(deleteConversationTarget)}
                  disabled={isDeletingConversation}
                  className="flex-1 py-3 bg-red-500 border-2 border-foreground text-white font-black uppercase shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeletingConversation ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={16} strokeWidth={3} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Chat Modal */}
      {showCreateGroup && (
        <div className="absolute inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateGroup(false)}>
          <div
            className="w-full bg-background border-t-4 border-x-4 border-foreground shadow-[0px_-6px_0px_0px_color-mix(in_srgb,var(--foreground)_20%,transparent)]"
            style={{ maxHeight: '85%', display: 'flex', flexDirection: 'column', animation: 'slideInFromBottom 0.3s cubic-bezier(.22,.68,0,1.2) both' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b-4 border-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-foreground flex items-center justify-center">
                  <Users size={16} className="text-background" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black uppercase text-foreground">New Group</h2>
              </div>
              <button onClick={() => setShowCreateGroup(false)} className="w-8 h-8 flex items-center justify-center border-2 border-foreground hover:bg-foreground hover:text-background transition-colors">
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            <div className="shrink-0 px-5 py-3 border-b-2 border-foreground/10">
              <input
                type="text"
                placeholder="Group name..."
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="w-full border-4 border-foreground bg-background px-4 py-3 font-black text-foreground outline-none text-base shadow-[3px_3px_0px_0px_var(--foreground)] focus:shadow-none focus:translate-x-[3px] focus:translate-y-[3px] transition-all placeholder:text-foreground/30"
              />
            </div>

            <div className="shrink-0 px-5 py-3 border-b-2 border-foreground/10">
              <div className="flex items-center gap-2 border-2 border-foreground px-3 py-2">
                <Search size={16} className="text-foreground/40 shrink-0" strokeWidth={2.5} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={groupMemberSearch}
                  onChange={e => setGroupMemberSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-bold text-foreground placeholder:text-foreground/30 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {availableContacts.length === 0 ? (
                <div className="py-10 text-center">
                  <Users size={40} className="text-foreground/20 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="font-black text-foreground/40 uppercase text-sm">No contacts yet</p>
                  <p className="text-xs font-bold text-foreground/25 mt-1">Message someone first to add them to a group</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableContacts
                    .filter(c => c.username.toLowerCase().includes(groupMemberSearch.toLowerCase()))
                    .map(contact => {
                      const selected = selectedGroupMembers.has(contact.userId);
                      return (
                        <button
                          key={contact.userId}
                          onClick={() => {
                            setSelectedGroupMembers(prev => {
                              const next = new Set(prev);
                              if (next.has(contact.userId)) next.delete(contact.userId);
                              else next.add(contact.userId);
                              return next;
                            });
                          }}
                          className={`w-full flex items-center gap-3 p-3 border-2 border-foreground transition-all ${selected ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-foreground/5'}`}
                        >
                          <img src={contact.avatar} alt={contact.username} className="w-10 h-10 object-cover border-2 border-current shrink-0" />
                          <span className="flex-1 text-left font-black text-sm uppercase">@{contact.username}</span>
                          {selected && <Check size={16} strokeWidth={3} />}
                        </button>
                      );
                    })
                  }
                </div>
              )}
            </div>

            <div className="shrink-0 px-5 py-4 border-t-4 border-foreground">
              {selectedGroupMembers.size > 0 && (
                <p className="text-xs font-mono font-bold text-foreground/50 mb-2 uppercase">
                  {selectedGroupMembers.size} member{selectedGroupMembers.size !== 1 ? 's' : ''} selected
                </p>
              )}
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedGroupMembers.size < 2}
                className="w-full py-4 border-4 border-foreground font-black uppercase text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-foreground text-background shadow-[4px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] hover:shadow-[2px_2px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] hover:translate-x-[2px] hover:translate-y-[2px] active:scale-95"
              >
                Create Group {selectedGroupMembers.size >= 2 ? `(${selectedGroupMembers.size + 1})` : ''}
              </button>
              {selectedGroupMembers.size < 2 && selectedGroupMembers.size > 0 && (
                <p className="text-center text-xs font-mono text-foreground/40 mt-1">Need at least 2 members</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}