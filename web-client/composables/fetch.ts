export const useBaseFetch = async (url: string, options: { [key: string]: any; } = {}, skipAuth = false): Promise<Response> => {
    const config = useRuntimeConfig();
    let base = config.public.apiBase;

    // Проверка, что options.headers существует
    if (!options.headers) {
        options.headers = {};
    }

    const auth = await useAuth();

    // Если skipAuth = false, добавляем токен в заголовки
    if (!skipAuth) {
        options.headers.Authorization = auth.value.token;
    }

    try {
        // Выполняем первоначальный запрос
        let response = await fetch(`${base}${url}`, options);

        // Если ответ имеет статус 401 (Unauthorized), делаем запрос на обновление токена
        if (response.status === 401 && !skipAuth) {
            const refreshResponse = await fetch(`${base}/refresh`, {
                method: "POST",
                credentials: "include", // Включаем куки для отправки токена
            });

            // Если обновление токена прошло успешно, повторяем оригинальный запрос
            if (refreshResponse.ok) {
                // Получаем новый accessToken из ответа
                const { accessToken } = await refreshResponse.json();

                // Обновляем cookie accessToken
                await useAuth(accessToken);

                // Обновляем заголовок авторизации в options
                options.headers.Authorization = accessToken;

                // Повторяем оригинальный запрос с новым accessToken
                response = await fetch(`${base}${url}`, options);
            } else {
                // Если обновление токена не удалось (403), перенаправляем на страницу входа
                if (refreshResponse.status === 403) {
                    window.location.href = "/";
                    // @ts-ignore
                    return;
                }
            }
        }

        // Если статус ответа не 200-299, выбрасываем ошибку
        if (!response.ok) {
            throw new Error(`Fetch error: ${response.statusText}`);
        }

        return response;
    } catch (error) {
        throw error;
    }
};
