import io from 'socket.io-client';

export const notificationSocket = setupNotificationSocket();

// Функция для установки соединения с сервером уведомлений
export function setupNotificationSocket() {
    const socket = io('http://localhost:8181'); // Укажите адрес вашего сервера

    socket.on('connect', () => {
        console.log('Connected to notification server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from notification server');
    });

    // Аутентификация пользователя и установка соединения с сокетом
    socket.emit('authenticate', 0);

    return socket;
}

export function sendNotificationToUser(userId, notificationMessage) {
    // Отправляем уведомление с помощью сокета одному пользователю
    notificationSocket.emit('sendNotification', { recipientId: userId, message: notificationMessage });
}

export async function sendNotificationToUsers(userIds, notificationMessage) {
    userIds.forEach(userId => {
        try {
            // Отправка уведомления каждому пользователю
            sendNotificationToUser(userId, notificationMessage);
        } catch (error) {
            console.error(`Error sending notification to user ${userId}:`, error);
        }
    });
}