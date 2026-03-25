import { Conversation, Message } from '../types';

// Initial mock data - empty by default
export const initialConversations: Conversation[] = [];

export const initialConversationMessages: Record<string, Message[]> = {};

// Global store to persist state between component unmounts
export const messageStore = {
  conversations: [...initialConversations],
  messages: JSON.parse(JSON.stringify(initialConversationMessages)) as Record<string, Message[]>,

  getConversations: () => messageStore.conversations,
  
  getMessages: (conversationId: string) => messageStore.messages[conversationId] || [],

  sendMessage: (conversationId: string, message: Message) => {
    if (!messageStore.messages[conversationId]) {
      messageStore.messages[conversationId] = [];
    }
    
    // Check for duplicates before adding
    if (messageStore.messages[conversationId].some(m => m.id === message.id)) {
      return;
    }

    messageStore.messages[conversationId].push(message);

    // Update conversation list
    const convIndex = messageStore.conversations.findIndex(c => c.id === conversationId);
    if (convIndex >= 0) {
      const conv = messageStore.conversations[convIndex];
      // Move to top
      messageStore.conversations.splice(convIndex, 1);
      messageStore.conversations.unshift({
        ...conv,
        lastMessage: message.text || (message.sharedPost ? `Shared a post` : (message.imageUrl ? 'Sent an image' : 'Sent a message')),
        timestamp: 'Just now',
        // If message is from us (currentUser or generic), no unread. If from others, increment unread?
        // For simplicity, we'll let the UI handle read status updates or assume "read" if we are in the chat
      });
    }
  },

  receiveMessage: (conversationId: string, message: Message) => {
    messageStore.sendMessage(conversationId, message);
    
    // Increment unread count if we wanted to (but we'd need to know if we are viewing it)
    // For now, simple reuse of sendMessage is fine
  },

  createConversation: (user: { userId: string, username: string, userAvatar: string }) => {
    // Check if conversation exists
    const existing = messageStore.conversations.find(c => c.userId === user.userId);
    if (existing) return existing;

    const newConv: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.userId,
      username: user.username,
      userAvatar: user.userAvatar,
      lastMessage: 'Start a conversation',
      timestamp: 'Now',
      unreadCount: 0
    };

    messageStore.conversations.unshift(newConv);
    messageStore.messages[newConv.id] = [];
    return newConv;
  }
};