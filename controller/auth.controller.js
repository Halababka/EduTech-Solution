import { authService } from "../service/auth.service.js";
import { userService } from "../service/user.service.js";
import { tokenService } from "../service/token.service.js";
import { nanoid } from "nanoid";
import { getDeviceInfo } from "../service/device.service.js";

export class AuthController {

    async auth(req, res) {
        const {username, password} = req.body;
        const deviceInfo = getDeviceInfo(req);

        try {
            const tokens = await authService.authenticate(username, password, deviceInfo);

            res.cookie("deviceId", deviceInfo, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
            }); // Устанавливаем новый идентификатор устройства в cookies
            res.cookie("refreshToken", tokens.refreshToken, {
                httpOnly: true,
                // secure: true, // Только по HTTPS
                sameSite: "strict",
                // path: '/refresh-token', // Путь, по которому доступен рефреш токен
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
            });
            res.json(tokens);
        } catch (error) {
            res.status(400).json({error: error.message});
        }
    }

    async register(req, res) {
        const {first_name, middle_name, last_name, username, password, about} = req.body;

        try {
            authService.validateCredentials(username, password);
            authService.validatePasswordStrength(password);

            if (await userService.isUsernameExist(username)) {
                res.status(409).json({error: "Данный username уже занят"});
                return;
            }

            const encryptedPassword = await authService.hashPassword(password);

            const newUser = await userService.createUser({
                first_name,
                middle_name,
                last_name,
                username,
                password: encryptedPassword,
                about
            });

            res.json(newUser);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

    async refreshToken(req, res) {
        const refreshToken = req.cookies.refreshToken;
        const deviceInfo = getDeviceInfo(req);

        try {
            const tokens = await tokenService.refreshTokens(refreshToken, deviceInfo);

            res.cookie("deviceId", deviceInfo, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
            }); // Обновляем идентификатор устройства в cookies
            res.cookie("refreshToken", tokens.refreshToken, {
                httpOnly: true,
                // secure: true, // Только по HTTPS
                sameSite: "strict",
                // path: '/refresh-token', // Путь, по которому доступен рефреш токен
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
            });
            res.json(tokens);
        } catch (error) {
            res.status(403).json({error: error.message});
        }
    }

    async logout(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            const deviceInfo = getDeviceInfo(req);

            // Проверка на наличие рефреш токена
            if (!refreshToken) {
                return res.status(204).send(); // Нет токена, нет операции
            }

            // Удаляем токен из базы данных
            await tokenService.deleteRefreshToken(refreshToken, deviceInfo);

            // Очищаем куки
            res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
            res.clearCookie('deviceId', { httpOnly: true });

            res.status(200).send({ message: 'Successfully logged out' });
        } catch (error) {
            console.error('Error during logout:', error);
            res.status(500).send({ error: 'Logout failed' });
        }
    }
}
