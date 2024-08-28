import { useState } from "#app";
import { disconnectNotificationSocket } from "~/utils/notificationSocket";
import { refreshAccessToken } from "~/utils/fetchWithTokenRefresh ";
import { logoutFetch } from "~/services/authService";

const runtimeConfig = useRuntimeConfig();
export const useUser = async (force = false) => {
    const user = useState("user", () => {
    });

    if (!user.value || force) {
        user.value = await initUser();
    }

    return user;
};

export const initUser = async () => {

    const user = {
        userData: [],
        pending: [],
        error: [],
        refresh: []
    };

    if (useCookie("token").value) {
        try {
            const {
                data: userData,
                pending,
                error,
                refresh
            } = await useFetch(`${runtimeConfig.public.apiBase}/me`, {
                onRequest({request, options}) {
                    options.headers = options.headers || {};
                    options.headers.authorization = useCookie("token").value;
                },
                async onResponseError({request, response, options}) {
                    if (response.status === 401) {
                        await refreshAccessToken()
                        return initUser()
                    }
                }
            });
            console.log("Сработала запрос на сервер user")
            user.userData = userData;
            user.pending = pending;
            user.error = error;
            user.refresh = refresh;

        } catch (err) {
            console.error(err);
        }
    }

    return user;
};


export async function logout() {
    try {
        await logoutFetch()
    } catch {

    }

    localStorage.clear();
    await useAuth("none")
    useCookie("token").value = null;
    disconnectNotificationSocket()

    return navigateTo('/')
}