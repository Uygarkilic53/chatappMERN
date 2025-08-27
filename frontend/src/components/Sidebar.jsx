import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, X, MessageCircle, Trash2 } from "lucide-react";

const Sidebar = () => {
  const {
    searchUsersByEmail,
    selectedUser,
    setSelectedUser,
    isSearching,
    conversations,
    getConversations,
    deleteConversation,
    isConversationsLoading,
    subscribeToConversations,
    unsubscribeFromConversations,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState("conversations"); // "conversations" or "search"

  useEffect(() => {
    getConversations();
    subscribeToConversations();

    // Cleanup on unmount
    return () => {
      unsubscribeFromConversations();
    };
  }, []);

  // Filter users based on online status
  const getFilteredUsers = (userList) => {
    if (!showOnlineOnly) return userList;
    return userList.filter((user) => onlineUsers?.includes(user._id));
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      const results = await searchUsersByEmail(searchEmail);
      setSearchResults(results);
      setHasSearched(true);

      if (selectedUser) {
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const clearSearch = () => {
    setSearchEmail("");
    setSearchResults([]);
    setHasSearched(false);
    setSelectedUser(null);
  };

  const handleUserSelect = (user, fromConversations = false) => {
    if (
      fromConversations ||
      (hasSearched && searchResults.some((result) => result._id === user._id))
    ) {
      setSelectedUser(user);
    }
  };

  const handleDeleteConversation = async (userId, e) => {
    e.stopPropagation(); // Prevent selecting the user
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      await deleteConversation(userId);
    }
  };

  const formatLastMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const filteredConversations = getFilteredUsers(conversations);
  const filteredSearchResults = getFilteredUsers(searchResults);

  if (isConversationsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Messages</span>
        </div>

        {/* Tab Navigation */}
        <div className="mt-3 hidden lg:flex gap-2">
          <button
            onClick={() => setActiveTab("conversations")}
            className={`flex-1 py-2 px-3 text-sm rounded-lg transition-colors ${
              activeTab === "conversations"
                ? "bg-primary text-primary-content"
                : "bg-base-200 hover:bg-base-300"
            }`}
          >
            <MessageCircle className="size-4 inline mr-2" />
            Chats
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-2 px-3 text-sm rounded-lg transition-colors ${
              activeTab === "search"
                ? "bg-primary text-primary-content"
                : "bg-base-200 hover:bg-base-300"
            }`}
          >
            <Search className="size-4 inline mr-2" />
            Search
          </button>
        </div>

        {/* Search Section - Only show when search tab is active */}
        {activeTab === "search" && (
          <div className="mt-3 hidden lg:block">
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <input
                  type="email"
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="input input-sm w-full pr-8"
                />
                {searchEmail && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="btn btn-sm btn-primary"
              >
                {isSearching ? (
                  <div className="loading loading-spinner loading-xs" />
                ) : (
                  <Search className="size-4" />
                )}
              </button>
            </div>

            {/* Search Status */}
            {hasSearched && (
              <div className="text-xs text-zinc-500 mb-2">
                {searchResults.length > 0
                  ? `Found ${searchResults.length} user(s) matching "${searchEmail}"`
                  : `No users found matching "${searchEmail}"`}
              </div>
            )}
          </div>
        )}

        {/* Online Filter */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            (
            {onlineUsers && onlineUsers.length > 0 ? onlineUsers.length - 1 : 0}{" "}
            online)
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {/* Show conversations */}
        {activeTab === "conversations" && (
          <>
            {filteredConversations.map((conversation) => (
              <div
                key={conversation._id}
                className={`
                  relative group w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors cursor-pointer
                  ${
                    selectedUser?._id === conversation._id
                      ? "bg-base-300 ring-1 ring-base-300"
                      : ""
                  }
                `}
                onClick={() => handleUserSelect(conversation, true)}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={conversation.profilePic || "/avatar.png"}
                    alt={conversation.fullName}
                    className="size-12 object-cover rounded-full"
                  />
                  {onlineUsers?.includes(conversation._id) && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500
                       rounded-full ring-2 ring-zinc-900"
                    />
                  )}
                </div>

                <div className="hidden lg:block text-left min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {conversation.fullName}
                  </div>
                  <div className="text-sm text-zinc-400 truncate">
                    {conversation.lastMessage}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {formatLastMessageTime(conversation.lastMessageTime)}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteConversation(conversation._id, e)}
                  className="hidden group-hover:block absolute right-2 top-2 p-1 rounded-full bg-error/20 hover:bg-error/30 text-error"
                  title="Delete conversation"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}

            {filteredConversations.length === 0 && (
              <div className="text-center text-zinc-400 py-4 px-3 text-sm">
                {showOnlineOnly
                  ? "No online conversations"
                  : "No conversations yet. Search for users to start chatting!"}
              </div>
            )}
          </>
        )}

        {/* Show search results */}
        {activeTab === "search" && (
          <>
            {filteredSearchResults.map((user) => {
              const isClickable =
                hasSearched &&
                searchResults.some((result) => result._id === user._id);

              return (
                <button
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  disabled={!isClickable}
                  className={`
                    w-full p-3 flex items-center gap-3
                    transition-colors
                    ${
                      !isClickable
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-base-300 cursor-pointer"
                    }
                    ${
                      selectedUser?._id === user._id
                        ? "bg-base-300 ring-1 ring-base-300"
                        : ""
                    }
                  `}
                >
                  <div className="relative mx-auto lg:mx-0">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.name}
                      className="size-12 object-cover rounded-full"
                    />
                    {onlineUsers?.includes(user._id) && (
                      <span
                        className="absolute bottom-0 right-0 size-3 bg-green-500
                         rounded-full ring-2 ring-zinc-900"
                      />
                    )}
                  </div>

                  <div className="hidden lg:block text-left min-w-0">
                    <div className="font-medium truncate">{user.fullName}</div>
                    <div className="text-sm text-zinc-400 truncate">
                      {user.email}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {onlineUsers?.includes(user._id) ? "Online" : "Offline"}
                    </div>
                  </div>
                </button>
              );
            })}

            {!hasSearched && (
              <div className="text-center text-zinc-400 py-4 px-3 text-sm">
                Search for users by email to start conversations
              </div>
            )}

            {hasSearched && filteredSearchResults.length === 0 && (
              <div className="text-center text-zinc-500 py-4">
                {showOnlineOnly
                  ? "No online users found matching your search"
                  : "No users found matching your search"}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
