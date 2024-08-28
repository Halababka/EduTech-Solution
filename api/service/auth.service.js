import bcrypt from 'bcrypt';
import { tokenService } from "./token.service.js";
import { client } from '../db.js';
import { userService } from './user.service.js';

const saltRounds = 10;

class AuthService {
    async comparePasswords(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    async hashPassword(password) {
        return await bcrypt.hash(password, saltRounds);
    }

    async updateLastLogin(userId) {
        return await client.user.update({
            where: { id: userId },
            data: { lastLogin: new Date() },
        });
    }

    validateCredentials(username, password) {
        if (!username || !password) {
            throw new Error('Логин или пароль не может быть пустым');
        }
    }

    validatePasswordStrength(password) {
        // Убираем пробелы в начале и конце строки
        const trimmedPassword = password.trim();

        // Проверяем, не изменился ли пароль после обрезки (наличие пробелов в начале/конце строки)
        if (trimmedPassword.length !== password.length) {
            throw new Error('Пароль не должен содержать пробелы в начале или конце строки.');
        }

        // Дополнительно можно проверять невидимые символы
        if (/[\u200B-\u200D\uFEFF]/.test(password)) {
            throw new Error('Пароль содержит невидимые символы, которые не допускаются.');
        }

        // Стандартная проверка пароля на сложность
        const isStrongPassword = validator.isStrongPassword(trimmedPassword, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        });

        if (!isStrongPassword) {
            throw new Error('Пароль должен быть не менее 8 символов и содержать как минимум одну заглавную букву, одну строчную букву, одну цифру и один специальный символ.');
        }
    }

    async authenticate(username, password, deviceInfo) {
        this.validateCredentials(username, password);

        const user = await userService.findUserByUsername(username);

        if (user && await this.comparePasswords(password, user.password)) {
            await this.updateLastLogin(user.id);
            const tokens = tokenService.generateAuthTokens(user.id);
            await tokenService.saveRefreshToken(user.id, tokens.refreshToken, deviceInfo);
            return tokens
        }

        throw new Error('Неверное имя пользователя или пароль');
    }
}

export const authService = new AuthService();
