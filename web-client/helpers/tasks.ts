const runtimeConfig = useRuntimeConfig();

export const getAllTasksOnCourse = async (courseId: any) => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/tasks/${courseId}`, {
      headers: {
        'Authorization': `${useCookie('token').value}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get tasks');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export const sendAnswer = async (idAnswer: number | null, taskId: number, files: any[]) => {
  try {
    const url = idAnswer
      ? `${runtimeConfig.public.apiBase}/tasks/answers/${idAnswer}`
      : `${runtimeConfig.public.apiBase}/tasks/answers`;
    const method = idAnswer ? 'PUT' : 'POST';

    const body = {
      taskId,
      materials: files.map(file => ({id: file.id}))
    };

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `${useCookie('token').value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send answer');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Функция для получения всех ответов
export const getAllAnswers = async () => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/tasks/answers/all`, {
      headers: {
        'Authorization': `${useCookie('token').value}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch answers');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching answers:', error);
    throw error;
  }
};

// Функция для выставления оценки ответу
export const gradeAnswer = async (answerId: number, grade: number) => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/tasks/answers/grade`, {
      method: 'PUT',
      headers: {
        'Authorization': `${useCookie('token').value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({answerId, grade}),
    });
    if (!response.ok) {
      throw new Error('Failed to grade answer');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error grading answer:', error);
    throw error;
  }
};