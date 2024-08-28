import {disconnectNotificationSocket} from "~/utils/notificationSocket";

const runtimeConfig = useRuntimeConfig()

export async function login(username: string, password: string) {
  try {
    return await fetch(`${runtimeConfig.public.apiBase}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: 'include',
      body: JSON.stringify({
        username: username,
        password: password
      })
    })
  } catch (error) {
    console.log(error)
  }
}

export async function logoutFetch() {
  try {
    // Отправляем запрос на сервер для удаления рефреш токена
    await fetch(`${runtimeConfig.public.apiBase}/logout`, {
      method: 'POST',
      credentials: 'include', // Включаем куки для отправки токена
    });
  } catch (error) {
    console.error('Error during logout:', error);
  }
}
