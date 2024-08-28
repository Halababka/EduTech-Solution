const runtimeConfig = useRuntimeConfig()

export const fetchRoles = async () => {
    try {
        const response = await fetch(`${runtimeConfig.public.apiBase}/roles`, {
            headers: {
                'Authorization': `${useCookie("token").value}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch roles');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching roles:', error);
        throw error;
    }
}

export const createRole = async (role) => {
    try {
        const response = await fetch(`${runtimeConfig.public.apiBase}/roles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${useCookie("token").value}`
            },
            body: JSON.stringify(role)
        });

        if (!response.ok) {
            throw new Error('Failed to create role');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating role:', error);
        throw error;
    }
};

export const deleteRoles = async (roleIds) => {
    try {
        const response = await fetch(`${runtimeConfig.public.apiBase}/roles`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${useCookie("token").value}`
            },
            body: JSON.stringify({ ids: roleIds })
        });

        if (!response.ok) {
            throw new Error('Failed to delete roles');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting roles:', error);
        throw error;
    }
};

export const updateRole = async (roleId, role) => {
    try {
        const response = await fetch(`${runtimeConfig.public.apiBase}/roles/${roleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${useCookie("token").value}`
            },
            body: JSON.stringify(role)
        });

        if (!response.ok) {
            throw new Error('Failed to update role');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating role:', error);
        throw error;
    }
};

export const addPermissionsToRole = async (roleId, permissionIds) => {
    try {
        const response = await fetch(`${runtimeConfig.public.apiBase}/roles/${roleId}/permissions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${useCookie("token").value}`
            },
            body: JSON.stringify({ ids: permissionIds })
        });

        if (!response.ok) {
            throw new Error('Failed to add permissions to role');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error adding permissions to role:', error);
        throw error;
    }
};

export const deleteRolePermission = async (roleId, permissionIds) => {
    try {
        const response = await fetch(`${runtimeConfig.public.apiBase}/roles/${roleId}/permissions`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${useCookie("token").value}`
            },
            body: JSON.stringify({ ids: permissionIds })
        });

        if (!response.ok) {
            throw new Error('Failed to delete role permissions');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting role permissions:', error);
        throw error;
    }
};