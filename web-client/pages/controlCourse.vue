<script setup>
import {useCourses} from "~/composables/course";

definePageMeta({layout: 'home'})
useHead({
  title: 'Управление курсами'
})

const nuxtApp = useNuxtApp()
const runtimeConfig = useRuntimeConfig()
const router = useRouter();
const token = useCookie('token')
const courses = (await useCourses()).value
const listCourses = ref([])

function deleteCourse(id) {
  fetch(`${runtimeConfig.public.apiBase}/courses/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': token.value,
      'Content-Type': 'application/json'
    }
  })
      .then((response) => {
        if (response.ok) {
          courses.refresh()
        } else {
          console.error('Ошибка удаления курса')
        }
      }).catch((err) => {
    if (err instanceof SyntaxError) {
      throw new Error("Invalid JSON data");
    } else {
      console.error("Невозможно отправить запрос", err);
    }
  });
}

watchEffect(() => {
  if (!courses.pending) {
    try {
      listCourses.value = courses.coursesData.courses
    } catch (e) {
      console.error('Не получается получить курсы', e)
    }
  }
})
</script>

<template>
  <div class="main-content white-box">
    <h2 class="">Управление курсами</h2>
    <div class="block-courses">
      <div class="course-row" v-for="course in listCourses">
        <h3>{{ course.name }}</h3>
        <div class="course-controls">
          <p class="change">Изменить</p>
          <p class="delete" @click="deleteCourse(course.id)">Удалить</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.course-row {
  border: 1px solid $blue;
  padding: 15px;
  border-radius: 15px;
  margin-top: 15px;
}

.course-controls, .course-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.course-controls {
  gap: 10px;
}

.course-controls p {
  cursor: pointer;
}

.course-controls p:hover {
  text-decoration: underline;
}

.course-controls .delete {
  color: red;
}
</style>