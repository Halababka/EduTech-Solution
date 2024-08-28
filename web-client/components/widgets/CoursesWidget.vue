<script setup lang="ts">
import {computed} from 'vue';
import {useCourses} from "~/composables/course";

const runtimeConfig = useRuntimeConfig()
const router = useRouter();

const courses = (await useCourses()).value
const sliderItems = ref([])

const redirectToCourse = (courseId) => {
  router.push(`/course/${courseId}`);
};

watchEffect(() => {
  if (!courses.pending) {
    try {
      sliderItems.value = courses.coursesData.courses
    } catch (e) {
      console.error('Не получается получить курсы', e)
    }
  }
})

const handleImageError = (event) => {
  if (!event.target.dataset.replaced) {
    event.target.src = "assets/imgs/no_course_photo.png";
    event.target.dataset.replaced = "true";
  }
};

const responsiveOptions = ref([
  {
    breakpoint: '1400px',
    numVisible: 3,
    numScroll: 1
  },
  {
    breakpoint: '1199px',
    numVisible: 2,
    numScroll: 1
  },
  {
    breakpoint: '767px',
    numVisible: 2,
    numScroll: 1
  },
  {
    breakpoint: '575px',
    numVisible: 1,
    numScroll: 1
  }
]);
</script>
<template>
  <div v-bind:class="courses.pending?'skeleton':''">
    <!--  <div>-->
    <div class="blockHeader">
      <h1>Ваши курсы</h1>
      <NuxtLink to="/course">Смотреть все</NuxtLink>
    </div>
    <p class="no-courses text-xl" v-if="sliderItems.length===0">
      У Вас нету курсов
    </p>
    <Carousel v-else :value="sliderItems" :numVisible="3" :numScroll="1" :responsiveOptions="responsiveOptions" class="w-full">
      <template #item="slotProps">
        <div class="border-1 surface-border border-round m-2 cursor-pointer zoom-animation overflow-hidden rounded-lg"
             @click="redirectToCourse(slotProps.data.id)">
          <div class="">
            <div class="image-container relative text-center">
              <img style="height: 5rem" alt="course image" @error="handleImageError"
                   :src="slotProps.data.image_url?`${slotProps.data.image_url}`:'assets/imgs/no_course_photo.png'"/>
            </div>
          </div>
          <div class="p-3 course-name font-medium text-center text-ellipsis overflow-hidden max-h-[50px] text-wrap">
            {{ slotProps.data.name }}
          </div>
        </div>
      </template>
    </Carousel>
  </div>
</template>
<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

h1 {
  margin: 0;
}

.blockHeader {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;

  & a {
    float: right;
    font-style: normal;
    font-weight: 400;
    font-size: 18px;
    color: $blue;
    text-decoration: none;
    text-align: right;
  }
}

.course-name {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>