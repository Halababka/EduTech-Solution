<script setup>
import WeatherWidget from "~/components/widgets/WeatherWidget.vue";
import HomeWidget from "~/components/widgets/HomeWidget.vue";
import CoursesWidget from "~/components/widgets/CoursesWidget.vue";
import CalendarWidget from "~/components/widgets/CalendarWidget.vue";
import LibraryWidget from "~/components/widgets/LibraryWidget.vue";
import {useUser} from "~/composables/user";

definePageMeta({layout: 'home'})
useHead({
  title: 'Домашняя'
})

const user = (await useUser()).value
const nuxtApp = useNuxtApp()
const runtimeConfig = useRuntimeConfig()
const courses = (await useCourses()).value
// const notification = (await useNotification()).value

onMounted(() => {
  courses.refresh()
  // notification.refresh()
})
// const {courses, pending, error} = nuxtApp.$courses

// watchEffect(() => {
//   if (!pending.value) {
//     if (courses.value.length > 0) {
//       coursesSwitch.value = true;
//     }
//   }
// })
</script>

<template>
  <div class="main-content">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-3">
      <div class="col-span-2">
        <CoursesWidget class="block courses min-h-[300px]" v-bind:class="user.pending?'skeleton':''"/>
      </div>
      <WeatherWidget class="block"/>
      <div class="col-span-2">
        <CalendarWidget class="white-box block min-h-[300px] h-[300px] resize-y"/>
      </div>
    </div>
    <!--    <HomeWidget class="white-box block TwoTwo"/>-->
    <!--    <LibraryWidget class="white-box block TwoFor" v-else/>-->
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.block {
  position: relative;
  overflow: hidden;
  //background: $light;
  //border-radius: 25px;
  //background: $light;
  @include theme('background', $general-background-light);
  border-radius: 25px;
  display: flex;
  flex-wrap: wrap;
  align-content: space-around;
  justify-content: center;
  padding: 15px;
  margin: 5px;
  width: auto;
}

.block > .block {
  padding: 0;
}

.OneOne {
  height: 145px;
  width: 145px;
  background: #000;
  padding: 15px;
}

.TwoTwo {
  height: 310px;
  width: 310px;
  padding: 15px;
}

.TwoFor {
  height: 310px;
  max-height: 310px;
  width: 680px;
  max-width: 680px;
  padding: 15px;
}

.main-content {
  width: 1020px;
  justify-content: flex-start;
  padding: 0;
}

.main-content h1 {
  margin: 0;
  font-style: normal;
  font-weight: 500;
  font-size: 24px !important;
  float: left;
}

@media (max-width: 1190px) {
  .TwoFor {
    height: 310px;
    width: 310px;
  }
  .main-content {
    width: auto;
    max-width: 979px;
    justify-content: center;
  }
}
</style>