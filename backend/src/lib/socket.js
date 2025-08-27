import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store the socket id of the user
const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Join user to their personal room for conversation updates
  if (userId) {
    socket.join(`user_${userId}`);
  }

  socket.on("disconnect", () => {
    console.log("a user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Function to emit conversation updates
export function emitConversationUpdate(userId, conversationData) {
  io.to(`user_${userId}`).emit("conversationUpdate", conversationData);
}

// Function to emit conversation deletion
export function emitConversationDeleted(userId, deletedUserId) {
  io.to(`user_${userId}`).emit("conversationDeleted", deletedUserId);
}

export { io, server, app };
