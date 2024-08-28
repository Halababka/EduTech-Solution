import {formatDate} from "~/helpers/date";
import {useBaseFetch} from "~/composables/fetch";

interface Group {
  id: string;
  full_name: string;
  abbreviation: string;
  users?: object;
  created_at?: string;
  updated_at?: string;
}

const runtimeConfig = useRuntimeConfig();

export const getGroupFullNames = (groups: Group[]) => {
  return groups.map(group => group.abbreviation).join(', ');
};

export const fetchGroups = async (): Promise<Group[]> => {
  try {
    const response = await useBaseFetch(`/groups`);

    if (!response.ok) {
      throw new Error('Failed to fetch groups');
    }

    const data: Group[] = await response.json();

    return data;
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
};

export const fetchGroupsWithUsers = async (): Promise<Group[]> => {
  try {
    const response = await useBaseFetch(`/groups/allUsers`);

    if (!response.ok) {
      throw new Error('Failed to fetch groups with users');
    }

    const data: Group[] = await response.json();

    return data;
  } catch (error) {
    console.error('Error fetching groups with users:', error);
    throw error;
  }
};

export const createGroup = async (groupData: Group): Promise<Group> => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${useCookie("token").value}`
      },
      body: JSON.stringify(groupData)
    });

    if (!response.ok) {
      throw new Error('Failed to create group');
    }

    const data: Group = await response.json();
    data.created_at = formatDate(data.created_at);
    data.updated_at = formatDate(data.updated_at);

    return data;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

export const updateGroup = async (groupId: number, groupData: Group): Promise<Group> => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/groups/${groupId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${useCookie("token").value}`
      },
      body: JSON.stringify(groupData)
    });
    if (!response.ok) {
      throw new Error('Failed to update group');
    }

    const updatedUser: Group = await response.json();
    console.log(updatedUser)
    return updatedUser;
  } catch (error) {
    console.error('Error updating group:', error);
    throw error;
  }
};

export const deleteGroups = async (selectedGroupsIds: number[]): Promise<any> => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/groups`, {
      method: "DELETE",
      headers: {
        Authorization: `${useCookie("token").value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "groupIds": selectedGroupsIds
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to delete groups');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting groups:', error);
    throw error;
  }
}

export const deleteGroupUser = async (groupId: number, userIds: number[]): Promise<any> => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/groups/${groupId}/users/`, {
      method: "DELETE",
      headers: {
        Authorization: `${useCookie("token").value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "userIds": userIds
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to delete users in group');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting users in group:', error);
    throw error;
  }
}

export const addUsersToGroup = async (groupId: number, userIds: number[]): Promise<any> => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/groups/${groupId}/users`, {
      method: 'POST',
      headers: {
        Authorization: `${useCookie('token').value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userIds,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add users to group');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding users to group:', error);
    throw error;
  }
};

export const formatGroups = (objs) => {
  objs.forEach(obj => {
    obj.groups = obj.groups.map(group => group.full_name).join(', ');
  });
  return objs;
};