<script setup>
import {useCourses} from "~/composables/course";

definePageMeta({layout: 'home'})
useHead({
  title: 'Мои курсы'
})

const runtimeConfig = useRuntimeConfig()
const nuxtApp = useNuxtApp()
const router = useRouter();
const courses = (await useCourses()).value
const coursesData = ref([]);
const searchQuery = ref("");

const filteredCourses = computed(() => {
  if (!searchQuery.value) return coursesData.value; // Вернуть все курсы, если поисковый запрос пуст
  return coursesData.value.filter(course =>
      course.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

watchEffect(() => {
  if (!courses.pending) {
    try {
        coursesData.value = courses.coursesData.courses;
      }
     catch (e) {
      console.error('Не получается получить курсы', e)
    }}
})
</script>

<template>
  <div class="main-content">
    <div class="courses-main white-box">
      <div class="header">
        <h2>Мои курсы</h2>
        <div class="search-form">
          <input type="text" v-model="searchQuery" placeholder="Поиск курсов...">
          <button class="btn" type="submit">Найти</button>
        </div>
      </div>
      <div class="block-courses">
        <NuxtLink :to="`/course/${course['id']}`" class="course-card" v-for="course in filteredCourses">
          <img
              :src="course.image_url?`${runtimeConfig.public.apiBase + course.image_url}`:'assets/imgs/no_course_photo.png'"
              :alt="course.name">
          <p>{{ course['name'] }}</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>


<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;


.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}

.search-form {
  display: flex;
  align-items: center;
}

.search-form input[type="text"],
.search-form button {
  margin-right: 10px; /* Промежуток между полем и кнопкой */
}

.course-card {
  border: 1px solid $blue;
  border-radius: 25px;
  padding: 21px 10px;
  display: flex;
  flex-direction: column;
  text-align: center;
  //height: 160px;
  width: 195px;
  user-select: none;
  cursor: pointer;
  @include theme('background', $divider-color);
}

.block-courses > div:hover:hover {
  transform: scale(1.01);
}

.course-card img {
  display: block;
  margin: auto;
  width: 90%;
}

.block-courses > div {
  transition: .3s;
  margin: 10px;
}

.block-courses {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 20px;
}

.block-courses p {
  margin-top: 20px;
  word-wrap: break-word;
  @include theme('color', $primary-text-color);
}

a {
  color: #121212;
  text-decoration: none;
}
</style>
