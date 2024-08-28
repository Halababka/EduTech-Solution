import type {RouteParamValue} from "vue-router";
import {useCourses} from "~/composables/course";

const runtimeConfig = useRuntimeConfig();

export const saveCourse = async (courseData) => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${useCookie("token").value}`
      },
      body: JSON.stringify(courseData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {status: response.status, message: errorData.error || 'Failed create course'};
    }

    useCourses(true)
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving course:', error);
    throw error;
  }
};

export const fetchCourse = async (idCourse: any) => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/courses/${idCourse}`, {
      method: 'GET',
      headers: {
        'Authorization': `${useCookie("token").value}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {status: response.status, message: errorData.error || 'Failed fetch course'};
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetch course:', error);
    throw error;
  }
}

export const fetchCourses = async () => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/courses`, {
      method: 'GET',
      headers: {
        'Authorization': `${useCookie("token").value}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {status: response.status, message: errorData.error || 'Failed fetch course'};
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetch course:', error);
    throw error;
  }
}

export const deleteCourses = async (ids: number[]) => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/courses`, {
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

export const updateCourse = async (courseId, courseData) => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/courses/${courseId}`, {
      method: "PUT",
      headers: {
        'Authorization': `${useCookie('token').value}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(courseData)
    });

    if (!response.ok) {
      throw new Error('Failed to update course');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting Categories:', error);
    throw error;
  }
};