const runtimeConfig = useRuntimeConfig()
export const fetchUsers = async () => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/users`, {
      headers: {
        Authorization: `${useCookie("token").value}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const createUser = async (userData: object) => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${useCookie("token").value}`
      },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/users/${userId}/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${useCookie("token").value}`
      },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
    const updatedUser = await response.json();
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUsers = async (selectedUserIds: number[]) => {
  try {
    console.log(typeof(selectedUserIds))
    console.log(selectedUserIds)
    const response = await fetch(`${runtimeConfig.public.apiBase}/users`, {
      method: "DELETE",
      headers: {
        Authorization: `${useCookie("token").value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "userIds": selectedUserIds
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to delete users');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting users:', error);
    throw error;
  }
};

export const resetPassword = async (currentPassword, newPassword) => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/users/reset-password`, {
      method: 'PUT',
      headers: {
        Authorization: `${useCookie("token").value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({currentPassword, newPassword}),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw {status: response.status, message: errorData.error || 'Failed to change password'};
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error change password:', error);
    throw error;
  }
};

