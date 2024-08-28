<script setup>
import Papa from 'papaparse';

definePageMeta({
  layout: 'home',
  middleware: [
    'admin'
  ]
})
useHead({
  title: 'Админ панель'
})

const runtimeConfig = useRuntimeConfig()
const token = useCookie('token')

// Логика CRUD операций с группами
const groups = ref([])
const newGroupName = ref('')

const addGroup = () => {
  // Логика добавления новой группы
}

const deleteGroup = (groupId) => {
  // Логика удаления группы по идентификатору
}

// Логика CRUD операций с пользователями
const users = ref([])
const newUserName = ref('')
const isDragging = ref(false);

const addUser = async () => {
  try {
    // Отправка запроса на сервер для добавления пользователя
    const response = await fetch(`${runtimeConfig.apiUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      },
      body: JSON.stringify({name: newUserName.value})
    })
    if (!response.ok) {
      throw new Error('Failed to add user')
    }
    const data = await response.json()
    users.value.push(data)
    newUserName.value = ''
  } catch (error) {
    console.error('Error adding user:', error)
  }
}

const deleteUser = async (userId) => {
  try {
    // Отправка запроса на сервер для удаления пользователя
    const response = await fetch(`${runtimeConfig.apiUrl}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    if (!response.ok) {
      throw new Error('Failed to delete user')
    }
    users.value = users.value.filter(user => user.id !== userId)
  } catch (error) {
    console.error('Error deleting user:', error)
  }
}

// Импорт данных из CSV файла для регистрации пользователей
const importUsersFromCSV = async (file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch(`${runtimeConfig.apiUrl}/users/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body: formData
    })
    if (!response.ok) {
      throw new Error('Failed to import users from CSV')
    }
    // Обновление списка пользователей после импорта
    users.value = await response.json()
  } catch (error) {
    console.error('Error importing users from CSV:', error)
  }
}
// Определение переменной для хранения данных из CSV файла
const csvData = ref([]);

// Функция для обработки загруженного CSV файла
const handleImportSuccess = (data) => {
  csvData.value = data;
};

// Функция для обработки ошибок при импорте CSV файла
const handleImportError = (error) => {
  console.error('Error importing CSV file:', error);
};

// Определение функции для парсинга CSV файла
const parseCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (result) => {
        resolve(result.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
// Функция для обработки события dragover
const handleDragOver = (event) => {
  event.preventDefault();
  isDragging.value = true;
};

// Функция для обработки события drop и загрузки CSV файла
const handleDrop = async (event) => {
  event.preventDefault();
  isDragging.value = false; // Убираем подсветку при drop
  const file = event.dataTransfer?.files[0];
  if (!file) return;
  try {
    // Парсинг CSV файла
    const data = await parseCSVFile(file);
    // Обработка успешного парсинга
    handleImportSuccess(data);
  } catch (error) {
    // Обработка ошибок при парсинге
    handleImportError(error);
  }
};

// Функция для обработки события dragleave
const handleDragLeave = () => {
  isDragging.value = false; // Убираем подсветку при выходе из области drop
};

// Функция для обработки события dragend
const handleDragEnd = () => {
  isDragging.value = false; // Убираем подсветку при окончании перетаскивания
};
// const csvData = ref([]);
//
// const handleFileUpload = (event) => {
//   const file = event.target.files[0];
//
//   Papa.parse(file, {
//     header: true,
//     dynamicTyping: true,
//     complete: (results) => {
//       csvData.value = results.data;
//     },
//     error: (error) => {
//       console.error('Error parsing CSV:', error);
//     }
//   });
// };
</script>

<template>
  <div class="main-content adminPanel" @dragover.prevent="handleDragOver" @drop.prevent="handleDrop">
    <h1 class="text-3xl font-bold mb-4">Админ панель</h1>
    <div class="overlay" :class="{ active: isDragging }"></div>
    <!-- CRUD операции с группами -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-2">Группы</h2>
      <!-- Форма добавления группы -->
      <div class="mb-4">
        <h3 class="text-lg font-medium mb-2">Добавить группу</h3>
        <form @submit.prevent="addGroup">
          <div class="flex items-center mb-2">
            <label for="groupName" class="mr-2">Название:</label>
            <input type="text" id="groupName" v-model="newGroupName"
                   class="rounded-md border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
          </div>
          <button type="submit" class="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600">Добавить
          </button>
        </form>
      </div>

      <!-- Список групп -->
      <div>
        <h3 class="text-lg font-medium mb-2">Список групп</h3>
        <ul>
          <li v-for="group in groups" :key="group.id" class="mb-2">
            {{ group.name }}
            <button @click="deleteGroup(group.id)"
                    class="ml-2 px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600">Удалить
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- CRUD операции с пользователями -->
    <div>
      <h2 class="text-xl font-semibold mb-2">Пользователи</h2>
      <!-- Форма добавления пользователя -->
      <div class="mb-4">
        <h3 class="text-lg font-medium mb-2">Добавить пользователя</h3>
        <form @submit.prevent="addUser">
          <div class="flex items-center mb-2">
            <label for="userName" class="mr-2">Имя:</label>
            <input type="text" id="userName" v-model="newUserName"
                   class="rounded-md border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
          </div>
          <!-- Другие поля для добавления пользователя -->
          <button type="submit" class="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600">Добавить
          </button>
        </form>
      </div>

      <!-- Список пользователей -->
      <div>
        <h3 class="text-lg font-medium mb-2">Список пользователей</h3>
        <ul>
          <li v-for="user in users" :key="user.id" class="mb-2">
            {{ user.name }}
            <button @click="deleteUser(user.id)"
                    class="ml-2 px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600">Удалить
            </button>
          </li>
        </ul>
      </div>
      <div class="csv-dropzone" :class="{ highlighted: isDragging }">
        <h2>Импорт пользователей из CSV</h2>
        <div class="drop-zone"
             @dragover.prevent="handleDragOver"
             @drop.prevent="handleDrop"
             @dragleave="handleDragLeave"
             @dragend="handleDragEnd"><!-- Добавляем обработчик для события dragend -->>
          Перетащите файл сюда или нажмите для выбора
        </div>
      </div>
      <div class="csv-data" v-if="csvData.length > 0">
        <h2>Данные из CSV файла:</h2>
        <ul>
          <li v-for="(row, index) in csvData" :key="index">
          <span v-for="(value, key) in row" :key="key">
            {{ key }}: {{ value }}
          </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.drop-zone {
  border: 2px dashed #ccc;
  padding: 20px;
  text-align: center;
  cursor: pointer;
}

.csv-dropzone {
  border: 2px dashed transparent;
  padding: 20px;
  transition: border-color 0.3s ease;
}

.csv-dropzone.highlighted {
  border-color: #4CAF50; // Зеленая рамка при перетаскивании файла
}

.form {
  @include theme('background', $general-background-light);
  padding: 15px;
  border-radius: 15px;
}

.adminPanel {
  flex-wrap: wrap;
}

.field {
  display: flex;
  align-items: center;
  gap: 0 10px;
  flex-wrap: wrap;
}

.course-table {
  display: flex;
}

.course-table > div {
  @include theme('border', $primary-color, true, '1px solid');
  padding: 5px;
  margin: 5px;
  border-radius: 10px;
}

.course-card {
  cursor: pointer;
  padding: 10px;
  margin: 10px 0;
  border-radius: 5px;
  @include theme('background', $general-background);
}
</style>