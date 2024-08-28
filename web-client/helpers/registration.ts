import {useBaseFetch} from "~/composables/fetch";

const runtimeConfig = useRuntimeConfig();

export const registerOnLink = async (userData: object, token: string) => {
  try {
    const response = await useBaseFetch(`/registration?token=${token}`, {
      method: "POST",
      body: JSON.stringify({userData})
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {status: response.status, message: errorData.error || 'Failed to register User'};
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error register User:', error);
    throw error;
  }
};

export const getAllRegistrationLinks = async () => {
  try {
    const response = await useBaseFetch(`/registration/links`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw { status: response.status, message: errorData.error || 'Failed to fetch registration links' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching registration links:', error);
    throw error;
  }
};

export const createRegistrationLink = async (linkData: object) => {
  try {
    const response = await useBaseFetch(`/registration/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(linkData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw { status: response.status, message: errorData.error || 'Failed to create registration link' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating registration link:', error);
    throw error;
  }
};

export const deleteRegistrationLinks = async (ids: (number | undefined)[]) => {
  try {
    const response = await useBaseFetch(`/registration/links`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw { status: response.status, message: errorData.error || 'Failed to delete registration links' };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting registration links:', error);
    throw error;
  }
};
