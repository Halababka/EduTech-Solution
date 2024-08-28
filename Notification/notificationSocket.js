import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Хранение соединений для каждого пользователя
export const userSockets = new Map();


// Для обработки в запросах без сокета, то есть через запрос например от postman
export function sendNotificationToUserOnServer(recipientId, notificationMessage) {
    // Получение соединения для пользователя
    const recipientSocket = userSockets.get(recipientId);
    if (recipientSocket) {
        // Отправка уведомления
        recipientSocket.emit("notification", notificationMessage);
    } else {
        console.log(`User ${recipientId} is not connected.`);
    }
}

//Отправка уведомления, обработка sendNotification в Index.js файле
export const sendNotificationToUser = async (recipientId, message) => {
    const timestamp = new Date();

    // Сохранение уведомления в базе данных
    await prisma.notification.create({
        data: {
            recipient_id: recipientId,
            message: message,
            created_at: timestamp
        }
    });

    const recipientSocket = userSockets.get(recipientId);
    if (recipientSocket) {
        // Отправка уведомления
        recipientSocket.emit("notification", message);
    } else {
        console.log(`User ${recipientId} is not connected.`);
    }
};