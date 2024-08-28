<script setup lang="ts">

import {getAllTasksOnCourse, gradeAnswer} from "~/helpers/tasks";
import {getPermissionsFullNames} from "~/helpers/permission";
import {FilterMatchMode} from "primevue/api";
import {getGroupFullNames} from "~/helpers/groups";
import {formatDate} from "~/helpers/date";
import {getFileExtension, getFileIcon} from "~/helpers/files";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

definePageMeta({layout: 'home'});
useHead({
  title: "Ответы"
});

const {$toast} = useNuxtApp()
const runtimeConfig = useRuntimeConfig();
const route = useRoute()
const router = useRouter()
const token = useCookie('token')

const columns = ref([
  {field: 'student.fullname', header: 'ФИО'},
  {field: 'grade', header: 'Оценка'},
  {field: 'submitted', header: 'Отправлено'},
]);

const groups = ref()
const loading = ref(false)
const tasks = ref([])
const task = ref({})
const grade = ref()

const answer = ref({
  student: {}
})
const answerDialog = ref(false)


onMounted(() => {
  fetchTasks()
  loadGroups()
})

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

const openAnswerDialog = (anw) => {
  console.log("anw", anw)
  answer.value = anw
  answerDialog.value = true
};

const hideAnswerDialog = () => {
  answer.value = {
    student: {}
  }
  answerDialog.value = false;
};

const fetchTasks = async () => {
  try {
    const response = await getAllTasksOnCourse(route.params.id);
    tasks.value = response
    task.value = tasks.value[0]
  } catch (error) {
    $toast.add({severity: 'error', summary: 'Ошибка', detail: error.message, life: 3000});
  }
}

const handleGradeSubmit = async (answerId) => {
  try {
    const response = await gradeAnswer(answerId, answer.value.grade);
    answer.value.grade = response.grade
    $toast.add({severity: 'success', summary: 'Успешно', detail: 'Оценка выставлена', life: 3000});
  } catch (error) {
    $toast.add({severity: 'error', summary: 'Ошибка', detail: error.message, life: 3000});
  }
};
</script>

<template>
  <div class="main-content white-box">
    <div class="flex flex-col align-center items-center gap-5 mb-5">
      <h1 class="m-2">Ответы к заданиям</h1>
    </div>
    <div class="w-full">
      <div class="card flex flex-col gap-3 justify-center">
        <div class="flex items-center gap-3">
          <span class="text-xl">Выберите задание</span>
          <Button icon="pi pi-refresh" rounded raised @click="fetchTasks"/>
        </div>
        <Dropdown v-model="task" :options="tasks" optionLabel="name" placeholder="Выберите задание"
                  class="w-[30%] md:w-14rem"/>
      </div>
      <Divider class="w-full"/>
      <div v-if="task && task.StudentAssignments?.length > 0">
        <div class="card">
          <DataTable ref="dt" :loading="loading"
                     :value="task.StudentAssignments"
                     selectionMode="checkbox" dataKey="id" :paginator="true" :rows="10"
                     :rowsPerPageOptions="[20, 35, 50]"
                     paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                     currentPageReportTemplate="Показаны {first} до {last} из {totalRecords}"
                     responsiveLayout="scroll" :globalFilterFields="['name']">
            <template #empty>
              <span class="text-lg">Ответы не найдеы</span>
            </template>

            <Column v-for="(col, index) of columns" sortable :field="col.field" :header="col.header"
                    :key="col.field + '_' + index">
              <template v-if="col.field !== 'submitted' && col.field !== 'grade' && col.field !== 'student.fullname'"
                        #body="slotProps">
                {{ slotProps.data[col.field] }}
              </template>
              <template v-else-if="col.field === 'student.fullname'" #body="slotProps">
                <span @click="openAnswerDialog(slotProps.data)">
                 {{ slotProps.data.student.fullname }}
                </span>
              </template>
              <template v-else-if="col.field === 'submitted'" #body="slotProps">
                {{ formatDate(slotProps.data.submitted) }}
              </template>
              <template v-else-if="col.field === 'grade'" #body="slotProps">
                {{ slotProps.data.grade ? slotProps.data.grade : "Нету оценки" }}
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>
    <Dialog v-model:visible="answerDialog" :header="answer.student.fullname" modal dismissableMask class="w-[40rem]"
            @hide="hideAnswerDialog">
      <div class="flex flex-col gap-3 py-5">
        <label class="text-xl">Оценка</label>
        <div v-if="answer.materials?.length > 0" class="flex gap-4 items-center">
          <InputNumber v-model="answer.grade" inputId="minmax" :min="0" :max="100" placeholder="Не оценено"/>
          <div>
            <Button label="Выставить" type="submit" @click="handleGradeSubmit(answer.id)"></Button>
          </div>
        </div>
        <div v-else>Нету ответа</div>
        <label class="text-xl">Ответ</label>
        <div v-if="answer.materials?.length > 0" class="file-folder-wrapper mb-3">
          <a :href="material.path" download class="content-wrapper pl-3"
             v-for="(material, materialIndex) in answer.materials" :key="materialIndex">
            <div class="content-wrapper-header">
              <div class="file-icon-wrapper">
                <FontAwesomeIcon :icon="getFileIcon(material.name)" class="file-icon"/>
              </div>
              <span class="file-name text-lg">{{ material.name }}</span>
            </div>
            <div class="file-extension">{{ getFileExtension(material.name) }}</div>
          </a>
        </div>
        <div v-else class="text-lg">Нету ответа</div>
      </div>
      <template #footer>
        <Button label="Отправить" icon="pi pi-check" text/>
      </template>
    </Dialog>
  </div>
</template>

<style scoped lang="scss">
@use 'assets/scss/main' as *;

.main-content {
  flex-direction: column;
  align-items: stretch;
}
</style>