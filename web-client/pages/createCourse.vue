<script setup>
import AwButton from "~/components/ui-kit/AwButton.vue";
import AwModal from "~/components/ui-kit/AwModal.vue";
import AwNotification from "~/components/ui-kit/AwNotification.vue";
import AwCheckmark from "~/components/ui-kit/AwСheckmark.vue";
import {useCourses} from "~/composables/course";
import draggable from "vuedraggable";

definePageMeta({layout: 'home'})
useHead({
  title: 'Создание курса'
})

const runtimeConfig = useRuntimeConfig()
const token = useCookie('token')
const router = useRouter();
let courseData = ref({
  image_url: '',
  name: '',
  description: '',
  starts_at: '',
  ends_at: '',
});
let drag = ref(false)
let logoPreview = ref(null);
let chaptersTab = ref([])
let materials = ref([])
let textError = ref()
let logoUrl = ref('')
let messages = ref([])
let complete = ref(false)
let modalActive = ref(false)
let application = ref(false)
let applicationData = ref({})
let isModalActive = ref(false);

function openFullSizeImage() {
  if (logoPreview.value) {
    isModalActive.value = true;
  }
}

function closeModal() {
  isModalActive.value = false;
}

const toggleModal = () => {
  modalActive.value = !modalActive.value
}
const previewLogo = (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    logoPreview.value = event.target.result;
  };
  reader.readAsDataURL(file);
};

function removeLogo() {
  logoPreview.value = null; // Сбрасываем предпросмотр изображения
  const input = document.querySelector('.courses-mainAbout input[type="file"]');
  input.value = ''; // Сбрасываем выбранный файл
}

courseData.value.starts_at = currentDate()
courseData.value.ends_at = currentDate(true)

function currentDate(future) {
  const now = new Date();
  let year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  if (future) {
    year += 1
  }

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function createCourse() {
  chapters.value.forEach(chapter => {
    chapter.unlocks_at = chapter.unlocks_at + ':00Z';
  });
  const body = {
    "image_url": logoUrl.value,
    "name": courseData.value.name,
    "description": courseData.value.description,
    "chapters": chapters.value,
    "starts_at": courseData.value.starts_at + ':00Z',
    "ends_at": courseData.value.ends_at + ':00Z'
  }
  fetch(`${runtimeConfig.public.apiBase}/courses`, {
    method: 'POST',
    headers: {
      'Authorization': token.value,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }).then((response) => {
    switch (response.status) {
      case 400:
        modalActive.value = true
        break;
      case 200:
        let timeStamp = Date.now().toLocaleString();
        complete.value = true;
        useCourses(true)
        courseData.value.name = ""
        break;
    }
    return response.json();
  }).then((data) => {
    if (data.error) switch (data.error) {
      case 'course name must be unique':
        textError.value = 'Курс с таким названием уже существует'
        let timeStamp = Date.now().toLocaleString();
        messages.value.unshift(
            {name: 'Курс с таким названием уже существует', icon: 'error', id: timeStamp}
        )
        break;
      default:
        textError.value = 'Неизвестная ошибка'
        break;
    }
    // this.loading = false;
  }).catch((err) => {
    console.error("Невозможно отправить запрос", err);
  });
}

function createChapter() {
  chapters.value.unshift({
    "name": "",
    "description": "",
    "unlocks_at": currentDate(),
    "materials": []
  })
  chaptersTab.value.unshift(true)
}

// function deleteChapter(id) {
//   chapters.value.splice(id, 1)
//   chaptersTab.value.splice(id, 1)
// }

function changeMaterial(id) {
  const input = document.querySelector('.chapter input[type="file"]')
  // console.log(input.files[0].name)
  materials.value = input.files[0].name
  let data = new FormData()
  data.append('uploadedfile', input.files[0])
  fetch(`${runtimeConfig.public.apiBase}/uploads`, {
    method: 'POST',
    headers: {
      'Authorization': token.value,
    },
    body: data
  }).then((response) => {
    switch (response.status) {
      case 200:
        alert('Файл загружен успешно')
        break;
      case 500:
        alert('Файл не выбран')
        break;
    }
    return response.json();
  }).then((data) => {
    // console.log(courseData.value)
    // courseData.value.chap
    chapters.value[id].materials.push({"name": materials.value, "url": data.url})
    // this.loading = false;
  }).catch((err) => {
    console.error("Невозможно отправить запрос", err);
  });
}

function uploadFile() {
  const input = document.querySelector('.chapter input[type="file"]')
  const formData = new FormData();
  formData.append('file', input.files[0]);

  // Здесь вызовите ваше API для загрузки файла на сервер
  fetch(`${runtimeConfig.public.apiBase}/courses/upload`, {
    method: 'POST',
    headers: {
      'Authorization': token.value,
      'Content-Type': 'application/json'
    },
    body: formData
  }).then((response) => {
    switch (response.status) {
      case 200:
        alert('Файл загружен успешно')
        break;
      case 500:
        alert('Файл не выбран')
        break;
    }
    return response.json();
  }).then((data) => {
    console.log(data)
  }).catch((err) => {
    console.error("Невозможно отправить запрос", err);
  });
}

function loadLogo() {
  const input = document.querySelector('.courses-mainAbout input[type="file"]')
  // console.log(input.files[0].name)
  materials.value = input.files[0].name

  let data = new FormData()
  data.append('uploadedfile', input.files[0])
  fetch(`${runtimeConfig.public.apiBase}/uploads`, {
    method: 'POST',
    headers: {
      'Authorization': token.value,
    },
    body: data
  }).then((response) => {
    switch (response.status) {
      case 200:
        alert('Файл загружен успешно')
        break;
      case 500:
        alert('Файл не выбран')
        break;
    }
    return response.json();
  }).then((data) => {
    // console.log(data)
    logoUrl.value = data.url
    // this.loading = false;
  }).catch((err) => {
    console.error("Невозможно отправить запрос", err);
  });
}

const chapters = ref([]);
let editingChapterId = ref(null);

const addChapter = () => {
  const newChapterId = generateUniqueId(); // Функция для генерации уникального id
  chapters.value.push({id: newChapterId, name: '', editing: true, materials: []});
};

const toggleEditing = (index) => {
  chapters.value[index].editing = !chapters.value[index].editing;
  setTimeout(() => {
    if (chapters.value[index].editing) {
      const inputElement = document.getElementById(`materialInput-${index}`);
      if (inputElement) {
        inputElement.scrollIntoView({behavior: 'smooth'});
      }
    }
  }, 50)
};

const saveChapter = (id) => {
  chapters.value.find(chapter => chapter.id === id).editing = false;
  editingChapterId.value = null;
};

const deleteChapter = (id) => {
  const index = chapters.value.findIndex(chapter => chapter.id === id);
  if (index !== -1) {
    chapters.value.splice(index, 1);
    if (editingChapterId.value === id) {
      editingChapterId.value = null;
    }
  }
};

function attachMaterials(event, chapterIndex) {
  const files = event.target.files;
  for (let i = 0; i < files.length; i++) {
    if (!chapters.value[chapterIndex].materials) {
      chapters.value[chapterIndex].materials = [];
    }
    chapters.value[chapterIndex].materials.push(files[i]);
  }
}

// Функция для генерации уникального id
const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9);
};

</script>
<template>
  <AwModal @close="toggleModal" :modalActive="modalActive" :title="'Ошибка'">
    <p>
      {{ textError }}
    </p>
  </AwModal>
  <div class="main-content">
    <AwCheckmark :complete="complete" @toggleComplete="complete = !complete"/>
    <div>
      <AwNotification
          :messages="messages"
      />
    </div>
    <div class="courses-main">
      <div class="topBar">
        <h2>Название:</h2>
        <AwButton v-on:click="createCourse">
          <img src="~/assets/imgs/saveButton.svg" alt="">
          <p>Сохранить</p>
        </AwButton>
      </div>
      <input type="text" v-model="courseData.name" style="width: 100%">
      <div class="chapterBar">
        <h2>Разделы</h2>
        <AwButton @click="createChapter">
          <img src="~/assets/imgs/added.svg" alt="">
          <p>Добавить</p>
        </AwButton>
      </div>
      <!--      <AwAccordion/>-->
      <div>
        <button @click="addChapter">Добавить</button>
        <draggable
            v-model="chapters"
            group="people"
            @start="drag=true"
            @end="drag=false"
            item-key="id">
          <template #item="{element, index}">
            <div class="chapter">
              <div class="chapter-header" @click="toggleEditing(index)" :id="'materialInput-' + index">
                <div class="icon-arrow" :class="{ 'rotate': element.editing }"
                     style="transform:rotate(-90deg); transition:.1s" @click="toggleEditing(element.id)"/>
                <h2>{{ element.name }}</h2>
                <div class="icon-close close-button" @click="deleteChapter(element.id)" @click.stop></div>
              </div>
              <div v-if="element.editing" class="chapter-form">
                <div class="input-group">
                  <label for="name">Название:</label>
                  <input v-model="element.name" placeholder="Введите название раздела"/>
                </div>
                <div class="input-group">
                  <label for="description">Описание:</label>
                  <textarea v-model="element.description" rows="3"></textarea>
                </div>
                <div class="input-group">
                  <label for="unlocks-at">Станет доступен:</label>
                  <input type="datetime-local" v-model="element.unlocks_at">
                </div>
                <div class="input-group">
                  <label for="material">Прикрепить материалы:</label>
                  <input type="file" name="material" multiple @change="attachMaterials($event, element.id)">
                </div>
                <!--              <div v-for="material in element.materials" :key="material.id" class="material">-->
                <!--                {{ material.name }}-->
                <!--              </div>-->
              </div>
            </div>
          </template>
        </draggable>
      </div>
      <!--      <div class="chapter" v-for="(chapter,id) in chapters" :key="chapter.id">-->
      <!--        <AwModal @close="application=!application" :modalActive="application" :title="'Прикрепить видео'">-->
      <!--          <form>-->
      <!--            <div class="input-form">-->
      <!--              <label for="name">Название</label>-->
      <!--              <input type="text" name="name" id="name" placeholder="Изучение python. Глава 2"-->
      <!--                     v-model="applicationData.name">-->
      <!--            </div>-->
      <!--            <div class="input-form">-->
      <!--              <label for="link">Ссылка</label>-->
      <!--              <input type="text" name="link" id="link" placeholder="https://youtube.com/"-->
      <!--                     v-model="applicationData.link">-->
      <!--            </div>-->
      <!--            <AwButton v-on:click="addApplication(id)">Сохранить</AwButton>-->
      <!--          </form>-->
      <!--        </AwModal>-->

      <!--        <div class="chapterHeader">-->
      <!--          <div class="icon-arrow" v-if="chapter.name"-->
      <!--               :style="[chaptersTab[id]?'transform:rotate(0deg); transition:.1s':'transform:rotate(-90deg); transition:.1s']"-->
      <!--               @click="chaptersTab[id]=!chaptersTab[id]"/>-->
      <!--          <h2 @click="chaptersTab[id]=!chaptersTab[id]">{{ chapter.name }}</h2>-->
      <!--          <div class="icon-close close-button" @click="deleteChapter(id)"></div>-->
      <!--        </div>-->
      <!--        <form action="" v-if="chaptersTab[id]">-->
      <!--          <div class="input-form">-->
      <!--            <label for="name">Название:</label>-->
      <!--            <input type="text" name="name" id="name" v-model="chapter.name">-->
      <!--          </div>-->
      <!--          <div class="input-form">-->
      <!--            <label for="description">Описание (необязательно):</label>-->
      <!--            <textarea name="description" id="description" rows="3" v-model="chapter.description"></textarea>-->
      <!--          </div>-->
      <!--          <div class="input-form">-->
      <!--            <label for="unlocks-at">Станет доступен:</label>-->
      <!--            <input type="datetime-local" name="unlocks-at" id="unlocks-at" v-model="chapter.unlocks_at">-->
      <!--          </div>-->
      <!--          <b>Прикрепить материалы:</b>-->
      <!--          <div class="applications">-->
      <!--            <label class="input-file">-->
      <!--              <input type="file" name="file" @change="uploadFile()">-->
      <!--              <span class="input-file-btn">Файл</span>-->
      <!--              &lt;!&ndash;            <input type="file" name="file" @change="changeMaterial(id)">&ndash;&gt;-->
      <!--              &lt;!&ndash;            <span class="input-file-btn">Выберите файл</span>&ndash;&gt;-->
      <!--              &lt;!&ndash;            <span class="input-file-text">{{  }}</span>&ndash;&gt;-->
      <!--            </label>-->
      <!--            <label class="input-file">-->
      <!--              <span class="input-file-btn" v-on:click="application=true">Видео</span>-->
      <!--            </label>-->
      <!--          </div>-->
      <!--          <div class="materials" v-for="material in chapter.materials">-->
      <!--            {{ material }}-->
      <!--          </div>-->
      <!--        </form>-->
      <!--      </div>-->
    </div>
    <div class="courses-mainAbout">
      <h2>О курсе</h2>
      <form>
        <div class="input-group">
          <div class="input-form">
            <label for="description">Описание:</label>
            <textarea name="description" id="description" rows="10" v-model="courseData.description"></textarea>
          </div>
          <div class="input-form">
            <label for="start-at">Начало курса:</label>
            <input type="datetime-local" name="start-at" id="start-at" v-model="courseData.starts_at">
          </div>
          <div class="input-form">
            <label for="end-at">Окончание курса:</label>
            <input type="datetime-local" name="end-at" id="end-at" v-model="courseData.ends_at">
          </div>
          <div class="input-form">
            <label for="logo">Логотип курса:</label>
            <div class="image-preview-container">
              <img :src="[logoPreview?logoPreview:'assets/imgs/no_course_photo.png']" alt="logo"
                   @click="openFullSizeImage">
              <div class="icon-close close-button" v-if="logoPreview" @click="removeLogo"></div>
              <teleport to="body">
                <AwModal @close="isModalActive =! isModalActive" :modalActive="isModalActive">
                  <div class="modal-content">
                    <img v-if="logoPreview" :src="logoPreview" alt="logo" style="max-width: 100%; max-height: 100%;">
                  </div>
                </AwModal>
              </teleport>
            </div>
            <input type="file" name="logo" id="logo" @change="previewLogo">
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.chapter-header {
  position: relative;
}

.main-content {
  max-width: 100%;
  align-items: flex-start;
  gap: 10px;
}

.courses-mainAbout img {
  width: max-content;
  max-height: 80px;
}

h2 {
  font-style: normal;
  font-weight: 400;
  font-size: 36px;
  line-height: 41px;
}

.topBar, .chapterBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.content-choice {
  list-style: none;
}

.input-file {
  margin-top: 15px;
  margin-right: 5px;
}

.courses-mainAbout {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 330px;
  min-height: 70%;
  padding: 21px 20px;
  @include theme('background', $general-background-light);
  border-radius: 25px;
}

.courses-mainAbout input, .courses-mainAbout textarea {
  width: 100%;
  resize: none;
}

.chapter {
  border: 1px solid $blue;
  border-radius: 25px;
  padding: 15px;
  margin-top: 10px;
}

.chapter .input-form {
  display: flex;
  flex-direction: column;
}

.chapter textarea {
  resize: none
}

.chapter-header {
  display: flex;
  gap: 10px;
  align-items: center;
  position: relative;
  user-select: none;
}

.chapter-header img {
  height: fit-content;
}

.close-button {
  position: absolute;
  right: 5px;
  top: 0;
}

.image-preview-container {
  position: relative;
  display: inline-block;
}

.remove-button {
  position: absolute;
  top: -10px;
  right: -10px;
  background-color: transparent;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  z-index: 1;
}

.rotate {
  transform: rotate(0deg) !important;
  transition: .1s;
}

/* Focus */
.input-file input[type=file]:focus + .input-file-btn {
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, .25);
}

/* Hover/active */
.input-file:hover .input-file-btn {
  background-color: $blue-mate;
}

.input-file:active .input-file-btn {
  background-color: #2E703A;
}

/* Disabled */
.input-file input[type=file]:disabled + .input-file-btn {
  background-color: #eee;
}
</style>
