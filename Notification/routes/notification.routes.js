import express from "express";
import {
    sendNotification,
    getNotificationsByRecipientId,
    markNotificationsAsRead
} from "../controller/notification.controller.js";

const router = express.Router();

// Маршруты
router.post("/", sendNotification);
router.get("/:recipientId", getNotificationsByRecipientId);
router.put("/mark-read", markNotificationsAsRead);

export default router;
