import {useBaseFetch} from "~/composables/fetch";

const runtimeConfig = useRuntimeConfig();

export const fetchCategories = async () => {
  try {
    const response = await useBaseFetch(`${runtimeConfig.public.apiBase}/categories`, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {status: response.status, message: errorData.error || 'Failed fetch Categories'};
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetch Categories:', error);
    throw error;
  }
}

export const createCategorie = async (names: string[]) => {
  try {
    const response = await useBaseFetch(`${runtimeConfig.public.apiBase}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({names: names})
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {status: response.status, message: errorData.error || 'Failed create Categories'};
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error create Categories:', error);
    throw error;
  }
}

export const updateCategorie = async (ids: number[], name: string) => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/categories`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${useCookie("token").value}`
      },
      body: JSON.stringify({
        ids: ids,
        name: name
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw {status: response.status, message: errorData.error || 'Failed update Categories'};
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating Categories:', error);
    throw error;
  }
};

export const deleteCategories = async (ids: number[]) => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/categories`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${useCookie("token").value}`,
      },
      body: JSON.stringify({
        "ids": ids
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to delete Categories');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting Categories:', error);
    throw error;
  }
}