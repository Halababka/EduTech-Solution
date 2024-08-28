<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()
const nuxtApp = useNuxtApp()
let localUserData = ref({
  "first_name": '',
  "last_name": '',
  "group_name": '',
  "profile_photo": ''
})
const localeHours = computed(() => {
  let localeHours = new Date().getHours();
  if (localeHours > 3 && localeHours < 12) return "Доброе утро";
  else if (localeHours > 11 && localeHours < 19) return "Добрый день";
  else if (localeHours > 18 && localeHours < 24) return "Добрый вечер";
  else if (localeHours > 23 || localeHours < 4) return "Доброй ночи";
  throw Error("localHours error");
});
const {userData, pending, error} = nuxtApp.$user

watchEffect(() => {
  if (!pending.value) {
    localUserData.value.first_name = userData.value.first_name;
    localUserData.value.last_name = JSON.parse(userData.value.last_name).lastName;
    localUserData.value.group_name = userData.value.group.name;
    localUserData.value.profile_photo = JSON.parse(userData.value.last_name).profilePhoto;
  }
})

const widgetText = computed(() => {
  if (localUserData.value.first_name) {
    return `, ${localUserData.value.first_name}`
  }
});

</script>

<template>
  <div id='home-widget' v-bind:class="pending ? 'skeleton' : ''">
    <div class="top">
      <h3>{{ localeHours }}{{ widgetText }}</h3>
      <img
          :src="[localUserData.profile_photo ? `${runtimeConfig.public.domainName + localUserData.profile_photo}`: '@/public/assets/imgs/avatar.jpg']"
          alt="Фото профиля" draggable="false">
    </div>
  </div>
</template>

<style scoped lang="scss">
.top {
  display: flex;
  align-items: center;
  gap: 15px;
}

.top h3 {
  height: fit-content;
  text-align: center;
}

.top img {
  max-width: 120px;
  max-height: 280px;
  border-radius: 10px;
}
</style>