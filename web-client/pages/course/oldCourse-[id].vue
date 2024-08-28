<script setup>
definePageMeta({layout: 'home'});

const runtimeConfig = useRuntimeConfig();
const route = useRoute()
const token = useCookie('token')

import AwTabsWrapper from "~/components/ui-kit/AwTabsWrapper.vue";
import AwTab from "~/components/ui-kit/AwTab.vue";

let course = ref({
  id: 0,
  image_url: '',
  name: '',
  description: '',
  starts_at: '',
  ends_at: '',
  chapters: []
});
let chapters = ref([]);
let chaptersTab = ref([]);
let error = ref('')

function videoId(videoUrl) {
  try {
    const params = new URLSearchParams(new URL(videoUrl).search);
    return params.get('v') ?? '';
  } catch (error) {
    console.error(`Ошибка извлечения данных из ссылки ${error}`);
    return '';
  }
}

function getCourses() {
  fetch(`${runtimeConfig.public.apiBase}/courses/${route.params.id}`, {
    headers: {
      'Authorization': token.value || '',
    },
  }).then((response) => {
    switch (response.status) {
      case 400:
        break;
    }
    return response.json();
  }).then((data) => {
    course.value = data;
    useHead({
      title: course.value.name,
    });
    if (data.chapters === undefined) {
      error.value = 'В курсе отсутствует контент'
      return
    }
    // реверс массива
    try {
      chapters.value = course.value.chapters.reverse();
    } catch (e) {
      console.error(e)
    }
  }).catch((err) => {
    console.error('Невозможно отправить запрос', err);
  });
}

onMounted(() => {
  getCourses();
})
</script>

<template>
  <div class="main-content">
    <div class="courses-main" id="courses-main">
      <h2>{{ course.name }}</h2>
      <h3 class="error-message" v-if="error">{{ error }}</h3>
      <div class="chapter" v-for="(chapter,id) in chapters">
        <div class="chapterHeader" @click="chaptersTab[id]=!chaptersTab[id]">
          <img v-if="chapter.name" src="@/assets/imgs/arrow.svg" alt="Свернуть"
               :style="[chaptersTab[id]?'transform:rotate(-90deg); transition:.1s':'']"
          />
          <h3>{{ chapter.name }}</h3>
        </div>
        <form action="" v-if="chaptersTab[id]">
          <AwTabsWrapper>
            <AwTab title="Описание">
              <p class="description">{{ chapter.description }}</p>
            </AwTab>
            <AwTab title="Материалы">
              <div class="material" v-for="material in chapter.materials">
                <a v-bind:href="`${runtimeConfig.public.domainName}${material.url}`">{{ material.name }}</a>
              </div>
            </AwTab>
            <AwTab title="Видео">
              <div v-for="video in chapter.materials">
                <iframe v-if="video.url.includes('youtube.com/watch?v=')"
                        width="560" height="315" :src="`https://www.youtube.com/embed/${videoId(video.url)}`"
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen></iframe>
              </div>
            </AwTab>
          </AwTabsWrapper>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.courses-mainLeft {
  word-wrap: break-word;
}

.description {
  font-size: 16px;
}

.material {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
}

.chapter {
  border: 1px solid $blue;
  border-radius: 25px;
  padding: 15px;
  margin-top: 10px;
}

.chapterHeader {
  display: flex;
  gap: 10px;
  align-items: center;
  position: relative;
  user-select: none;
}

.chapterHeader .close-button {
  position: absolute;
  right: 5px;
  top: 0;
}

h2 {
  font-style: normal;
  font-weight: 400;
  font-size: 36px;
  line-height: 41px;
}

.error-message {
  margin: 55px;
  font-weight: 400;
  text-align: center;
}

a[href$=".pdf"] {
  padding: 20px 20px 20px 45px;
  background: url("@/public/assets/imgs/pdf.png") 0 center no-repeat;
  background-size: 40px;
}

a[href$=".docx"] {
  padding: 20px 20px 20px 45px;
  background-size: 10px;
  background: url("@/public/assets/imgs/doc.png") 0 center no-repeat;
  background-size: 40px;
}

a[href$=".png"] {
  padding: 20px 20px 20px 45px;
  background-size: 10px;
  background: url("@/public/assets/imgs/png.png") 0 center no-repeat;
  background-size: 40px;
}

a[href$=".zip"] {
  padding: 20px 20px 20px 45px;
  background-size: 10px;
  background: url("@/public/assets/imgs/zip.png") 0 center no-repeat;
  background-size: 40px;
}

a[href$=".pptx"] {
  padding: 20px 20px 20px 45px;
  background-size: 10px;
  background: url("@/public/assets/imgs/pptx-file.png") 0 center no-repeat;
  background-size: 40px;
}

a[href*="youtube.com"] {
  display: none;
}
</style>
