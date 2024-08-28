import { PrismaClient } from '@prisma/client';
import { sendNotificationToUser, sendNotificationToUserOnServer } from "../notificationSocket.js";

const prisma = new PrismaClient();

// Функция для создания нового уведомления
export const sendNotification = async (req, res) => {
    const { recipient_id, message } = req.body;

    try {
        const notification = await prisma.notification.create({
            data: {
                recipient_id,
                message
            }
        });

        // Попытка отправить уведомление пользователю, если он подключен
        sendNotificationToUserOnServer(recipient_id, message);

        res.status(201).json({ success: true, data: notification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// Функция для получения всех уведомлений для конкретного получателя
export const getNotificationsByRecipientId = async (req, res) => {
    const { recipientId } = req.params;

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                recipient_id: parseInt(recipientId)
            },
            orderBy: {
                created_at: 'desc' // Сортировка по убыванию даты создания
            }
        });

        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// Функция для пометки уведомлений как прочитанных
export const markNotificationsAsRead = async (req, res) => {
    const { notificationIds } = req.body;

    try {
        // Пометить уведомления как прочитанные
        await prisma.notification.updateMany({
            where: {
                id: {
                    in: notificationIds
                }
            },
            data: {
                is_read: true
            }
        });

        res.status(200).json({ success: true, message: 'Notifications marked as read successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};