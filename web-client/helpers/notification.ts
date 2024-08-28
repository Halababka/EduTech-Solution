const runtimeConfig = useRuntimeConfig()

export const markNotificationsAsRead = async (notificationIds: number[]) => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiNotification}/notifications/mark-read`, {
      method: "PUT",
      body: JSON.stringify({
        notificationIds: notificationIds
      })
    });
    if (!response.ok) {
      throw new Error('Failed to read notifications');
    }

    // useNotification(true)
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error reading notifications:', error);
    throw error;
  }
};

