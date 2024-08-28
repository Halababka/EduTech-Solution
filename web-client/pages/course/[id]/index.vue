<script setup lang="ts">
import {fetchCourse} from "~/helpers/courses";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
import {
  faFileAlt,
  faFileArchive, faFileAudio,
  faFileExcel, faFileImage,
  faFilePdf,
  faFilePowerpoint, faFileVideo,
  faFileWord,
  faLink, faFolder
} from "@fortawesome/free-solid-svg-icons";
import {faYoutube} from "@fortawesome/free-brands-svg-icons";
import {getFileExtension, getFileIcon, videoId} from "~/helpers/files";
import {useUser} from "~/composables/user";

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
  video: faYoutube, // Пример иконки для неизвестных файлов
  // Добавьте другие расширения и соответствующие им иконки по мере необходимости
};

definePageMeta({layout: 'home'});

const runtimeConfig = useRuntimeConfig();
const route = useRoute()
const router = useRouter()

const token = useCookie('token')
const loading = ref(false)
const op = ref();
const user = (await useUser()).value

const hasCreateCoursesPermission = ref(null)
const courseData = ref({})

onMounted(() => {
  getCourse()
})

watchEffect(() => {
  if (!user.pending) {
    const isCourseOwner = courseData.value.course_owners?.some(owner => owner.id === user.userData.id);
    hasCreateCoursesPermission.value = user.userData.permissions.some(permission => permission.code === 'CREATE_COURSES') || isCourseOwner;
  }
})
const getCourse = async () => {
  loading.value = true;
  try {
    await fetchCourse(route.params.id)
        .then(data => {
          console.log("data", data)
          courseData.value = data
          useHead({
            title: courseData.value.name,
          });
          initializeActiveIndices();
        })
  } catch (error) {
    console.error('Error fetch Course:', error);
  } finally {
    loading.value = false;
  }
}

// Методы для управления состоянием раскрытия/сокрытия всех секций
const activeIndices = ref({});
const activeIndex = ref<number | number[] | null>(null);

const expandAll = () => {
  initializeActiveIndices();
};

const collapseAll = () => {
  activeIndex.value = null;
};

const toggleFolder = (event) => {
  op.value[0].toggle(event);
}

const initializeActiveIndices = () => {
  courseData.value.sections.forEach((section, index) => {
    activeIndices.value[index] = Array.from({length: section.subsections?.length || 0}, (_, i) => i);
  });
  activeIndex.value = Array.from({length: courseData.value.sections.length}, (_, i) => i);
};

// Вычисляемое свойство для активных индексов
const activeSectionIndices = computed(() => {
  return Array.from({length: courseData.value.sections?.length || 0}, (_, i) => i);
});

const activeSubsectionIndices = (sectionIndex) => {
  return activeIndices.value[sectionIndex] || [];
};

const items = ref([
  {
    label: 'Редактировать',
    icon: 'pi pi-pencil',
    command: () => {
      router.push(`/course/create?id=${route.params.id}`)
    }
  },
  {
    label: 'Ответы',
    icon: 'pi pi-file',
    command: () => {
      router.push(`/course/${route.params.id}/tasks`)
    }
  }
])
const home = ref({icon: 'pi pi-home'});
const menu = ref();
const toggle = (event) => {
  menu.value.toggle(event);
};
</script>

<template>
  <TheLoader v-if="loading"></TheLoader>
  <div class="main-content white-box">
    <div class="flex flex-col align-center items-center gap-5 mb-5">
      <div class="flex items-center align-center gap-2">
        <h1 class="m-2">{{ courseData.name }}</h1>
        <div v-if="hasCreateCoursesPermission" class="card flex justify-content-center">
          <Button type="button" icon="pi pi-ellipsis-v" @click="toggle" aria-haspopup="true"
                  aria-controls="overlay_menu"/>
          <Menu ref="menu" id="overlay_menu" :model="items" :popup="true"/>
        </div>
      </div>
      <p class="text-xl">{{ courseData.description }}</p>
    </div>
    <TabView :scrollable="true" class="w-full" pt:tabpanel:headerTitle:class="text-2xl">
      <TabPanel :header="`Общий вид`" contentClass="flex flex-col gap-3">
        <div class="flex justify-start">
          <Button @click="expandAll" class="btn-primary mr-2">Развернуть</Button>
          <Button @click="collapseAll" class="btn-secondary">Свернуть</Button>
        </div>
        <Accordion :multiple="true" :activeIndex="activeIndex" pt:accordiontab:headerTitle:class="text-xl font-medium">
          <AccordionTab :header="section.name" v-for="(section, index) in courseData.sections" :key="index"
                        class="section-all">
            <Accordion :multiple="true"
                       :activeIndex="activeSubsectionIndices(index)"
                       class="mb-3" pt:accordiontab:content:class="p-8"
                       pt:accordiontab:headerTitle:class="text-xl font-medium">
              <AccordionTab :header="subsection.name" v-for="(subsection, subsectionIndex) in section.subsections"
                            :key="subsectionIndex" class="section-all">
                <div class="section-content">
                  <div v-for="(content, index) in subsection.section_content" :key="index" class="flex gap-3 flex-col">
                    <TheCourseSectionContent :content="content"></TheCourseSectionContent>
                  </div>
                </div>
              </AccordionTab>
            </Accordion>
            <div class="section-content">
              <div v-for="(content, index) in section.section_content" :key="index" class="flex gap-3 flex-col">
                <TheCourseSectionContent :content="content"></TheCourseSectionContent>
              </div>
            </div>
          </AccordionTab>
        </Accordion>
      </TabPanel>

      <TabPanel v-for="(section, index) in courseData.sections" :key="index" :header="section.name">
        <Accordion :multiple="true" :activeIndex="activeSubsectionIndices(index)" class="mb-3"
                   pt:accordiontab:headerTitle:class="text-xl font-medium">
          <AccordionTab :header="subsection.name" v-for="(subsection, subsectionIndex) in section.subsections"
                        :key="subsectionIndex" class="section-all">
            <div class="section-content">
              <div v-for="(content, index) in subsection.section_content" :key="index" class="flex gap-3 flex-col">
                <TheCourseSectionContent :content="content"></TheCourseSectionContent>
              </div>
            </div>
          </AccordionTab>
        </Accordion>
        <div class="section-content">
          <div v-for="(content, index) in section.section_content" :key="index" class="flex gap-3 flex-col">
            <TheCourseSectionContent :content="content"></TheCourseSectionContent>
          </div>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<style scoped lang="scss">
@use 'assets/scss/main' as *;

.main-content {
  padding: 20px 50px !important;
  max-width: 1500px;
}

.section-all {
  padding: 10px;
  border-radius: 5px;
  border: 1px solid;
  @include theme('border-color', $primary-color);
}

p {
  margin: 0;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: flex-start;
}
</style>