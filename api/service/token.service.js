import jwt from "jsonwebtoken";
import { client } from "../db.js";

class TokenService {
    generateAuthTokens(id) {
        const accessToken = jwt.sign({id: id}, process.env.JWT_ACCESS_SECRET, {expiresIn: "30m"});
        const refreshToken = jwt.sign({id: id}, process.env.JWT_REFRESH_SECRET, {expiresIn: "7d"}); // при изменении времени жизни, также заменить время жизни куки

        return {
            accessToken,
            refreshToken
        };
    }

    async saveRefreshToken(userId, refreshToken, deviceInfo) {
        const tokenData = await client.token.findFirst({
            where: {userId, deviceInfo}
        });
        if (tokenData) {
            await client.token.update({
                where: {id: tokenData.id},
                data: {token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
            });
        } else {
            await client.token.create({
                data: {
                    token: refreshToken,
                    user: {
                        connect: {id: userId}
                    },
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
                    deviceInfo: deviceInfo
                }
            });
        }
    }

    async refreshTokens(refreshToken, deviceInfo) {
        try {
            const decoded = this.verifyRefreshToken(refreshToken);
            const userId = decoded.id;
            console.log(deviceInfo, "\n")
            const storedToken = await client.token.findFirst({
                where: {userId, token: refreshToken, deviceInfo: deviceInfo}
            });
            console.log(storedToken.deviceInfo, "\n", deviceInfo)
            if (!storedToken) {
                throw new Error("Refresh token не найден.");
            }

            if (storedToken.expiresAt < new Date()) {
                throw new Error("Вас давно не было, авторизуйтесь заново");
            }

            if (storedToken.deviceInfo !== deviceInfo) {
                throw new Error("Устройство не совпадает.");
            }

            const newTokens = this.generateAuthTokens(userId);

            await this.saveRefreshToken(userId, newTokens.refreshToken, deviceInfo);

            return newTokens;
        } catch (error) {
            throw new Error("Токен невалиден или истек срок его действия");
        }
    }

    async deleteRefreshToken(refreshToken, deviceInfo) {
        try {
            const userData = this.verifyRefreshToken(refreshToken);
            const userId = userData.id;

            await client.token.delete({
                where: {
                    userId: userId,
                    token: refreshToken,
                    deviceInfo: deviceInfo
                }
            });
        } catch (error) {
            console.error('Error deleting refresh token:', error);
            throw new Error("Failed to delete refresh token");
        }
    }

    // Функция для проверки валидности access token
    verifyAccessToken(accessToken) {
        try {
            const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
            return decoded; // Возвращаем декодированные данные, если токен валиден
        } catch (error) {
            throw new Error("Access token невалиден или истек");
        }
    }

    // Функция для проверки валидности refresh token
    verifyRefreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            return decoded; // Возвращаем декодированные данные, если токен валиден
        } catch (error) {
            throw new Error("Refresh token невалиден или истек");
        }
    }
}

export const tokenService = new TokenService();