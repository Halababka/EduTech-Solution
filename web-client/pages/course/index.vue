<script setup>
import { useCourses } from "~/composables/course";

definePageMeta({layout: "home"});
useHead({
  title: "Мои курсы"
});

const runtimeConfig = useRuntimeConfig();
const nuxtApp = useNuxtApp();
const router = useRouter();
const courses = (await useCourses()).value;
const coursesData = ref([]);
const searchQuery = ref("");
const currentPage = ref(0);
const coursesPerPage = 10; // Количество курсов на странице

watchEffect(() => {
  if (!courses.pending) {
    try {
      coursesData.value = courses.coursesData.courses.filter(course => course.active);
    } catch (e) {
      console.error("Не получается получить курсы:", e);
    }
  }
});

const filteredCourses = computed(() => {
  if (!searchQuery.value) return coursesData.value; // Вернуть все курсы, если поисковый запрос пуст
  return coursesData.value.filter(course =>
      course.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const paginatedCourses = computed(() => {
  const start = currentPage.value * coursesPerPage;
  const end = start + coursesPerPage;
  return filteredCourses.value.slice(0, end);
});

const hasMoreCourses = computed(() => {
  return filteredCourses.value.length > paginatedCourses.value.length;
});

const loadMoreCourses = () => {
  currentPage.value++;
};

const handleImageError = (event) => {
  if (!event.target.dataset.replaced) {
    event.target.src = "assets/imgs/no_course_photo.png";
    event.target.dataset.replaced = "true";
  }
};
</script>

<template>
  <div class="main-content white-box">
    <div class="header flex w-full justify-between items-center">
      <div class="flex gap-2 items-center">
        <h2>Мои курсы</h2>
        <Button icon="pi pi-refresh" rounded raised @click="courses.refresh()"/>
      </div>
      <div class="flex items-center">
        <input class="inpt mr-2" type="text" v-model="searchQuery" placeholder="Поиск курсов...">
        <button class="btn" type="submit">Найти</button>
      </div>
    </div>
    <div class="block-courses">
      <div v-if="coursesData.length > 0" class="w-full flex gap-4 flex-wrap justify-center">
        <Card style="width: 20rem; overflow: hidden; min-height: 607px;" pt:header:class="text-center" pt:caption:class="text-md"
              class="zoom-animation cursor-pointer bg-neutral-100 rounded-2xl"
              v-for="course in paginatedCourses" @click="router.push(`/course/${course['id']}`)">
          <template #header>
            <div class="image-container h-[200px]">
              <img
                  class="h-[150px] w-auto"
                  :src="course.image_url?`${course.image_url}`:'assets/imgs/no_course_photo.png'"
                  @error="handleImageError"
                  :alt="course.name">
            </div>
          </template>
          <template #title>{{ course.name }}</template>
          <template #subtitle>
            <div class="flex items-start flex-wrap gap-1 w-full">
                <Tag v-for="(category) in course.categories" style="background: #2255f4;" :value="category.name"
                     class="truncate ... justify-start"
                     rounded></Tag>
            </div>
          </template>
          <template #content>
            <p class="my-0 max-h-[130px] text-pretty text-ellipsis overflow-hidden hover:text-clip text-desc">
              {{ course.description }}
            </p>
          </template>
        </Card>
      </div>
    </div>
    <div v-if="hasMoreCourses" class="flex justify-center mt-4">
      <button class="btn" @click="loadMoreCourses">Показать еще</button>
    </div>
  </div>
</template>


<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.main-content {
  max-width: 1500px !important;
}

.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
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


.header-card {
  min-height: 100px;

  & img {
    display: block;
    margin: auto;
    width: 90%;
  }
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
  width: 100%;
}

.block-courses p {
  //margin-top: 20px;
  word-wrap: break-word;
  @include theme('color', $primary-text-color);
}

a {
  color: #121212;
  text-decoration: none;
}

.text-desc {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 7;
}
</style>
