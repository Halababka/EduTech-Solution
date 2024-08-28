<script setup lang="ts">
import {useUser} from "~/composables/user";
import {formatDate} from "~/helpers/date";
import AwButton from "~/components/ui-kit/AwButton.vue";
import {updateUser, resetPassword} from "~/helpers/user";
import {registerOnLink} from "~/helpers/registration";

definePageMeta({layout: 'home'})

useHead({
  title: 'Профиль'
})

const {$toast} = useNuxtApp()
const user = (await useUser()).value
const token = useCookie('token')
const userData = ref({})
const loading = ref(false);
const changePwd = ref(false)
const errorPanel = ref(false)
const errorText = ref('')
const passwordData = ref({
  password: '',
  newPassword: ''
})
const submitted = ref(false)

watchEffect(() => {
  if (!user.pending) {
    userData.value = Object.assign({}, user.userData);
  }
})

const hideDialogPwd = () => {
  passwordData.value.password = ''
  passwordData.value.newPassword = ''
  changePwd.value = false;
  submitted.value = false;
};

const updateProfile = async () => {
  try {
    loading.value = true
    delete userData.value.password
    delete userData.value.permissions
    await updateUser(userData.value.id, userData.value);
    await useUser(true)
    $toast.add({severity: 'success', summary: 'Успешно', detail: 'Данные обновлены', life: 5000});
  } catch (error) {
    console.error('Error updating profile:', error);
  } finally {
    loading.value = false
  }
};

const changePassword = async () => {
  submitted.value = true

  if (passwordData.value.password && passwordData.value.newPassword) {
    console.log(passwordData.value.password, user.userData.password)
    loading.value = true
    try {
      if(passwordData.value.password === passwordData.value.newPassword) {
        errorText.value = 'Новый пароль должен отличаться от текущего';
        errorPanel.value = true;
        return
      }
      await resetPassword(passwordData.value.password, passwordData.value.newPassword)
      errorText.value = ''
      errorPanel.value = false;
      $toast.add({severity: 'success', summary: 'Успешно', detail: 'Пароль обновлен', life: 5000});
    } catch (error) {
      console.error('Error change password:', error);
      // Устанавливаем текст ошибки в зависимости от статуса
      if (error.status) {
        switch (error.status) {
          case 400:
            errorText.value = 'Некорректные данные, заполните поля';
            break;
          case 401:
            errorText.value = 'Введеный старый пароль не совпадает с текущим';
            break;
          case 404:
            errorText.value = 'Пользователь не найден';
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
  }
}
</script>

<template>
  <div class="main-content white-box flex-col">
    <h2>Профиль</h2>
    <form class="flex flex-col gap-4" @submit.prevent="updateProfile">
      <div class="profile-info flex flex-col gap-3">
        <div class="flex flex-wrap gap-3">
          <div class="input-group flex-1">
            <label for="first_name">Имя</label>
            <InputText v-model="userData.first_name" id="first_name" required/>
          </div>
          <div class="input-group flex-1">
            <label for="last_name">Фамилия</label>
            <InputText v-model="userData.last_name" id="last_name" required/>
          </div>
          <div class="input-group flex-1">
            <label for="middle_name">Отчество</label>
            <InputText v-model="userData.middle_name" id="middle_name"/>
          </div>
        </div>
        <div class="input-group flex-1">
          <label for="email">Email</label>
          <InputText v-model="userData.email" id="email"/>
        </div>
        <div class="flex flex-wrap gap-3">
          <div class="input-group flex-1 self-center">
            <label for="username">Логин</label>
            <InputText v-model="userData.username" id="username" disabled required/>
          </div>
          <div class="input-group flex-1">
            <label>Последний вход: {{ formatDate(userData.lastLogin) }}</label>
            <Button for="email" @click="changePwd = true">Сменить пароль</Button>
          </div>
        </div>
        <div class="input-group flex-1">
          <label for="about">О себе</label>
          <Textarea v-model="userData.about" id="about" rows="3"/>
        </div>
      </div>
      <div class="profile-actions">
        <Button label="Сохранить изменения" type="submit"/>
      </div>
    </form>
    <div v-if="userData.groups.length > 0" class="flex flex-col">
      <span class="text-3xl">Вы состоите в группах</span>
      <ul class="flex flex-col gap-3 p-0 flex-wrap">
        <li v-for="(group, index) in userData.groups" :key="index" class="group flex flex-col justify-center">
          <div>
            <div>{{ group.full_name }}</div>
            <div>{{ group.abbreviation }}</div>
          </div>
        </li>
      </ul>
    </div>
  </div>
  <TheLoader v-if="loading"></TheLoader>
  <Dialog v-model:visible="changePwd" :style="{width: '450px'}" header="Смена пароля" :modal="true" class="p-fluid"
          :closable="false">
    <div class="flex flex-col gap-3 p-3">
      <div
          v-if="errorPanel"
          class="error-block"
          v-bind:style="[errorPanel ? { opacity: 1, padding: '16px'} : { opacity: 0 }]">
        <span>{{ errorText }}</span>
      </div>
      <div class="input-group">
        <label for="password">Пароль</label>
        <Password id="password" pt:input:root:class="w-full" v-model="passwordData.password" :feedback="false"
                  required toggleMask :invalid="submitted && !passwordData.password" autofocus/>
        <small class="p-error" v-if="submitted && !passwordData.password">Поле обязательно для
          заполнения.</small>
      </div>
      <div class="input-group">
        <label for="password">Новый пароль</label>
        <Password id="password" pt:input:root:class="w-full" v-model="passwordData.newPassword" :feedback="true"
                  required
                  :weakLabel="'Слабый'" :mediumLabel="'Средний'" :strongLabel="'Сильный'"
                  promptLabel="Введите пароль" toggleMask :invalid="submitted && !passwordData.newPassword"/>
        <small class="p-error" v-if="submitted && !passwordData.newPassword">Поле обязательно для
          заполнения.</small>
      </div>
    </div>
    <template #footer>
      <Button label="Отмена" icon="pi pi-times" text @click="hideDialogPwd"/>
      <Button label="Отправить" icon="pi pi-check" text @click="changePassword()"/>
    </template>
  </Dialog>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.main-content {
  align-content: center;
}

textarea {
  margin: 0;
}

.group {
  padding: 10px;
  border-radius: 5px;
  border: 1px solid;
  @include theme('border-color', $primary-color);
}
</style>