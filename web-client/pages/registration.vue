<script setup>
import AwButton from "~/components/ui-kit/AwButton.vue";
import {registerOnLink} from "~/helpers/registration";

definePageMeta({layout: 'default'})
useHead({
  title: 'Регистрация'
})

const router = useRouter();
const errorPanel = ref(false)
const errorText = ref('')
const loading = ref(false);
const userData = ref({
  first_name: '',
  last_name: '',
  middle_name: '',
  username: '',
  email: '',
  password: ''
});
const confirmPassword = ref('');
const token = ref('');

// Проверяем наличие токена в query параметрах
if (router.currentRoute.value.query.token) {
  token.value = router.currentRoute.value.query.token;
}
const register = async () => {
  // Проверяем, совпадают ли пароли
  if (userData.value.password !== confirmPassword.value) {
    errorText.value = 'Пароли не совпадают'; // Присваиваем текст сообщения из ответа
    errorPanel.value = true; // Показываем блок с ошибкой
    return;
  }

  // Проверяем соответствие пароля требованиям
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{7,}$/;
  if (!passwordRegex.test(userData.value.password)) {
    errorText.value = 'Пароль должен содержать как минимум 1 специальный символ, маленькие и большие буквы латинского алфавита, 1 цифру, и быть длиннее 7 символов'
    errorPanel.value = true;
    return;
  }

  // Отправляем данные на сервер для регистрации
  loading.value = true;
  try {
    await registerOnLink(userData.value, token.value);
    useCookie('token').value = null
    await router.push('/');
  } catch (error) {
    console.error('Error register User:', error);
    // Устанавливаем текст ошибки в зависимости от статуса
    if (error.status) {
      switch (error.status) {
        case 400:
          errorText.value = 'Некорректные данные пользователя';
          break;
        case 404:
          errorText.value = 'Ссылка для регистрации не найдена или истекла';
          break;
        case 500:
        default:
          errorText.value = 'Внутренняя ошибка сервера';
      }
    } else {
      errorText.value = 'Произошла неизвестная ошибка';
    }
    errorPanel.value = true;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="main-content">
    <div class="register-form">
      <h1 class="logo-text">EduTech <br/> <span class="text-3xl">solution</span></h1>
      <form class="form" @submit.prevent="register">
        <h2>Регистрация</h2>
        <div autofocus
             v-if="errorPanel"
             class="error-block"
             v-bind:style="[errorPanel ? { opacity: 1, padding: '16px'} : { opacity: 0 }]">
          <span>{{ errorText }}</span>
        </div>
        <div class="flex flex-wrap gap-3">
          <div class="input-group flex-1">
            <label for="first_name">Имя</label>
            <input class="inpt" type="text" id="first_name" v-model="userData.first_name">
          </div>
          <div class="input-group flex-1">
            <label for="last_name">Фамилия</label>
            <input class="inpt" type="text" id="last_name" v-model="userData.last_name">
          </div>
          <div class="input-group flex-1">
            <label for="middle_name">Отчество</label>
            <input class="inpt" type="text" id="middle_name" v-model="userData.middle_name">
          </div>
        </div>
        <div class="input-group">
          <label for="email">Email</label>
          <input class="inpt" type="email" id="email" v-model="userData.email" required>
        </div>
        <div class="input-group">
          <label for="username">Логин</label>
          <input class="inpt" type="text" id="username" v-model="userData.username" required>
        </div>
        <div class="input-group">
          <label for="password">Пароль</label>
          <Password id="password" pt:input:root:class="inpt w-full" v-model="userData.password" :feedback="true"
                    required
                    :weakLabel="'Слабый'" :mediumLabel="'Средний'" :strongLabel="'Сильный'"
                    promptLabel="Введите пароль" toggleMask/>
        </div>
        <div class="input-group">
          <label for="confirmPassword">Подтвердите пароль</label>
          <Password id="confirmPassword" pt:input:root:class="inpt w-full" v-model="confirmPassword" required
                    :feedback="false" toggleMask variant="filled"/>
        </div>
        <AwButton class="btn">Зарегистрироваться</AwButton>
      </form>
    </div>
  </div>
  <TheLoader v-if="loading"></TheLoader>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.wrapper {
  width: 100vw;
  height: 100vh;
  @include theme('background', $general-background);
}

.main-content {
  padding: 50px;
}

@media (max-width: 667px) {
  .main-content {
    padding: 5px !important;
  }
  .register-form {
    border-radius: 15px;
    width: 100%;
  }
}

.register-form {
  width: 100%
}

@media (max-width: 1180px) {
  .main-content {
    padding: 50px;
  }
  .register-form {
    width: 100%;
  }
}
</style>