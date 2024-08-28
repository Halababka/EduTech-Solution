<script setup>
import AwCheckmark from "~/components/ui-kit/AwСheckmark.vue";
import AwTabsWrapper from "~/components/ui-kit/AwTabsWrapper.vue";
import AwTab from "~/components/ui-kit/AwTab.vue";
import { saveCourse, fetchCourse, updateCourse } from "~/helpers/courses";
import {
  faFileAlt,
  faFileArchive, faFileAudio,
  faFileExcel, faFileImage,
  faFilePdf,
  faFilePowerpoint, faFileVideo,
  faFileWord,
  faLink, faFolder
} from "@fortawesome/free-solid-svg-icons";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { initialState, useEditingCourse } from "~/composables/course";
import { getDomainFromUrl, getFileExtension } from "~/helpers/files";
import AwModal from "~/components/ui-kit/AwModal.vue";

definePageMeta({layout: "home"});
useHead({
  title: "Создание курса"
});

// Объект, соотносящий расширения файлов с соответствующими иконками
const fileIcons = {
  pdf: faFilePdf,
  doc: faFileWord,
  docx: faFileWord,
  xls: faFileExcel,
  xlsx: faFileExcel,
  ppt: faFilePowerpoint,
  pptx: faFilePowerpoint,
  zip: faFileArchive,
  rar: faFileArchive,
  jpg: faFileImage,
  jpeg: faFileImage,
  png: faFileImage,
  gif: faFileImage,
  mp3: faFileAudio,
  wav: faFileAudio,
  mp4: faFileVideo,
  mov: faFileVideo,
  avi: faFileVideo,
  txt: faFileAlt,
  url: faLink,
  folder: faFolder,
  video: faYoutube // Пример иконки для неизвестных файлов
  // Добавьте другие расширения и соответствующие им иконки по мере необходимости
};
const runtimeConfig = useRuntimeConfig();
const token = useCookie("token");
const router = useRouter();
const op = ref();
const {$toast} = useNuxtApp();
const searchQuery = ref("");
const selectedGroup = ref(null);
const selectedLetter = ref(null);
const groups = ref([]);
const alphabet = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ".split("");
const categories = ref([]);
const complete = ref(false);
const loading = ref(false);
let courseInfo = useEditingCourse();
const searchResults = ref([]);
const selectedSearchItems = ref([]); // Выбранные результаты поиска
const selectedParticipants = ref([]); // Выбранные участники
const selectedParticipantsItems = ref([]); // Выбранные участники
const selectedItems = ref([]);
const selectedSubsectionIndex = ref(null);
const currentTask = ref({});
const taskOpenDialog = ref(false);

const searchOwnersQuery = ref("");
const selectedOwnersGroup = ref(null);
const selectedOwnersLetter = ref(null);
const selectedOwnersSearchItems = ref([]);
const selectedOwnersItems = ref([]);

const logoPreview = ref(null);

const isModalActive = ref(false);

onMounted(() => {
  loadCategories();
  loadGroups();
  loadUsers();
});

onBeforeMount(() => {
  if (router.currentRoute.value.query.id) {
    loadCourse(router.currentRoute.value.query.id);
  } else {
    courseInfo.value = initialState;
  }
});

const loadCourse = async (id) => {
  try {
    loading.value = true;
    id = parseInt(id);
    if (courseInfo.value.id !== id) {
      courseInfo.value = await useEditingCourseId(id, true);
    }
  } catch (error) {
    console.error("Failed to load course data:", error);
  }
  loading.value = false;
};

const loadCategories = async () => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/categories`, {
      method: "GET",
      headers: {
        "Authorization": `${token.value}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }
    const data = await response.json();
    categories.value = data;
  } catch (error) {
    console.error("Error loading categories:", error);
  }
};

// Загрузка данных о группах из API
const loadGroups = async () => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/groups`, {
      method: "GET",
      headers: {
        "Authorization": `${token.value}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }
    const data = await response.json();
    groups.value = data;
  } catch (error) {
    console.error("Error loading groups:", error);
  }
};
const loadUsers = async () => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/users`, {
      method: "GET",
      headers: {
        "Authorization": `${token.value}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    const data = await response.json();
    searchResults.value = data;
  } catch (error) {
    console.error("Error loading users:", error);
  }
};
const filteredResults = computed(() => {
  let filtered = [...searchResults.value];

  filtered.forEach(item => {
    item.fullname = `${item.last_name} ${item.first_name} ${item.middle_name}`;
  });

  if (searchQuery.value.trim() !== "") {
    filtered = filtered.filter(item => item.fullname.toLowerCase().includes(searchQuery.value.toLowerCase()));
  }

  if (selectedGroup.value) {
    filtered = filtered.filter(item => item.groups.some(group => group.id === selectedGroup.value));
  }

  if (selectedLetter.value) {
    const firstLetter = selectedLetter.value.toLowerCase();
    filtered = filtered.filter(item => item.last_name.toLowerCase().startsWith(firstLetter));
  }

  return filtered;
});
const addParticipant = (participant) => {
  if (!courseInfo.value.enrolledStudents.some(p => p.id === participant.id)) {
    courseInfo.value.enrolledStudents.push(participant);
    console.log(courseInfo.value.enrolledStudents);
  } else {
    // Можно добавить обработку ошибки или уведомление о том, что пользователь уже добавлен
    console.log("Пользователь уже добавлен");
  }
};
const removeParticipant = (participant) => {
  const index = courseInfo.value.enrolledStudents.findIndex(item => item === participant);
  if (index !== -1) {
    courseInfo.value.enrolledStudents.splice(index, 1);
  }
};
const displaySelectedParticipants = computed(() => [...courseInfo.value.enrolledStudents]);

// Функция сброса фильтров
const resetFilters = () => {
  searchQuery.value = "";
  selectedGroup.value = null;
  selectedLetter.value = null;
};

// Функция добавления выбранных участников
const addSelectedParticipants = () => {
  selectedSearchItems.value.forEach(item => {
    if (!courseInfo.value.enrolledStudents.some(p => p.id === item.id)) {
      courseInfo.value.enrolledStudents.push(item);
    }
  });
  selectedSearchItems.value = [];
};

// Функция удаления выбранных участников
const removeSelectedParticipants = () => {
  courseInfo.value.enrolledStudents = courseInfo.value.enrolledStudents.filter(item => !selectedParticipantsItems.value.includes(item));
  selectedParticipantsItems.value = [];
};

const filteredOwnersResults = computed(() => {
  let filtered = [...searchResults.value];

  filtered.forEach(item => {
    item.fullname = `${item.last_name} ${item.first_name} ${item.middle_name}`;
  });

  if (searchOwnersQuery.value.trim() !== "") {
    filtered = filtered.filter(item => item.fullname.toLowerCase().includes(searchOwnersQuery.value.toLowerCase()));
  }

  if (selectedOwnersGroup.value) {
    filtered = filtered.filter(item => item.groups.some(group => group.id === selectedOwnersGroup.value));
  }

  if (selectedOwnersLetter.value) {
    const firstLetter = selectedOwnersLetter.value.toLowerCase();
    filtered = filtered.filter(item => item.last_name.toLowerCase().startsWith(firstLetter));
  }

  return filtered;
});

const addOwner = (owner) => {
  if (!courseInfo.value.courseOwners.some(p => p.id === owner.id)) {
    courseInfo.value.courseOwners.push(owner);
  } else {
    console.log("Владелец уже добавлен");
  }
};

const removeOwner = (owner) => {
  const index = courseInfo.value.courseOwners.findIndex(item => item === owner);
  if (index !== -1) {
    courseInfo.value.courseOwners.splice(index, 1);
  }
};

const displaySelectedOwners = computed(() => [...courseInfo.value.courseOwners]);

const resetOwnersFilters = () => {
  searchOwnersQuery.value = "";
  selectedOwnersGroup.value = null;
  selectedOwnersLetter.value = null;
};

const addSelectedOwners = () => {
  selectedOwnersSearchItems.value.forEach(item => {
    if (!courseInfo.value.courseOwners.some(p => p.id === item.id)) {
      courseInfo.value.courseOwners.push(item);
    }
  });
  selectedOwnersSearchItems.value = [];
};

const removeSelectedOwners = () => {
  courseInfo.value.courseOwners = courseInfo.value.courseOwners.filter(item => !selectedOwnersItems.value.includes(item));
  selectedOwnersItems.value = [];
};

const selectedSectionIndex = ref(null);

const selectedSectionForMaterial = computed(() => {
  // Предположим, что индекс выбранной секции хранится в переменной selectedSectionIndex
  const index = selectedSectionIndex.value;

  // Если индекс равен -1, значит, секция не выбрана
  if (index === -1) {
    return null;
  }

  // Получаем объект выбранной секции
  const section = courseInfo.value.sections[index];

  // Возвращаем объект с информацией о выбранной секции
  return {index, name: section.name};
});

const showModal = ref(false);

// Функция переключения состояния секции (открыть/закрыть)
const toggleSection = (index) => {
  courseInfo.value.sections[index].open = !courseInfo.value.sections[index].open;
};

const toggleSubsection = (index, subIndex) => {
  courseInfo.value.sections[index].subsections[subIndex].open = !courseInfo.value.sections[index].subsections[subIndex].open;
};

// Функция добавления новой секции
const addSection = (index) => {
  const newSection = {
    name: `Секция ${courseInfo.value.sections.length}`,
    open: false,
    contents: [],
    editing: false,
    subsections: []
  };
  courseInfo.value.sections.splice(index + 1, 0, newSection);
};

// Функция удаления секции
const deleteSection = (index) => {
  courseInfo.value.sections.splice(index, 1);
};

const deleteSubsection = (index, subIndex) => {
  courseInfo.value.sections[index].subsections.splice(subIndex, 1);
};

// Функция добавления материала к секции
const addMaterialToSection = (sectionIndex, material) => {
  courseInfo.value.sections[sectionIndex].contents.push(material);
};

// Функция удаления материала из секции
const deleteContent = (sectionIndex, contentIndex) => {
  courseInfo.value.sections[sectionIndex].contents.splice(contentIndex, 1);
};

const deleteSubsectionContent = (sectionIndex, subsectionIndex, contentIndex) => {
  courseInfo.value.sections[sectionIndex].subsections[subsectionIndex].contents.splice(contentIndex, 1);
};

const editSubsectionContent = (index, content = null) => {
  router.push({
    path: `/materials/edit`,
    query: {
      section: selectedSectionIndex.value,
      subsection: selectedSubsectionIndex.value,
      materialId: content
    }
  });
};

// Функция отображения модального окна для выбора типа материала
const addContent = (sectionIndex, subsectionIndex = null) => {
  selectedSectionIndex.value = sectionIndex;
  console.log("subsectionIndex", subsectionIndex);
  if (subsectionIndex !== null) selectedSubsectionIndex.value = subsectionIndex;
  showModal.value = true;
};
const selectTypeContent = (type) => {
  showModal.value = false;
  selectedMaterialType.value = type;
  if (router.currentRoute.value.query.id) {
    router.push({
      path: `/materials/edit`,
      query: {
        contentType: selectedMaterialType.value,
        section: selectedSectionIndex.value,
        subsection: selectedSubsectionIndex.value,
        courseId: router.currentRoute.value.query.id
      }
    });
    return;
  }
  router.push({
    path: `/materials/edit`,
    query: {
      contentType: selectedMaterialType.value,
      section: selectedSectionIndex.value,
      subsection: selectedSubsectionIndex.value
    }
  });
};
const selectedMaterialType = ref("text"); // По умолчанию выбран текстовый материал

// Функция изменения имени секции
const inputField = ref(null);
const editSectionName = (index) => {
  courseInfo.value.sections[index].editing = true;
  // Получаем ссылку на поле ввода имени секции и устанавливаем на него фокус
  if (courseInfo.value.sections[index].editing && inputField.value) {
    nextTick(() => {
      inputField.value[0].focus();
    });
  }
};

const editSubsectionName = (index, subIndex) => {
  courseInfo.value.sections[index].subsections[subIndex].editing = true;
  // Получаем ссылку на поле ввода имени секции и устанавливаем на него фокус
  if (courseInfo.value.sections[index].subsections[subIndex].editing && inputField.value) {
    nextTick(() => {
      inputField.value[0].focus();
    });
  }
};

const saveSectionName = (index) => {
  courseInfo.value.sections[index].editing = false;
};

const saveSubsectionName = (index, subIndex) => {
  courseInfo.value.sections[index].subsections[subIndex].editing = false;
};
const getFileIcon = (filename) => {
  const extension = filename.split(".").pop().toLowerCase();
  return fileIcons[extension] || faFileAlt; // Возвращает иконку по расширению файла, либо иконку по умолчанию
};


let dragSectionIndex = null;
let dragContentIndex = null;
let dragSubsectionIndex = null;

const dragStart = (sectionIndex, subsectionIndex = null, contentIndex = null) => {
  dragSectionIndex = sectionIndex;
  dragSubsectionIndex = subsectionIndex;
  dragContentIndex = contentIndex;
};

const drop = (sectionIndex) => {
  if (dragContentIndex === null) {
    const draggedSection = courseInfo.value.sections[dragSectionIndex];
    courseInfo.value.sections.splice(dragSectionIndex, 1);
    courseInfo.value.sections.splice(sectionIndex, 0, draggedSection);
    dragSectionIndex = null;
  }
};

const dropSubsection = (sectionIndex, subsectionIndex) => {
  if (dragContentIndex === null) {
    const draggedSubsection = courseInfo.value.sections[sectionIndex].subsections[dragSubsectionIndex];
    courseInfo.value.sections[sectionIndex].subsections.splice(dragSubsectionIndex, 1);
    courseInfo.value.sections[sectionIndex].subsections.splice(subsectionIndex, 0, draggedSubsection);
    dragSubsectionIndex = null;
  }
};

const dropContent = (sectionIndex, contentIndex) => {
  if (dragContentIndex !== null && dragSectionIndex === sectionIndex) {
    console.log(courseInfo.value.sections[sectionIndex].contents);
    const draggedContent = courseInfo.value.sections[sectionIndex].contents[dragContentIndex];
    courseInfo.value.sections[sectionIndex].contents.splice(dragContentIndex, 1);
    courseInfo.value.sections[sectionIndex].contents.splice(contentIndex, 0, draggedContent);
    dragContentIndex = null;
    dragSectionIndex = null;
  }
};

const dropSubsectionContent = (subsectionIndex, contentIndex) => {
  if (dragContentIndex !== null && dragSubsectionIndex === subsectionIndex) {
    const draggedContent = courseInfo.value.sections[dragSectionIndex].subsections[subsectionIndex].contents[dragContentIndex];
    courseInfo.value.sections[dragSectionIndex].subsections[subsectionIndex].contents.splice(dragContentIndex, 1);
    courseInfo.value.sections[dragSectionIndex].subsections[subsectionIndex].contents.splice(contentIndex, 0, draggedContent);
    dragContentIndex = null;
    dragSectionIndex = null;
    dragSubsectionIndex = null;
  }
};

const isValidDate = (date) => {
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  return regex.test(date);
};

const saveCourseToServer = async () => {
  try {
    loading.value = true;
    if (isValidDate(courseInfo.value.startDate + ":00.000Z")) {
      courseInfo.value.startDate = await courseInfo.value.startDate + ":00.000Z";
    } else {
      courseInfo.value.startDate = courseInfo.value.startDate + ".000Z";
    }
    if (isValidDate(courseInfo.value.endDate + ":00.000Z")) {
      courseInfo.value.endDate = await courseInfo.value.endDate + ":00.000Z";
    } else {
      courseInfo.value.endDate = courseInfo.value.endDate + ".000Z";
    }
    console.log(courseInfo.value);
    if (courseInfo.value.id) {
      try {
        await updateCourse(courseInfo.value.id, courseInfo.value);
        courseInfo.value = await useEditingCourseId(id, true);
      } catch (error) {
        console.error('Error:', error);
      }

    } else {
      await saveCourse(courseInfo.value);
    }
    useCourses(true)
    courseInfo.value.startDate = courseInfo.value.startDate.slice(0, -8);
    courseInfo.value.endDate = courseInfo.value.endDate.slice(0, -8);
    complete.value = true;
  } catch (error) {
    if (error.status) {
      switch (error.status) {
        case 400:
          $toast.add({severity: "warn", summary: "Ошибка", detail: "Введите название курса", life: 5000});
          break;
        default:
          $toast.add({severity: "warn", summary: "Ошибка", detail: "Внутренняя ошибка сервера", life: 5000});
      }
    } else {
      $toast.add({severity: "warn", summary: "Ошибка", detail: "Произошла неизвестная ошибка", life: 5000});
    }
  } finally {
    loading.value = false;
  }
};

const createSubsection = (index) => {
  courseInfo.value.sections[index].subsections.push({
    name: `Подтема ${courseInfo.value.sections[index].subsections.length + 1}`,
    open: true,
    contents: [],
    editing: false
  });
  $toast.add({severity: "success", summary: "Успешно", detail: "Создана подтема", life: 3000});
};

function videoId(videoUrl) {
  try {
    const params = new URLSearchParams(new URL(videoUrl).search);
    return params.get("v") ?? "";
  } catch (error) {
    console.error(`Ошибка извлечения данных из ссылки ${error}`);
    return "";
  }
}

const toggleFolder = (event) => {
  op.value[0].toggle(event);
};

const openTask = (task) => {
  currentTask.value = task;
  taskOpenDialog.value = true;
};

function openFullSizeImage() {
  if (courseInfo.value.imageUrl) {
    isModalActive.value = true;
  }
}
function closeModal() {
  isModalActive.value = false;
}

const loadLogo = async () => {
  try {
    const input = document.querySelector('.input-form input[type="file"]');
    if (!input || !input.files || input.files.length === 0) {
      throw new Error("Файл не выбран");
    }

    let data = new FormData();
    data.append('files', input.files[0]);

    const response = await fetch(`${runtimeConfig.public.apiBase}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': token.value,
      },
      body: data
    });

    if (!response.ok) {
      throw new Error('Ошибка при загрузке файла');
    }

    const result = await response.json();

    switch (response.status) {
      case 200:
        $toast.add({severity: "success", summary: "Успешно", detail: "Логотип загружен", life: 3000});
        break;
      case 500:
        alert('Файл не выбран');
        break;
      default:
        alert('Неизвестная ошибка');
    }

    courseInfo.value.imageUrl = result.files[0].path;
  } catch (error) {
    console.error("Невозможно отправить запрос", error);
    alert(`Ошибка: ${error.message}`);
  }
};

const previewLogo = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      logoPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
    loadLogo();  // Call the loadLogo function when a file is selected
  }
};
function removeLogo() {
  courseInfo.value.imageUrl = null; // Сбрасываем предпросмотр изображения
  const input = document.querySelector('.input-form input[type="file"]');
  input.value = ''; // Сбрасываем выбранный файл
}
const handleImageError = (event) => {
  if (!event.target.dataset.replaced) {
    event.target.src = "../../assets/imgs/no_course_photo.png";
    event.target.dataset.replaced = "true";
  }
};
</script>

<template>
  <AwCheckmark :complete="complete" @toggleComplete="complete = !complete"/>
  <TheLoader v-if="loading"></TheLoader>
  <div class="main-content" style="flex-direction: column; align-content: center; gap: 20px">
    <div class="flex justify-between align-center items-center w-full">
      <h1>{{ courseInfo.name ? courseInfo.name : "Без названия" }}</h1>
      <Button label="Сохранить" @click="saveCourseToServer()"></Button>
    </div>
    <div class="wrapper-tab">
      <AwTabsWrapper>
        <AwTab title="Содержание" style="width: 80%;">
          <!-- Логика добавления секций -->
          <div class="sections">
            <div v-for="(section, index) in courseInfo.sections" :key="index" class="">
              <div class="section-wrapper" @click="toggleSection(index)">
                <div class="section">
                  <div class="flex flex-nowrap items-center gap-2">
                    <i class="pi pi-bars drag-icon move" @click.stop
                       :draggable="dragContentIndex === null"
                       @dragstart="dragStart(index)"
                       @dragover.prevent
                       @drop="drop(index)"
                    ></i>
                    <i :class="section.open ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
                    <input ref="inputField" v-model="section.name" class="section-title-input text-2xl"
                           v-if="section.editing"
                           @keydown.enter="saveSectionName(index)" @blur="saveSectionName(index)" @click.stop/>
                    <span v-else class="select-none text-2xl">{{ section.name }}</span>
                  </div>
                  <div class="section-buttons flex gap-2 items-center">
                    <Button icon="pi pi-pencil" class="edit-section-btn" @click.stop="editSectionName(index)"/>
                    <Button v-if="index !== 0" icon="pi pi-times" class="delete-section-btn"
                            @click.stop="deleteSection(index)"/>
                  </div>
                </div>
                <div class="section-content" v-if="section.open" @click.stop>


                  <!-- Логика добавление подтемы -->
                  <div class="flex flex-col gap-3">
                    <div v-for="(subsection, subsectionIndex) in courseInfo.sections[index].subsections"
                         :key="subsectionIndex" class="">
                      <div class="section-wrapper" @click="toggleSubsection(index,subsectionIndex)">
                        <div class="section">
                          <div class="flex flex-nowrap items-center gap-2">
                            <i class="pi pi-bars drag-icon move" @click.stop
                               :draggable="dragContentIndex === null"
                               @dragstart="dragStart(index,subsectionIndex)"
                               @dragover.prevent
                               @drop="dropSubsection(index,subsectionIndex)"
                            ></i>
                            <i :class="subsection.open ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
                            <input ref="inputField" v-model="subsection.name" class="section-title-input text-2xl"
                                   v-if="subsection.editing"
                                   @keydown.enter="saveSubsectionName(index,subsectionIndex)"
                                   @blur="saveSubsectionName(index,subsectionIndex)" @click.stop/>
                            <span v-else class="select-none text-2xl">{{ subsection.name }}</span>
                          </div>
                          <div class="section-buttons flex gap-2 items-center">
                            <Button icon="pi pi-pencil" class="edit-section-btn"
                                    @click.stop="editSubsectionName(index,subsectionIndex)"/>
                            <Button icon="pi pi-times" class="delete-section-btn"
                                    @click.stop="deleteSubsection(index,subsectionIndex)"/>
                          </div>
                        </div>
                        <div class="section-content" v-if="subsection.open" @click.stop>
                          <div class="flex items-start" v-for="(content, contentIndex) in subsection.contents"
                               :key="contentIndex"
                               :draggable="true"
                               @dragstart="dragStart(index, subsectionIndex, contentIndex)"
                               @dragover.prevent
                               @drop="dropSubsectionContent(subsectionIndex, contentIndex)">
                            <div class="flex flex-col w-full gap-4">
                                <label
                                    v-if="!content.urlItem && content.materials?.length <= 0 && content.folders?.length <= 0 && !content.urlVideo && content.tasks?.length <= 0"
                                    class="title-content">
                                  {{ content.title }}
                                </label>
                                <div v-if="content.tasks && content.tasks[0]" class="content-wrapper" @click="openTask(content.tasks[0])">
                                  <div class="content-wrapper-header">
                                    <i class="pi pi-graduation-cap text-lg"></i>
                                    <label class="text-[18px]">{{ content.tasks[0].name }}</label>
                                  </div>
                                </div>
                                <a v-else-if="content.urlItem" :href="content.urlItem" class="content-wrapper text-lg cursor-alias">
                                  <div class="content-wrapper-header">
                                    <FontAwesomeIcon :icon="faLink" class="file-icon"/>
                                    {{ content.title }}
                                  </div>
                                  <div class="file-extension lowercase">
                                    {{ getDomainFromUrl(content.urlItem) }}
                                  </div>
                                </a>
                              <p v-if="content.content" class="text-lg">{{ content.content }}</p>
                              <!-- Предположим, что содержимое материала отображается как текст -->
                              <div v-if="content.materials && content.materials.length > 0" class="files-container">
                                <div v-for="(material, index) in content.materials" :key="index" class="w-full">
                                  <a :href="material.path" download class="content-wrapper">
                                    <div class="content-wrapper-header">
                                      <div class="file-icon-wrapper">
                                        <FontAwesomeIcon :icon="getFileIcon(material.name)" class="file-icon"/>
                                      </div>
                                      <span class="file-name text-lg">{{ content.title }}</span>
                                    </div>
                                    <div class="file-extension">{{ getFileExtension(material.name) }}</div>
                                  </a>
                                </div>
                              </div>
                              <div v-if="content.urlVideo" class="video-container">
                                <div class="flex gap-2 items-center text-lg">
                                  <FontAwesomeIcon :icon="faYoutube" class="file-icon text-lg"/>
                                  {{ content.title }}
                                </div>
                                <iframe v-if="content.urlVideo.includes('youtube.com/watch?v=')"
                                        width="560" height="315"
                                        :srcdoc="`<style>*{padding:0;margin:0;overflow:hidden}html,body{height:100%}img{position:absolute;width:100%;top:0;bottom:0;margin:auto}button{position:absolute;width:100%;height:100%;top:0;left:0;z-index:1;background:rgba(0,0,0,0.5);color:white;font-size:20px;border:none;cursor:pointer}button:hover{background:rgba(0,0,0,0.7)}</style><a href=https://www.youtube.com/embed/${videoId(content.urlVideo)}?autoplay=1><img src=https://img.youtube.com/vi/${videoId(content.urlVideo)}/hqdefault.jpg alt='${content.title}'><button>Нажмите для воспроизведения</button></a>`"
                                        frameborder="0"
                                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                        allowfullscreen>
                                </iframe>
                              </div>
                              <div v-if="content.folders && content.folders?.length > 0" class="folder-container">
                                <div v-for="(folder, folderIndex) in content.folders" :key="folderIndex" class="flex flex-col">
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
                            </div>
                            <div class="section-buttons flex gap-2 items-center">
                              <Button icon="pi pi-pencil" class="edit-section-btn"
                                      @click.stop="editSubsectionContent(index, content.id)"/>
                              <Button icon="pi pi-trash" class="delete-content-btn"
                                      @click="deleteSubsectionContent(index, subsectionIndex, contentIndex)"/>
                            </div>
                          </div>
                          <div class="w-full flex justify-center">
                            <Button label="" icon="pi pi-plus" class="add-content-btn"
                                    @click="addContent(index, subsectionIndex)"/>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Логика добавления материалов -->
                  <div class="flex items-start" v-for="(content, contentIndex) in section.contents" :key="contentIndex"
                       :draggable="true"
                       @dragstart="dragStart(index, null,contentIndex)"
                       @dragover.prevent
                       @drop="dropContent(index, contentIndex)">
                    <div class="flex flex-col w-full gap-4">
                      <label
                          v-if="!content.urlItem && content.materials?.length <= 0 && content.folders?.length <= 0 && !content.urlVideo && content.tasks?.length <= 0"
                          class="title-content">
                        {{ content.title }}
                      </label>
                      <div v-if="content.tasks && content.tasks[0]" class="content-wrapper" @click="openTask(content.tasks[0])">
                        <div class="content-wrapper-header">
                          <i class="pi pi-graduation-cap text-lg"></i>
                          <label class="text-[18px]">{{ content.tasks[0].name }}</label>
                        </div>
                      </div>
                      <a v-else-if="content.urlItem" :href="content.urlItem" class="content-wrapper text-lg cursor-alias">
                        <div class="content-wrapper-header">
                          <FontAwesomeIcon :icon="faLink" class="file-icon"/>
                          {{ content.title }}
                        </div>
                        <div class="file-extension lowercase">
                          {{ getDomainFromUrl(content.urlItem) }}
                        </div>
                      </a>
                      <p v-if="content.content" class="text-lg">{{ content.content }}</p>
                      <!-- Предположим, что содержимое материала отображается как текст -->
                      <div v-if="content.materials && content.materials.length > 0" class="files-container">
                        <div v-for="(material, index) in content.materials" :key="index" class="w-full">
                          <a :href="material.path" download class="content-wrapper">
                            <div class="content-wrapper-header">
                              <div class="file-icon-wrapper">
                                <FontAwesomeIcon :icon="getFileIcon(material.name)" class="file-icon"/>
                              </div>
                              <span class="file-name text-lg">{{ content.title }}</span>
                            </div>
                            <div class="file-extension">{{ getFileExtension(material.name) }}</div>
                          </a>
                        </div>
                      </div>
                      <div v-if="content.urlVideo" class="video-container">
                        <div class="flex gap-2 items-center text-lg">
                          <FontAwesomeIcon :icon="faYoutube" class="file-icon text-lg"/>
                          {{ content.title }}
                        </div>
                        <iframe v-if="content.urlVideo.includes('youtube.com/watch?v=')"
                                width="560" height="315"
                                :srcdoc="`<style>*{padding:0;margin:0;overflow:hidden}html,body{height:100%}img{position:absolute;width:100%;top:0;bottom:0;margin:auto}button{position:absolute;width:100%;height:100%;top:0;left:0;z-index:1;background:rgba(0,0,0,0.5);color:white;font-size:20px;border:none;cursor:pointer}button:hover{background:rgba(0,0,0,0.7)}</style><a href=https://www.youtube.com/embed/${videoId(content.urlVideo)}?autoplay=1><img src=https://img.youtube.com/vi/${videoId(content.urlVideo)}/hqdefault.jpg alt='${content.title}'><button>Нажмите для воспроизведения</button></a>`"
                                frameborder="0"
                                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen>
                        </iframe>
                      </div>
                      <div v-if="content.folders && content.folders?.length > 0" class="folder-container">
                        <div v-for="(folder, folderIndex) in content.folders" :key="folderIndex" class="flex flex-col">
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
                    </div>
                    <div class="section-buttons flex gap-2 items-center">
                      <Button icon="pi pi-pencil" class="edit-section-btn"
                              @click.stop="editSubsectionContent(index, content.id)"/>
                      <Button icon="pi pi-trash" class="delete-content-btn"
                              @click="deleteContent(index, contentIndex)"/>
                    </div>
                  </div>
                  <div class="w-full flex justify-center">
                    <Button label="Добавить материал" icon="pi pi-plus" class="add-content-btn mt-2"
                            @click="addContent(index)"/>
                  </div>
                </div>
              </div>
              <div class="flex items-center mt-3 justify-center">
                <div class="dashed-line left"></div>
                <Button icon="pi pi-plus" class="add-section-btn" rounded outlined @click="addSection(index)"/>
                <div class="dashed-line right"></div>
              </div>
            </div>
            <!-- Модальное окно для добавления материалов -->
            <Dialog v-model:visible="showModal" :style="{width: '450px'}" header="Тип материала" :modal="true"
                    dismissableMask
                    class="p-fluid">
              <div class="p-3 grid grid-cols-3 gap-4">
                <Button label="Текст" icon="pi pi-align-justify" class="p-button-text w-min"
                        @click="selectTypeContent('text')"/>
                <Button label="Подтема" icon="pi pi-clone" class="p-button-text w-min"
                        @click="createSubsection(selectedSectionIndex)"/>
                <Button label="Ссылка" icon="pi pi-link" class="p-button-text w-min"
                        @click="selectTypeContent('urlItem')"/>
                <Button label="Видео (ссылка)" icon="pi pi-video" class="p-button-text w-min"
                        @click="selectTypeContent('urlVideo')"/>
                <Button label="Файл" icon="pi pi-file" class="p-button-text w-min" @click="selectTypeContent('file')"/>
                <Button label="Папка" icon="pi pi-folder" class="p-button-text w-min"
                        @click="selectTypeContent('folder')"/>
                <Button label="Задание" icon="pi pi-graduation-cap" class="p-button-text w-min"
                        @click="selectTypeContent('tasks')"/>
              </div>
              <template #footer>
                <Button label="Отмена" icon="pi pi-times" class="p-button-text w-min" @click="showModal = false"/>
              </template>
            </Dialog>

          </div>
        </AwTab>
        <AwTab title="Настройки" style="width: 42.5%">
          <div>
            <form @submit.prevent="" class="flex gap-3 flex-col items-stretch">
              <div class="">
                <label for="name" class="block text-lg font-medium">Название курса</label>
                <input v-model="courseInfo.name" type="text" id="name" name="name" :placeholder="courseInfo.name"
                       class="inpt mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-lg border-gray-300 rounded-md">
              </div>
              <div class="">
                <label for="description" class="block text-lg font-medium">Описание курса</label>
                <textarea v-model="courseInfo.description" id="description" name="description" rows="3"
                          class="inpt mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-lg border-gray-300 rounded-md"></textarea>
              </div>
              <div class="input-form">
                <label class="block text-lg font-medium" for="logo">Логотип курса</label>
                <div class="image-preview-container">
                  <img :src="courseInfo.imageUrl?`${courseInfo.imageUrl}`:'../../assets/imgs/no_course_photo.png'" alt="logo" class="max-h-[300px]"
                       @error="handleImageError"
                       @click="openFullSizeImage">
                  <div class="icon-close close-button" v-if="courseInfo.imageUrl" @click="removeLogo"></div>
                  <teleport to="body">
                    <AwModal @close="isModalActive =! isModalActive" :modalActive="isModalActive">
                      <div class="modal-content">
                        <img v-if="courseInfo.imageUrl" :src="courseInfo.imageUrl" alt="logo" style="max-width: 100%; max-height: 100%;">
                      </div>
                    </AwModal>
                  </teleport>
                </div>
                <input type="file" name="logo" id="logo" @change="previewLogo">
              </div>
              <div class="flex items-center gap-2 align-center">
                <label class="block text-lg font-medium">Курс доступен к прохождению</label>
                <input v-model="courseInfo.isActive" type="checkbox"
                       class="form-checkbox checkbox m-0 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
              </div>
              <div class="">
                <label for="start_date" class="block text-lg font-medium">Дата начала курса</label>
                <input v-model="courseInfo.startDate" type="datetime-local" id="start_date" name="start_date"
                       @change="updateStartDate"
                       class="inpt mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-lg border-gray-300 rounded-md">
              </div>
              <div class="">
                <label for="end_date" class="block text-lg font-medium">Дата окончания курса</label>
                <input v-model="courseInfo.endDate" type="datetime-local" id="end_date" name="end_date"
                       @change="updateEndDate"
                       class="inpt mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-lg border-gray-300 rounded-md">
              </div>
              <div class="">
                <label for="duration_hours" class="block text-lg font-medium">Количество часов</label>
                <input v-model="courseInfo.duration_hours" type="number" id="duration_hours" name="duration_hours"
                       class="inpt mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-lg border-gray-300 rounded-md">
              </div>
              <div class="">
                <label for="category" class="block text-lg font-medium">Категория курса</label>
                <MultiSelect v-model="courseInfo.categories" :options="categories" filter optionLabel="name"
                             placeholder="Выберите категории" class="w-full max-w-full"/>
              </div>
            </form>
          </div>
        </AwTab>
        <AwTab title="Участники" class="flex flex-col gap-5">
          <div class="enrolledStudents-container">
            <!-- Форма поиска и фильтрации -->
            <div class="search-filter-form">
              <div class="flex flex-wrap gap-3">
                <div class="mb-4">
                  <label for="search" class="block text-lg font-medium mb-1">ФИО</label>
                  <input type="text" v-model="searchQuery" id="search" name="search" placeholder="Введите ФИО"
                         class="inpt form-input rounded-md shadow-sm w-full">
                </div>
                <div class="mb-4">
                  <label for="groups" class="block text-lg font-medium mb-1">Группа</label>
                  <select v-model="selectedGroup" id="group" name="group"
                          class="form-select rounded-md shadow-sm w-full">
                    <option :value=null>Все группы</option>
                    <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.abbreviation }}</option>
                  </select>
                </div>
                <div class="mb-4">
                  <label for="lastNameLetter" class="block text-lg font-medium mb-1">Первая буква
                    фамилии:</label>
                  <select v-model="selectedLetter" id="lastNameLetter" name="lastNameLetter"
                          class="form-select rounded-md shadow-sm w-full">
                    <option :value=null>Все буквы</option>
                    <option v-for="letter in alphabet" :key="letter" :value="letter">{{ letter }}</option>
                  </select>
                </div>
              </div>
              <Button label="Сбросить фильтры" icon="pi pi-times" class="p-button-secondary w-[15rem]" @click="resetFilters"/>
            </div>
            <Divider/>
            <div class="w-full">
              <div class="flex justify-between w-full items-center mb-2">
                <label class="block text-2xl font-medium mb-3">Выбор участников</label>
                <Button label="Добавить" icon="pi pi-check" class="p-button-success"
                        :disabled="!selectedSearchItems.length > 0"
                        @click="addSelectedParticipants"/>
              </div>
              <!-- Таблица с результатами поиска -->
              <DataTable :value="filteredResults" showGridlines :paginator="true" :rows="10"
                         tableStyle="min-width: 35rem"
                         v-model:selection="selectedSearchItems">
                <Column selectionMode="multiple" style="width: 1rem"></Column>
                <Column field="fullname" header="ФИО" style="width: 70%"></Column>
                <Column field="groups" header="Группа" style="width: 25%">
                  <template #body="{ data }">
        <span v-for="(group, index) in data.groups" :key="index">
          {{ group.abbreviation }}{{ index === data.groups.length - 1 ? "" : ", " }}
        </span>
                  </template>
                </Column>
                <Column :exportable="false" style="width: 1rem">
                  <template #body="slotProps">
                    <Button icon="pi pi-plus" class="p-button-success" @click="addParticipant(slotProps.data)"></Button>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
          <div class="flex flex-col gap-5">
            <div class="flex justify-between w-full items-center">
              <span class="text-2xl font-medium">Участники</span>
              <Button label="Удалить" icon="pi pi-times" class="p-button-danger h-min"
                      :disabled="!selectedParticipantsItems.length > 0"
                      @click="removeSelectedParticipants"/>
            </div>
            <!-- Таблица с выбранными участниками -->
            <DataTable v-model:selection="selectedParticipantsItems" :value="displaySelectedParticipants" showGridlines
                       :paginator="true" :rows="10" tableStyle="min-width: 30rem">
              <Column selectionMode="multiple" style="width: 1rem"></Column>
              <Column field="fullname" header="ФИО" style="width: 70%"></Column>
              <Column field="groups" header="Группа" style="width: 25%">
                <template #body="{ data }">
          <span v-for="(group, index) in data.groups" :key="index">{{
              group.abbreviation
            }}{{ index === data.groups.length - 1 ? "" : ", " }}</span>
                </template>
              </Column>
              <Column :exportable="false" style="width: 1rem">
                <template #body="slotProps">
                  <Button icon="pi pi-trash" class="p-button-danger"
                          @click="removeParticipant(slotProps.data)"></Button>
                </template>
              </Column>
            </DataTable>
          </div>
        </AwTab>
        <AwTab title="Владельцы" class="flex flex-col gap-5">
          <div class="enrolledStudents-container">
            <!-- Форма поиска и фильтрации -->
            <div class="search-filter-form">
              <div class="flex flex-wrap gap-3">
                <div class="mb-4">
                  <label for="searchOwners" class="block text-lg font-medium mb-1">ФИО</label>
                  <input type="text" v-model="searchOwnersQuery" id="searchOwners" name="searchOwners" placeholder="Введите ФИО"
                         class="inpt form-input rounded-md shadow-sm w-full">
                </div>
                <div class="mb-4">
                  <label for="groupsOwners" class="block text-lg font-medium mb-1">Группа</label>
                  <select v-model="selectedOwnersGroup" id="groupsOwners" name="groupsOwners"
                          class="form-select rounded-md shadow-sm w-full">
                    <option :value=null>Все группы</option>
                    <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.abbreviation }}</option>
                  </select>
                </div>
                <div class="mb-4">
                  <label for="lastNameLetterOwners" class="block text-lg font-medium mb-1">Первая буква фамилии:</label>
                  <select v-model="selectedOwnersLetter" id="lastNameLetterOwners" name="lastNameLetterOwners"
                          class="form-select rounded-md shadow-sm w-full">
                    <option :value=null>Все буквы</option>
                    <option v-for="letter in alphabet" :key="letter" :value="letter">{{ letter }}</option>
                  </select>
                </div>
              </div>
              <Button label="Сбросить фильтры" icon="pi pi-times" class="p-button-secondary w-[15rem]" @click="resetOwnersFilters"/>
            </div>
            <Divider/>
            <div class="w-full">
              <div class="flex justify-between w-full items-center mb-2">
                <label class="block text-2xl font-medium mb-3">Выбор владельцев</label>
                <Button label="Добавить" icon="pi pi-check" class="p-button-success"
                        :disabled="!selectedOwnersSearchItems.length > 0"
                        @click="addSelectedOwners"/>
              </div>
              <!-- Таблица с результатами поиска владельцев -->
              <DataTable :value="filteredOwnersResults" showGridlines :paginator="true" :rows="10"
                         tableStyle="min-width: 35rem"
                         v-model:selection="selectedOwnersSearchItems">
                <Column selectionMode="multiple" style="width: 1rem"></Column>
                <Column field="fullname" header="ФИО" style="width: 70%"></Column>
                <Column field="groups" header="Группа" style="width: 25%">
                  <template #body="{ data }">
              <span v-for="(group, index) in data.groups" :key="index">
                {{ group.abbreviation }}{{ index === data.groups.length - 1 ? "" : ", " }}
              </span>
                  </template>
                </Column>
                <Column :exportable="false" style="width: 1rem">
                  <template #body="slotProps">
                    <Button icon="pi pi-plus" class="p-button-success" @click="addOwner(slotProps.data)"></Button>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
          <div class="flex flex-col gap-5">
            <div class="flex justify-between w-full items-center">
              <span class="text-2xl font-medium">Владельцы</span>
              <Button label="Удалить" icon="pi pi-times" class="p-button-danger h-min"
                      :disabled="!selectedOwnersItems.length > 0"
                      @click="removeSelectedOwners"/>
            </div>
            <!-- Таблица с выбранными владельцами -->
            <DataTable v-model:selection="selectedOwnersItems" :value="displaySelectedOwners" showGridlines
                       :paginator="true" :rows="10" tableStyle="min-width: 30rem">
              <Column selectionMode="multiple" style="width: 1rem"></Column>
              <Column field="fullname" header="ФИО" style="width: 70%"></Column>
              <Column field="groups" header="Группа" style="width: 25%">
                <template #body="{ data }">
                  <span v-for="(group, index) in data.groups" :key="index">{{ group.abbreviation }}{{ index === data.groups.length - 1 ? "" : ", " }}</span>
                </template>
              </Column>
              <Column :exportable="false" style="width: 1rem">
                <template #body="slotProps">
                  <Button icon="pi pi-trash" class="p-button-danger"
                          @click="removeOwner(slotProps.data)"></Button>
                </template>
              </Column>
            </DataTable>
          </div>
        </AwTab>
      </AwTabsWrapper>
    </div>
  </div>
  <Dialog v-model:visible="taskOpenDialog" modal :header="currentTask.name"  class="max-w-[700px]"
          dismissableMask>
    <div class="flex flex-col p-3 gap-3">
      <p>{{ currentTask.text }}</p>
      <div v-if="currentTask.materials.length > 0" class="files-container">
        <div v-for="(material, index) in currentTask.materials" :key="index" class="w-full">
          <a :href="material.path" download class="content-wrapper">
            <div class="content-wrapper-header">
              <div class="file-icon-wrapper">
                <FontAwesomeIcon :icon="getFileIcon(material.name)" class="file-icon"/>
              </div>
              <span class="file-name text-lg">{{ material.name }}</span>
            </div>
            <div class="file-extension">{{ getFileExtension(material.name) }}</div>
          </a>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

p {
  margin: 0;
}

.drag-icon {
  cursor: grab; /* Изменение курсора */
  font-size: 18px; /* Размер иконки */
  color: #333; /* Цвет иконки */
}

.dashed-line {
  width: 45%;
  height: 1px;
  margin: 10px 10px; /* Отступы */
}

.left {
  background: linear-gradient(to right, #fff 0%, #fff 50%, #e2e8f0 50%);
  background-size: 45px 1px;
  color: #e2e8f0;
  float: left; /* Выравнивание по левому краю */
}

.right {
  background: linear-gradient(to left, #fff 0%, #fff 50%, #e2e8f0 50%);
  background-size: 45px 1px;
  color: #e2e8f0;
  float: right; /* Выравнивание по правому краю */
}

.close-button {
  position: absolute;
  right: 5px;
  top: 0;
  padding: 5px;
  border-radius: 5px;
}

.main-content {
  gap: 0 !important;
  border-radius: 20px;
  max-width: 1500px !important;
  padding: 20px;
  align-items: center;
  @include theme('background', $general-background-light);
}

.wrapper-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.p-multiselect {
  padding: 25px 20px;
  border-radius: 15px;
  margin: 10px 0;
}

.enrolledStudents-container {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
}

.search-filter-form {
  display: flex;
  flex-direction: column;
}

.search-bar input {
  width: 200px;
}

.filter-bar .p-dropdown {
  width: 200px;
}

.p-button {
  padding: 0.5rem;
}

.p-multiselect-filter-container {
  border: 2px solid red !important;
}

.checkbox {
  // Увеличение размера чекбокса
  input[type="checkbox"] {
    transform: scale(3); // Увеличиваем размер в 1.5 раза
  }
}

/* Стили для секций и материалов */
.sections {
  display: flex;
  flex-direction: column;
  gap: 20px; /* Расстояние между секциями */
}

.section-wrapper {
  border: 1px solid #e2e8f0; /* Цвет и стиль обводки секции */
  border-radius: 8px; /* Закругление углов обводки */
  padding: 10px; /* Отступ внутри обводки */
  cursor: pointer; /* Изменение курсора при наведении */
}

.section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.sections .section-title-input {
  width: 60%;
  border-radius: 5px;
  border: 2px solid black;
  background: transparent;
  font-weight: inherit;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.section-content {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  .content-header {
    height: 37px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .content1 {
    margin-bottom: 10px;
  }
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
}

.material-types {
  padding: 10px;
  gap: 10px 5px;
}

.files-container {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.file-link {
  display: flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
  color: inherit;
  position: relative;
}

.file-icon-wrapper {
  font-size: 24px; /* Размер иконки */
}

.file-icon {
  font-size: inherit; /* Наследование размера шрифта */
}
</style>