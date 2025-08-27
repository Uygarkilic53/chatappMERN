import express, { Router } from "express";
import * as authController from "../controller/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.middleware.js";

const router = express.Router();

router.post("/signup", authController.signup);

router.post("/login", authController.login);

router.post("/logout", authController.logout);

router.put("/update-profile", protectRoute, authController.updateProfile);

router.get("/check", protectRoute, authController.checkAuth);

router.get("/search", protectRoute, authController.searchUser);

export default router;
