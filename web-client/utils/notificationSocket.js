import io from 'socket.io-client';
import { useUser } from "~/composables/user";

let notificationSocket = null;

export async function setupNotificationSocket() {
    const { value: user } = await useUser(); // Ждем завершения инициализации useUser
    const { $toast } = useNuxtApp();

    const socket = io('http://localhost:8181'); // Укажите адрес вашего сервера

    socket.on('connect', () => {
        console.log('Connected to notification server');
    });

    socket.on('disconnect', () => {
        notificationSocket = null;
        console.log('Disconnected from notification server');
    });

    // Аутентификация пользователя и установка соединения с сокетом
    socket.emit('authenticate', user.userData.id);

    // Обработка полученных уведомлений
    socket.on('notification', (message) => {
        $toast.add({ severity: 'secondary', summary: 'Уведомление', detail: message, life: 3000 });
        useNotification(true);
        console.log('Received notification:', message);
    });

    notificationSocket = socket;

    return socket;
}

export function useNotificationSocket() {
    return notificationSocket;
}

export function sendNotificationToUser(userId, notificationMessage) {
    try {
        const socket = useNotificationSocket();

        if (socket) {
            socket.emit('sendNotification', { recipientId: userId, message: notificationMessage, timestamp: new Date().toISOString() });
        } else {
            console.error('Notification socket is not initialized');
        }
    } catch {

    }
}

export async function disconnectNotificationSocket() {
    const socket = useNotificationSocket();

    if (socket) {
        socket.disconnect();
        notificationSocket = null;
        console.log('Disconnected from notification socket');
    } else {
        console.error('Notification socket is not initialized');
    }
}
