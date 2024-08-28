const runtimeConfig = useRuntimeConfig()

export const getPermissionsFullNames = (permissions: object[]) => {
  return permissions.map(perm => perm.name).join(', ');
};

export const fetchPermissions = async () => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/permissions`, {
      headers: {
        'Authorization': `${useCookie("token").value}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch permissions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw error;
  }
};