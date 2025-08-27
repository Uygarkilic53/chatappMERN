import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  conversations: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSearching: false,
  isConversationsLoading: false,

  // Get conversation history
  getConversations: async () => {
    set({ isConversationsLoading: true });
    try {
      const response = await axiosInstance.get("/message/conversations");
      set({ conversations: response.data, isConversationsLoading: false });
    } catch (error) {
      set({ isConversationsLoading: false });
      console.error("Failed to load conversations:", error);
      toast.error("Failed to load conversations");
    }
  },

  // Delete conversation
  deleteConversation: async (userId) => {
    try {
      await axiosInstance.delete(`/message/conversations/${userId}`);

      // Remove from conversations list
      const { conversations, selectedUser } = get();
      const updatedConversations = conversations.filter(
        (conv) => conv._id !== userId
      );
      set({ conversations: updatedConversations });

      // Clear selected user if it was the deleted conversation
      if (selectedUser && selectedUser._id === userId) {
        set({ selectedUser: null, messages: [] });
      }

      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      toast.error("Failed to delete conversation");
    }
  },

  // Search function using backend endpoint
  searchUsersByEmail: async (email) => {
    set({ isSearching: true });
    try {
      console.log("Searching for email:", email); // Debug log
      const response = await axiosInstance.get(
        `/auth/search?email=${encodeURIComponent(email)}`
      );
      console.log("Search response:", response.data); // Debug log
      set({ isSearching: false });
      return response.data;
    } catch (error) {
      set({ isSearching: false });
      console.error("Search failed:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to search users");
      return [];
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const response = await axiosInstance.get(`/message/${userId}`);
      set({ messages: response.data, isMessagesLoading: false });
    } catch (error) {
      set({ isMessagesLoading: false });
      console.error("Failed to load messages:", error);
      toast.error("Failed to load messages");
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/message/send/${selectedUser._id}`,
        messageData
      );
      set({
        messages: [...messages, res.data],
      });

      // Refresh conversations to update last message
      get().getConversations();
    } catch (error) {
      toast.error("Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (message) => {
      const { selectedUser: currentSelected } = get();

      // Only add message if it's from the currently selected user
      if (
        currentSelected &&
        (message.senderId === currentSelected._id ||
          message.receiverId === currentSelected._id)
      ) {
        set({ messages: [...get().messages, message] });
      }
    });
  },

  // Subscribe to conversation updates
  subscribeToConversations: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Listen for new conversations or updates
    socket.on("conversationUpdate", (conversationData) => {
      if (!conversationData) return;

      const { conversations } = get();
      const existingIndex = conversations.findIndex(
        (conv) => conv._id === conversationData._id
      );

      if (existingIndex !== -1) {
        // Update existing conversation
        const updatedConversations = [...conversations];
        updatedConversations[existingIndex] = conversationData;
        // Sort by most recent
        updatedConversations.sort(
          (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );
        set({ conversations: updatedConversations });
      } else {
        // Add new conversation
        const newConversations = [conversationData, ...conversations];
        set({ conversations: newConversations });
      }
    });

    // Listen for conversation deletions
    socket.on("conversationDeleted", (deletedUserId) => {
      const { conversations, selectedUser } = get();
      const updatedConversations = conversations.filter(
        (conv) => conv._id !== deletedUserId
      );
      set({ conversations: updatedConversations });

      // Clear selected user if it was the deleted conversation
      if (selectedUser && selectedUser._id === deletedUserId) {
        set({ selectedUser: null, messages: [] });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  unsubscribeFromConversations: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("conversationUpdate");
    socket.off("conversationDeleted");
  },

  setSelectedUser: (user) => {
    // Clear messages when switching users to prevent showing old messages
    set({ selectedUser: user, messages: [] });

    // If user is provided, load their messages
    if (user) {
      get().getMessages(user._id);
    }
  },
}));
