<script setup lang="ts">
import {getDomainFromUrl, getFileExtension, getFileIcon, videoId} from "~/helpers/files";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
import {faFolder, faLink} from "@fortawesome/free-solid-svg-icons";
import {faYoutube} from "@fortawesome/free-brands-svg-icons";
import {gradeAnswer, sendAnswer} from "~/helpers/tasks";
import {useUser} from "~/composables/user";

const props = defineProps({
  content: {
    type: Object,
    required: true,
    default: () => {
    }
  }
})

const user = (await useUser()).value
const $primevue = usePrimeVue();
const toast = useToast();
const token = useCookie("token").value;

const totalSize = ref(0);
const totalSizePercent = ref(0);
const files = ref([]);
const runtimeConfig = useRuntimeConfig();
const op = ref();
const taskDialog = ref(false)
let response;
const grade = ref(props.content.tasks[0]?.StudentAssignments[0]?.grade || '');
const hasCreateCoursesPermission = ref(null)

watchEffect(() => {
  if (!user.pending) {
    hasCreateCoursesPermission.value = user.userData.permissions.some(permission => permission.code === 'CREATE_COURSES');
  }
})

const handleGradeSubmit = async (answerId) => {
  try {
    const response = await gradeAnswer(answerId, grade.value);
    props.content.tasks[0].StudentAssignments[0].grade = response.grade
    toast.add({severity: 'success', summary: 'Успешно', detail: 'Оценка выставлена', life: 3000});
  } catch (error) {
    toast.add({severity: 'error', summary: 'Ошибка', detail: error.message, life: 3000});
  }
};
const handleSendAnswer = async (idAnswer = null, tasksId, materials) => {
  try {
    const data = await sendAnswer(idAnswer, tasksId, materials);
    toast.add({severity: "success", summary: "Успешно", detail: "Ответ отправлен", life: 3000});
  } catch (error) {
    console.error('Error sending answer:', error);
  }
};

const toggleFolder = (event) => {
  op.value[0].toggle(event);
}

const deleteAnswer = (id) => {
  const {materials} = props.content.tasks[0].StudentAssignments[0];
  props.content.tasks[0].StudentAssignments[0].materials = materials.filter(material => material.id !== id);
}

const hideTaskDialog = () => {
  taskDialog.value = false;
};

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
  if(!props.content.tasks[0].StudentAssignments[0]) {
    props.content.tasks[0].StudentAssignments = [{
      id: '',
      materials: []
    }]
  }
  if (!props.content.tasks[0].StudentAssignments[0].materials) {
    props.content.tasks[0].StudentAssignments[0].materials = response.files.map((file) => ({
      id: file.id,
      name: file.name,
      path: file.path
    }));
  } else {
    response.files.map((file) => (
        props.content.tasks[0].StudentAssignments[0].materials.push({
          id: file.id,
          name: file.name,
          path: file.path
        })
    ))
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
    const newFile = new File([file], encodedName, {type: file.type});
    formData.append('files', newFile);
  });
};
</script>

<template>
  <label
      v-if="!props.content.urlItem && props.content.materials.length <= 0 && props.content.folders.length <= 0 && !props.content.urlVideo && props.content.tasks?.length <= 0"
      class="title-content">
    {{ props.content.title }}
  </label>
  <a v-else-if="props.content.urlItem" :href="props.content.urlItem" class="content-wrapper text-lg cursor-alias">
    <div class="content-wrapper-header">
      <FontAwesomeIcon :icon="faLink" class="file-icon"/>
      {{ props.content.title }}
    </div>
    <div class="file-extension lowercase">
      {{ getDomainFromUrl(props.content.urlItem) }}
    </div>
  </a>
  <p v-if="props.content.content" class="text-lg">{{ props.content.content }}</p>
  <div v-if="props.content.materials.length > 0" class="files-container">
    <div v-for="(material, index) in props.content.materials" :key="index" class="w-full">
      <a :href="material.path" download class="content-wrapper">
        <div class="content-wrapper-header">
          <div class="file-icon-wrapper">
            <FontAwesomeIcon :icon="getFileIcon(material.name)" class="file-icon"/>
          </div>
          <span class="file-name text-lg">{{ props.content.title }}</span>
        </div>
        <div class="file-extension">{{ getFileExtension(material.name) }}</div>
      </a>
    </div>
  </div>
  <div v-if="props.content.folders.length > 0" class="folder-container">
    <div v-for="(folder, folderIndex) in props.content.folders" :key="folderIndex" class="flex flex-col">
      <div class="content-wrapper" @click="toggleFolder">
        <div class="content-wrapper-header">
          <FontAwesomeIcon :icon="faFolder" class="text-lg"/>
          <label>{{ folder.name }}</label>
        </div>
      </div>
      <OverlayPanel ref="op">
        <div class="file-folder-wrapper">
          <a :href="material.path" download class="content-wrapper pl-3"
             v-for="(material, materialIndex) in folder.materials" :key="materialIndex">
            <div class="content-wrapper-header">
              <div class="file-icon-wrapper">
                <FontAwesomeIcon :icon="getFileIcon(material.name)" class="file-icon"/>
              </div>
              <span class="file-name text-lg">{{ material.name }}</span>
            </div>
            <div class="file-extension">{{ getFileExtension(material.name) }}</div>
          </a>
        </div>
      </OverlayPanel>
    </div>
  </div>
  <div v-if="props.content.urlVideo" class="video-container">
    <div class="flex gap-2 items-center text-lg">
      <FontAwesomeIcon :icon="faYoutube" class="file-icon text-lg"/>
      {{ props.content.title }}
    </div>
    <iframe v-if="props.content.urlVideo.includes('youtube.com/watch?v=')"
            width="560" height="315"
            :srcdoc="`<style>*{padding:0;margin:0;overflow:hidden}html,body{height:100%}img{position:absolute;width:100%;top:0;bottom:0;margin:auto}button{position:absolute;width:100%;height:100%;top:0;left:0;z-index:1;background:rgba(0,0,0,0.5);color:white;font-size:20px;border:none;cursor:pointer}button:hover{background:rgba(0,0,0,0.7)}</style><a href=https://www.youtube.com/embed/${videoId(props.content.urlVideo)}?autoplay=1><img src=https://img.youtube.com/vi/${videoId(props.content.urlVideo)}/hqdefault.jpg alt='${props.content.title}'><button>Нажмите для воспроизведения</button></a>`"
            frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
    </iframe>
  </div>
  <div v-if="props.content.tasks[0]" class="content-wrapper" @click="taskDialog = true">
    <div class="content-wrapper-header">
      <i class="pi pi-graduation-cap text-lg"></i>
      <label class="text-[18px]">{{ props.content.tasks[0].name }}</label>
    </div>
  </div>
  <Dialog v-model:visible="taskDialog" :header="props.content.tasks[0]?.name || ''" modal dismissableMask
          @hide="hideTaskDialog">
    <div class="flex flex-col gap-3 py-5">
      <p class="">{{ props.content.tasks[0].text }}</p>
      <label class="text-xl">Материалы</label>
      <div class="file-folder-wrapper mb-3">
        <a :href="material.path" download class="content-wrapper pl-3"
           v-for="(material, materialIndex) in props.content.tasks[0].materials" :key="materialIndex">
          <div class="content-wrapper-header">
            <div class="file-icon-wrapper">
              <FontAwesomeIcon :icon="getFileIcon(material.name)" class="file-icon"/>
            </div>
            <span class="file-name text-lg">{{ material.name }}</span>
          </div>
          <div class="file-extension">{{ getFileExtension(material.name) }}</div>
        </a>
      </div>

      <label class="text-xl">Оценка</label>
      <div v-if="!props.content.tasks[0].StudentAssignments[0]?.length > 0 && props.content.tasks[0].StudentAssignments[0]">
        <p v-if="!props.content.tasks[0].StudentAssignments[0].grade">Не оценено</p>
        <p v-else class="text-[18px]">{{ props.content.tasks[0].StudentAssignments[0].grade }}</p>
      </div>
      <p v-else>Отправьте ответ</p>

      <label class="text-xl mt-3">Ответ</label>
      <div class="mb-5">
        <FileUpload name="files" :url="`${runtimeConfig.public.apiBase}/files/upload`" pt:root:class="max-w-[800px]"
                    @upload="onTemplatedUpload($event)" :multiple="true"
                    @select="onSelectedFiles" :auto="true" @before-send="onBeforeSend($event)">
          <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
            <div class="flex justify-between items-center flex-1 gap-2 w-[50rem]">
              <div class="flex gap-2 items-center align-center">
                <Button @click="chooseCallback()" icon="pi pi-file"
                        class="p-button-rounded p-button-outlined p-2"></Button>
                <Button @click="uploadEvent(uploadCallback)" icon="pi pi-cloud-upload"
                        class="p-button-rounded p-button-outlined p-button-success p-2"
                        :disabled="!files || files.length === 0"></Button>
                <Button @click="clearCallback()" icon="pi pi-times"
                        class="p-button-rounded p-button-outlined p-button-danger p-2"
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
      <div v-if="!props.content.tasks[0].StudentAssignments[0]?.length > 0">
        <div v-if="props.content.tasks[0].StudentAssignments[0] && props.content.tasks[0].StudentAssignments[0].materials?.length > 0">
          <div class="file-folder-wrapper">
            <div class="flex justify-between gap-3 items-center"
                 v-for="(material, materialIndex) in props.content.tasks[0].StudentAssignments[0].materials"
                 :key="materialIndex">
              <a :href="material.path" download class="content-wrapper pl-3">
                <div class="content-wrapper-header">
                  <div class="file-icon-wrapper">
                    <FontAwesomeIcon :icon="getFileIcon(material.name)" class="file-icon"/>
                  </div>
                  <span class="file-name text-lg">{{ material.name }}</span>
                </div>
                <div class="file-extension">{{ getFileExtension(material.name) }}</div>
              </a>
              <Button icon="pi pi-times" class="p-button-danger" @click="deleteAnswer(material.id)"/>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <Button label="Отправить" icon="pi pi-check" text
              @click="handleSendAnswer(props.content.tasks[0].StudentAssignments[0]?.id, props.content.tasks[0].id, props.content.tasks[0].StudentAssignments[0].materials)"/>
    </template>
  </Dialog>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

p {
  margin: 0;
}
</style>