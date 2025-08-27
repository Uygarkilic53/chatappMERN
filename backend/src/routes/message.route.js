import express from "express";
import { protectRoute } from "../middleware/protectRoute.middleware.js";
import * as messageController from "../controller/message.controller.js";

const router = express.Router();

router.get("/conversations", protectRoute, messageController.getConversations);
router.delete(
  "/conversations/:userId",
  protectRoute,
  messageController.deleteMessage
);
router.get("/user", protectRoute, messageController.getUsersForSidebar);
router.get("/:id", protectRoute, messageController.getMessages);

router.post("/send/:id", protectRoute, messageController.sendMessage);

export default router;
