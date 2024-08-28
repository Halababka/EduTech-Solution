import { useState } from "#app";
import { useUser } from "~/composables/user";

const runtimeConfig = useRuntimeConfig();
export const useNotification = async (force = false) => {
    const notification = useState("notification", () => {
    });

    if (!notification.value || force) {
        notification.value = await getNotificationOnUser();
    }

    return notification;
};

export const getNotificationOnUser = async () => {
    const { value: user } = await useUser();
    const notification = {
        notificationData: [{
            "id": null,
            "recipient_id": null,
            "message": null,
            "is_read": null,
            "created_at": null
        }],
        pending: [],
        error: [],
        refresh: []
    };

    if (useCookie("token").value) {
        try {
            const {
                data: notificationData,
                pending,
                error,
                refresh
            } = useFetch(`${runtimeConfig.public.apiNotification}/notifications/${user.userData.id}`, {
                onRequest({request, options}) {
                    options.headers = options.headers || {};
                }
            });
            console.log("Сработала запрос на сервер notification", notificationData)
            notification.notificationData = notificationData;
            notification.pending = pending;
            notification.error = error;
            notification.refresh = refresh;

        } catch (err) {
            console.error(err);
        }
    }

    return notification;
};