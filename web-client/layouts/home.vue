<script setup lang="ts">
import {useUser} from "~/composables/user";
import {useCourses} from "~/composables/course";

const user = (await useUser()).value
await useCourses(true)

watchEffect(() => {
  if (!user.pending) {
    // const socket = useNotificationSocket(); // Теперь можно использовать сокет без ошибок
    //
    // if (!socket) {
    //   setupNotificationSocket(); // Инициализируем сокет, если он еще не был инициализирован
    // }
  }
})

</script>

<template>
  <div class="wrapper">
    <div class="page">
      <TheNavigation/>
      <div class="main">
        <Toast/>
        <slot/>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.wrapper {
  display: flex !important;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  max-width: 1920px;
  @include theme('background', $general-background);
}
@media only screen and (min-width: 1930px) {
  .wrapper {
    min-width: 100vw;
  }
}
</style>