<script setup>
import { useEditingCourseId } from "~/composables/course";

definePageMeta({layout: "home"});
useHead({
  title: "Контент"
});

const runtimeConfig = useRuntimeConfig();
const router = useRouter();
const materialId = ref(null);
const isEditing = ref(false);
const token = useCookie("token").value;

const courseId = ref(null)
const courseIdInfo = await useEditingCourseId()
const courseInfo = useEditingCourse();
const targetSectionIndex = ref(null);
const targetSubsectionIndex = ref(null);
const formData = ref({
  title: "",
  content: "",
  contentType: "",
  textContent: "",
  urlVideo: "",
  urlItem: "",
  folder: {
    name: "",
    materials: []
  },
  tasks: {
    text: "",
    materials: []
  }
});
let response;

onMounted(() => {
  const routeParams = router.currentRoute.value.params;
  materialId.value = router.currentRoute.value.query.materialId;
  formData.value.contentType = router.currentRoute.value.query.contentType;
  targetSectionIndex.value = router.currentRoute.value.query.section;
  targetSubsectionIndex.value = router.currentRoute.value.query.subsection;
  courseId.value = router.currentRoute.value.query.courseId;
  if (materialId.value) {
    isEditing.value = true;
    // Здесь можно загрузить данные существующего материала для редактирования
  }
});

const submitForm = () => {
  if (isEditing.value) {
    // Логика обновления материала

    // После успешного обновления материала
    router.go(-1);
  } else {
    // Логика создания нового материала

    // Определяем тип контента, который нужно добавить
    const contentType = formData.value.contentType;

    // Создаем объект контента в зависимости от типа
    let content;
    switch (contentType) {
      case "text":
        content = {
          title: formData.value.title,
          content: formData.value.content,
          type: "text"
        };
        break;
      case "file":
        content = {
          title: formData.value.title,
          content: formData.value.content,
          type: "file",
          materials: [{id: response.files[0].id, name: response.files[0].name, path: response.files[0].path}]
        };
        break;
      case "urlVideo":
        content = {
          title: formData.value.title,
          content: formData.value.content,
          type: "urlVideo",
          urlVideo: formData.value.urlVideo
        };
        break;
      case "urlItem":
        content = {
          title: formData.value.title,
          content: formData.value.content,
          type: "urlItem",
          urlItem: formData.value.urlItem
        };
        break;
      case "folder":
        formData.value.folder.name = formData.value.title
        content = {
          title: formData.value.title,
          content: formData.value.content,
          type: "folder",
          folders: [formData.value.folder]
        };
        break;
      case "tasks":
        formData.value.tasks.name = formData.value.title
        content = {
          title: formData.value.title,
          content: formData.value.content,
          type: "tasks",
          tasks: [formData.value.tasks]
        };
        break;
      default:
        console.error("Неизвестный тип контента");
    }

    // Добавляем контент в соответствующую секцию
    if (courseId.value !== undefined && courseId.value !== null) {
      if (targetSubsectionIndex.value) {
        courseIdInfo.value.sections[targetSectionIndex.value].subsections[targetSubsectionIndex.value].contents.push(content);
      } else {
        courseIdInfo.value.sections[targetSectionIndex.value].contents.push(content);
      }
    } else {
      if (targetSubsectionIndex.value) {
        courseInfo.value.sections[targetSectionIndex.value].subsections[targetSubsectionIndex.value].contents.push(content);
      } else {
        courseInfo.value.sections[targetSectionIndex.value].contents.push(content);
      }
    }

    console.log(courseInfo);

    // После успешного создания материала
    router.go(-1);
  }
};

const $primevue = usePrimeVue();
const toast = useToast();

const totalSize = ref(0);
const totalSizePercent = ref(0);
const files = ref([]);

const onRemoveTemplatingFile = (file, removeFileCallback, index) => {
  removeFileCallback(index);
  totalSize.value -= parseInt(formatSize(file.size));
  totalSizePercent.value = totalSize.value / 10;
};

const onClearTemplatingUpload = (clear) => {
  clear();
  totalSize.value = 0;
  totalSizePercent.value = 0;
};

const onSelectedFiles = (event) => {
  files.value = event.files;
  files.value.forEach((file) => {
    totalSize.value += parseInt(formatSize(file.size));
  });
};

const uploadEvent = (callback) => {
  totalSizePercent.value = totalSize.value / 10;
  callback();
};

const onTemplatedUpload = (event) => {
  response = JSON.parse(event.xhr.response);
  console.log(response.files);
  toast.add({severity: "success", summary: "Успешно", detail: "Файл загружен", life: 3000});
  switch (formData.value.contentType) {
    case "folder":
      formData.value.folder.materials = response.files.map((file) => ({
        id: file.id,
        name: file.name,
        path: file.path
      }));
      break
    case "tasks":
      formData.value.tasks.materials = response.files.map((file) => ({
        id: file.id,
        name: file.name,
        path: file.path
      }));
      break
  }
};
const formatSize = (bytes) => {
  const k = 1024;
  const dm = 3;
  const sizes = $primevue.config.locale.fileSizeTypes;

  if (bytes === 0) {
    return `0 ${sizes[0]}`;
  }

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

  return `${formattedSize} ${sizes[i]}`;
};
const onBeforeSend = async (event) => {
  const xhr = event.xhr;
  xhr.setRequestHeader("Authorization", token);

  const formData = event.formData;
  const files = formData.getAll('files');
  formData.delete('files');

  files.forEach((file) => {
    const encodedName = encodeURIComponent(file.name);
    const newFile = new File([file], encodedName, { type: file.type });
    formData.append('files', newFile);
  });
};
</script>

<template>
  <div class="main-content">
    <div class="container mx-auto">
      <h1 class="text-2xl font-semibold mb-4">{{ isEditing ? "Редактирование" : "Создание" }} материала</h1>
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label v-if="formData.contentType === 'text'" for="title" class="block font-semibold">Заголовок</label>
          <label v-else for="title" class="block font-semibold">Название</label>
          <InputText v-model.trim="formData.title" type="text" id="title" class="mt-1 p-2 w-full"/>
        </div>
        <div class="mb-4">
          <label v-if="formData.contentType === 'text'" for="content" class="block font-semibold">Текст</label>
          <label v-else for="content" class="block font-semibold">Описание</label>
          <Textarea v-model.trim="formData.content" id="content" class="mt-1 p-2 border rounded w-full" rows="4"
                    variant="filled"/>
        </div>
        <div v-if="formData.contentType === 'text'" class="mb-4">
          <!-- Поля для текстового контента -->
        </div>
        <div v-if="formData.contentType === 'subSection'" class="mb-4">
          <!-- Поля для контента -->
        </div>
        <div v-if="formData.contentType === 'folder'" class="mb-4">
          <FileUpload name="files" :url="`${runtimeConfig.public.apiBase}/files/upload`"
                      @upload="onTemplatedUpload($event)" :multiple="true"
                      @select="onSelectedFiles" :auto="true" @before-send="onBeforeSend($event)">
            <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
              <div class="flex justify-between items-center flex-1 gap-2">
                <div class="flex gap-2">
                  <Button @click="chooseCallback()" icon="pi pi-file"
                          class="p-button-rounded p-button-outlined"></Button>
                  <Button @click="uploadEvent(uploadCallback)" icon="pi pi-cloud-upload"
                          class="p-button-rounded p-button-outlined p-button-success"
                          :disabled="!files || files.length === 0"></Button>
                  <Button @click="clearCallback()" icon="pi pi-times"
                          class="p-button-rounded p-button-outlined p-button-danger"
                          :disabled="!files || files.length === 0"></Button>
                </div>
                <ProgressBar :value="totalSizePercent" :showValue="false"
                             :class="['md:w-20rem w-full ml-auto', { 'exceeded-progress-bar': totalSizePercent > 100 }]">
                  <span class="whitespace-nowrap">{{ totalSize }}B / 1Mb</span>
                </ProgressBar>
              </div>
            </template>
            <template #content="{ files, uploadedFiles, removeUploadedFileCallback, removeFileCallback }">
              <div v-if="files.length > 0">
                <h5>Отправка</h5>
                <div class="flex flex-wrap gap-5">
                  <div v-for="(file, index) of files" :key="file.name + file.type + file.size"
                       class="card flex flex-col border surface-border items-center gap-3">
                    <div>
                      <img role="presentation" :alt="file.name" :src="file.objectURL" width="100" height="50"/>
                    </div>
                    <span class="font-semibold">{{ file.name }}</span>
                    <div>{{ formatSize(file.size) }}</div>
                    <Badge value="Отправка" severity="warning"/>
                    <Button icon="pi pi-times" @click="onRemoveTemplatingFile(file, removeFileCallback, index)"
                            class="p-button-outlined p-button-rounded p-button-danger"/>
                  </div>
                </div>
              </div>

              <div v-if="uploadedFiles.length > 0">
                <h5>Завершено</h5>
                <div class="flex flex-wrap gap-5">
                  <div v-for="(file, index) of uploadedFiles" :key="file.name + file.type + file.size"
                       class="card flex flex-col border surface-border items-center gap-3">
                    <div>
                      <img role="presentation" :alt="file.name" :src="file.objectURL" width="100" height="50"/>
                    </div>
                    <span class="font-semibold">{{ file.name }}</span>
                    <div>{{ formatSize(file.size) }}</div>
                    <Badge value="Завершено" class="mt-3" severity="success"/>
                    <Button icon="pi pi-times" @click="removeUploadedFileCallback(index)"
                            class="p-button-outlined p-button-rounded p-button-danger"/>
                  </div>
                </div>
              </div>
            </template>
            <template #empty>
              <div class="flex items-center justify-center flex-col">
                <i class="pi pi-cloud-upload border-2 rounded-full p-5 text-8xl border-solid"/>
                <p class="mt-4 mb-0">Перетащите файлы сюда для загрузки</p>
              </div>
            </template>
          </FileUpload>
        </div>
        <div v-if="formData.contentType === 'urlItem'" class="mb-4">
          <label for="title" class="block font-semibold">Ссылка</label>
          <InputText v-model.trim="formData.urlItem"
                     type="text" id="title" class="mt-1 p-2 w-full" required/>
        </div>
        <div v-if="formData.contentType === 'urlVideo'" class="mb-4">
          <label for="title" class="block font-semibold">Ссылка</label>
          <InputText v-model.trim="formData.urlVideo"
                     type="text" id="title" class="mt-1 p-2 w-full" required/>
        </div>
        <div v-if="formData.contentType === 'tasks'" class="mb-4">
          <label for="text" class="block font-semibold">Текст</label>
          <Textarea v-model.trim="formData.tasks.text" id="text" class="mt-1 p-2 border rounded w-full" rows="4"
                    variant="filled"/>
          <FileUpload name="files" :url="`${runtimeConfig.public.apiBase}/files/upload`"
                      @upload="onTemplatedUpload($event)" :multiple="true"
                      @select="onSelectedFiles" :auto="true" @before-send="onBeforeSend($event)">
            <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
              <div class="flex justify-between items-center flex-1 gap-2">
                <div class="flex gap-2">
                  <Button @click="chooseCallback()" icon="pi pi-file"
                          class="p-button-rounded p-button-outlined"></Button>
                  <Button @click="uploadEvent(uploadCallback)" icon="pi pi-cloud-upload"
                          class="p-button-rounded p-button-outlined p-button-success"
                          :disabled="!files || files.length === 0"></Button>
                  <Button @click="clearCallback()" icon="pi pi-times"
                          class="p-button-rounded p-button-outlined p-button-danger"
                          :disabled="!files || files.length === 0"></Button>
                </div>
                <ProgressBar :value="totalSizePercent" :showValue="false"
                             :class="['md:w-20rem w-full ml-auto', { 'exceeded-progress-bar': totalSizePercent > 100 }]">
                  <span class="whitespace-nowrap">{{ totalSize }}B / 1Mb</span>
                </ProgressBar>
              </div>
            </template>
            <template #content="{ files, uploadedFiles, removeUploadedFileCallback, removeFileCallback }">
              <div v-if="files.length > 0">
                <h5>Отправка</h5>
                <div class="flex flex-wrap gap-5">
                  <div v-for="(file, index) of files" :key="file.name + file.type + file.size"
                       class="card flex flex-col border surface-border items-center gap-3">
                    <div>
                      <img role="presentation" :alt="file.name" :src="file.objectURL" width="100" height="50"/>
                    </div>
                    <span class="font-semibold">{{ file.name }}</span>
                    <div>{{ formatSize(file.size) }}</div>
                    <Badge value="Отправка" severity="warning"/>
                    <Button icon="pi pi-times" @click="onRemoveTemplatingFile(file, removeFileCallback, index)"
                            class="p-button-outlined p-button-rounded p-button-danger"/>
                  </div>
                </div>
              </div>

              <div v-if="uploadedFiles.length > 0">
                <h5>Завершено</h5>
                <div class="flex flex-wrap gap-5">
                  <div v-for="(file, index) of uploadedFiles" :key="file.name + file.type + file.size"
                       class="card flex flex-col border surface-border items-center gap-3">
                    <div>
                      <img role="presentation" :alt="file.name" :src="file.objectURL" width="100" height="50"/>
                    </div>
                    <span class="font-semibold">{{ file.name }}</span>
                    <div>{{ formatSize(file.size) }}</div>
                    <Badge value="Завершено" class="mt-3" severity="success"/>
                    <Button icon="pi pi-times" @click="removeUploadedFileCallback(index)"
                            class="p-button-outlined p-button-rounded p-button-danger"/>
                  </div>
                </div>
              </div>
            </template>
            <template #empty>
              <div class="flex items-center justify-center flex-col">
                <i class="pi pi-cloud-upload border-2 rounded-full p-5 text-8xl border-solid"/>
                <p class="mt-4 mb-0">Перетащите файлы сюда для загрузки</p>
              </div>
            </template>
          </FileUpload>
        </div>
        <div v-if="formData.contentType === 'file'" class="mb-4">
          <!-- Поля для файла -->
          <div class="card mb-4">
            <label class="block font-semibold">Файл</label>
            <FileUpload name="files" :url="`${runtimeConfig.public.apiBase}/files/upload`"
                        @upload="onTemplatedUpload($event)"
                        @select="onSelectedFiles" :auto="true" @before-send="onBeforeSend($event)">
              <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
                <div class="flex justify-between items-center flex-1 gap-2">
                  <div class="flex gap-2">
                    <Button @click="chooseCallback()" icon="pi pi-file"
                            class="p-button-rounded p-button-outlined"></Button>
                    <Button @click="uploadEvent(uploadCallback)" icon="pi pi-cloud-upload"
                            class="p-button-rounded p-button-outlined p-button-success"
                            :disabled="!files || files.length === 0"></Button>
                    <Button @click="clearCallback()" icon="pi pi-times"
                            class="p-button-rounded p-button-outlined p-button-danger"
                            :disabled="!files || files.length === 0"></Button>
                  </div>
                  <ProgressBar :value="totalSizePercent" :showValue="false"
                               :class="['md:w-20rem w-full ml-auto', { 'exceeded-progress-bar': totalSizePercent > 100 }]">
                    <span class="whitespace-nowrap">{{ totalSize }}B / 1Mb</span>
                  </ProgressBar>
                </div>
              </template>
              <template #content="{ files, uploadedFiles, removeUploadedFileCallback, removeFileCallback }">
                <div v-if="files.length > 0">
                  <h5>Отправка</h5>
                  <div class="flex flex-wrap gap-5">
                    <div v-for="(file, index) of files" :key="file.name + file.type + file.size"
                         class="card flex flex-col border surface-border items-center gap-3">
                      <div>
                        <img role="presentation" :alt="file.name" :src="file.objectURL" width="100" height="50"/>
                      </div>
                      <span class="font-semibold">{{ file.name }}</span>
                      <div>{{ formatSize(file.size) }}</div>
                      <Badge value="Отправка" severity="warning"/>
                      <Button icon="pi pi-times" @click="onRemoveTemplatingFile(file, removeFileCallback, index)"
                              class="p-button-outlined p-button-rounded p-button-danger"/>
                    </div>
                  </div>
                </div>

                <div v-if="uploadedFiles.length > 0">
                  <h5>Завершено</h5>
                  <div class="flex flex-wrap gap-5">
                    <div v-for="(file, index) of uploadedFiles" :key="file.name + file.type + file.size"
                         class="card flex flex-col border surface-border items-center gap-3">
                      <div>
                        <img role="presentation" :alt="file.name" :src="file.objectURL" width="100" height="50"/>
                      </div>
                      <span class="font-semibold">{{ file.name }}</span>
                      <div>{{ formatSize(file.size) }}</div>
                      <Badge value="Завершено" class="mt-3" severity="success"/>
                      <Button icon="pi pi-times" @click="removeUploadedFileCallback(index)"
                              class="p-button-outlined p-button-rounded p-button-danger"/>
                    </div>
                  </div>
                </div>
              </template>
              <template #empty>
                <div class="flex items-center justify-center flex-col">
                  <i class="pi pi-cloud-upload border-2 rounded-full p-5 text-8xl border-solid"/>
                  <p class="mt-4 mb-0">Перетащите файлы сюда для загрузки</p>
                </div>
              </template>
            </FileUpload>
          </div>
        </div>
        <Button type="submit">{{
            isEditing ? "Сохранить" : "Создать"
          }}
        </Button>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.main-content {
  gap: 0 !important;
  border-radius: 20px;
  padding: 20px;
  @include theme('background', $general-background-light);
}
</style>