import express from "express";
import cors from 'cors';
import { createServer } from "http";
import { Server } from "socket.io";
import notificationRoutes from "./routes/notification.routes.js";
import { sendNotificationToUser, userSockets } from "./notificationSocket.js";

const port = 8181
const app = express();
app.use(cors())
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    // console.log(socket.id);
    // console.log('User connected:', socket.id);

    // Обработка аутентификации пользователя
    socket.on('authenticate', (userId) => {
        // Сохранение соединения для пользователя
        userSockets.set(userId, socket);
        console.log(`User ${userId} authenticated.`);
    });

    // Обработка отправки уведомления
    socket.on('sendNotification', ({ recipientId, message, timestamp }) => {
        // Вызов функции и передача параметров для отправки сообщения
        sendNotificationToUser(recipientId, message)
    });

    // Обработка отключения пользователя
    socket.on('disconnect', () => {
        // Удаление соединения при отключении пользователя
        userSockets.forEach((value, key) => {
            if (value === socket) {
                userSockets.delete(key);
                console.log(`User ${key} disconnected.`);
            }
        });
    });
});


app.use('/api/notifications', notificationRoutes);

httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});