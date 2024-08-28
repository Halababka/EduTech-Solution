<script setup>
import { login } from "~/services/authService";
import AwButton from "~/components/ui-kit/AwButton.vue";
import { useUser } from "~/composables/user";
import { useNotification } from "~/composables/useNotification";

definePageMeta({layout: "default"});
useHead({
  title: "Авторизация"
});

const router = useRouter();
const error = ref(false);
const errorText = ref("");
const username = ref("");
const password = ref("");
const loading = ref(false);

async function auth() {
  loading.value = true;
  try {
    const response = await login(username.value, password.value);
    switch (response.status) {
      case 200:
        console.log("Вы авторизованы");
        break;
      case 400:
        const data = await response.json();
        errorText.value = data.error; // Присваиваем текст сообщения из ответа
        error.value = true; // Показываем блок с ошибкой
        break;
    }
    const data = await response.json();
    if (data["accessToken"]) {
      await useAuth(data["accessToken"])
      await useUser(true);
      useNotification(true);
      await navigateTo("/home");
    }
  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false;
  }
}
const runtimeConfig = useRuntimeConfig();
</script>

<template>
  <div class="main-content">
    <div class="auth-form">
      <h1 class="logo-text">EduTech <br/> <span class="text-3xl">solution</span></h1>
      <form class="form" v-on:submit.prevent="auth">
        <h2>Вход</h2>
        <div autofocus
             v-if="error"
             class="error-block"
             v-bind:style="[error ? { opacity: 1, padding: '16px'} : { opacity: 0 }]">
          <span>{{ errorText }}</span>
        </div>
        <div class="input-group">
          <div class="input-form">
            <label for="username">Электронная почта</label>
            <input class="inpt" id="username" type="text" placeholder="Логин" v-model="username" required>
          </div>
          <div class="input-form">
            <label style="float: left" for="password">Пароль</label>
            <!--          <a href="#" class="forget" style="float: right">Забыли пароль?</a>-->
            <Password id="password" pt:input:root:class="inpt w-full" v-model="password" required
                      :feedback="false" toggleMask variant="filled" autocomplete="on"
                      placeholder="Введите пароль"/>
          </div>
        </div>
        <AwButton class="btn">Войти</AwButton>
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
  .auth-form {
    border-radius: 15px;
    width: 100%;
  }
}

@media (max-width: 1180px) {
  .main-content {
    padding: 50px;
  }
  .auth-form {
    width: 100%;
  }
}
</style>