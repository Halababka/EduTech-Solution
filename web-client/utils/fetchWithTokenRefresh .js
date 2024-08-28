const runtimeConfig = useRuntimeConfig();

export async function refreshAccessToken() {
    try {
        // Запрос на обновление токена
        const response = await fetch(`${runtimeConfig.public.apiBase}/refresh`, {
            method: 'POST',
            credentials: 'include', // Включает cookies в запрос
        });

        // Проверяем, успешно ли обновлен токен
        if (response.ok) {
            // Получаем новый accessToken из ответа
            const { accessToken } = await response.json();

            // Обновляем cookie с новым accessToken
            await useAuth(accessToken);

            return { success: true };
        } else {
            // Если обновление токена не удалось (403), перенаправляем на страницу входа
            if (response.status === 403) {
                window.location.href = '/';
            }
            throw new Error('Failed to refresh token');
        }
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw error;
    }
}