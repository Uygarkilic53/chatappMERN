import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import {
  getReceiverSocketId,
  io,
  emitConversationUpdate,
} from "../lib/socket.js";
import mongoose from "mongoose";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (err) {
    console.error("Error fetching users for sidebar:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: senderId },
      ],
    });

    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // Real-time message delivery
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // Get updated conversation data for both users
    const senderConversation = await getUserConversationData(
      senderId,
      receiverId
    );
    const receiverConversation = await getUserConversationData(
      receiverId,
      senderId
    );

    // Emit conversation updates to both users
    emitConversationUpdate(senderId, receiverConversation);
    emitConversationUpdate(receiverId, senderConversation);

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to get conversation data for a user
const getUserConversationData = async (currentUserId, otherUserId) => {
  try {
    // Get the other user's info
    const otherUser = await User.findById(otherUserId).select("-password");

    // Get the last message between these users
    const lastMessage = await Message.findOne({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    }).sort({ createdAt: -1 });

    if (!lastMessage || !otherUser) return null;

    return {
      _id: otherUser._id,
      fullName: otherUser.fullName,
      email: otherUser.email,
      profilePic: otherUser.profilePic,
      lastMessage: lastMessage.text,
      lastMessageTime: lastMessage.createdAt,
    };
  } catch (error) {
    console.error("Error getting conversation data:", error);
    return null;
  }
};

export const getConversations = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const currentUserId = new mongoose.Types.ObjectId(req.user._id);
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
        },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$senderId", currentUserId] },
              then: "$receiverId",
              else: "$senderId",
            },
          },
          lastMessage: { $last: "$text" },
          lastMessageTime: { $last: "$createdAt" },
          messageCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: "$userInfo._id",
          fullName: "$userInfo.fullName",
          email: "$userInfo.email",
          profilePic: "$userInfo.profilePic",
          lastMessage: 1,
          lastMessageTime: 1,
          messageCount: 1,
        },
      },
      { $sort: { lastMessageTime: -1 } },
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: "Failed to get conversations" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    // Delete all messages between these two users
    await Message.deleteMany({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    });

    // Emit conversation deletion to the other user
    const otherUserSocketId = getReceiverSocketId(otherUserId);
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("conversationDeleted", currentUserId);
    }

    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ message: "Failed to delete conversation" });
  }
};
