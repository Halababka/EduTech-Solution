<script setup lang="ts">
import {FilterMatchMode} from "primevue/api";
import {deleteCourses, fetchCourses} from "~/helpers/courses";
import {formatDate} from "../../../helpers/date";
import {useCourses} from "~/composables/course";

definePageMeta({
  layout: 'home',
  middleware: [
    'admin'
  ]
})
useHead({
  title: 'Администрирование категорий'
})

const runtimeConfig = useRuntimeConfig()
const router = useRouter();

const {$toast} = useNuxtApp();
const dt = ref();
const courses = ref();
const courseDialog = ref(false);
const deleteCourseDialog = ref(false);
const deleteCoursesDialog = ref(false);
const course = ref({});
const selectedCourses = ref();
const filters = ref({
  'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
});
const submitted = ref(false);
const roles = ref([]);
const columns = ref([
  {field: 'name', header: 'Название'},
  {field: 'description', header: 'Описание'},
  {field: 'active', header: 'Видимость'},
  {field: 'created_at', header: 'Создан'},
  {field: 'updated_at', header: 'Обновлен'},
  {field: 'starts_at', header: 'Начало'},
  {field: 'ends_at', header: 'Конец'},
  {field: 'duration_hours', header: 'Время прохождения'},
]);
const selectedColumns = ref(columns.value.filter(column => column.field !== 'description' && column.field !== 'duration_hours' && column.field !== 'updated_at'));
const loading = ref(true);

onMounted(() => {
  getCategories();
});

const openNew = () => {
  course.value = {};
  submitted.value = false;
  courseDialog.value = true;
};

const confirmDeleteSelected = () => {
  deleteCoursesDialog.value = true;
};

const exportCSV = () => {
  dt.value.exportCSV();
};

const onToggleColumns = (val) => {
  // Фильтруем выбранные колонки на основе значения мультиселектора
  selectedColumns.value = columns.value.filter(col => val.includes(col));
};

const editUser = (crs) => {
  router.push(`/course/create?id=${crs.id}`)
};

const confirmDeleteCourse = (crs) => {
  course.value = crs;
  deleteCourseDialog.value = true;
};

const hideDialog = () => {
  courseDialog.value = false;
  submitted.value = false;
};

const findIndexById = (id) => {
  let index = -1;
  for (let i = 0; i < courses.value.length; i++) {
    if (courses.value[i].id === id) {
      index = i;
      break;
    }
  }
  return index;
};

const saveCategorie = () => {
  submitted.value = true;

  if (course?.value.name?.trim()) {
    if (course.value.id) {
      updateCourse([course.value.id], course.value.name) // Отправляем запрос на обновление пользователя
          .then(data => {
            courses.value[findIndexById(course.value.id)] = data;
            $toast.add({severity: 'success', summary: 'Успешно', detail: 'Курс обновлен', life: 5000});
            courseDialog.value = false;
            course.value = {};
            getCategories()
          })
          .catch(error => console.error('Error updating course:', error));
    } else {

    }

    courseDialog.value = false;
    course.value = {};
  }
};

const deleteCourse = () => {
  deleteCourses([course.value.id])
      .then(data => {
        courses.value = courses.value.filter(val => val.id !== course.value.id);
        deleteCourseDialog.value = false;
        course.value = {};
        useCourses(true)
        $toast.add({severity: 'success', summary: 'Успешно', detail: 'Курс удален', life: 5000});
      })
      .catch(error => console.error('Error delete category:', error));
};

const deleteSelectedCourses = () => {
  deleteCourses(selectedCourses.value.map(course => course.id))
      .then(data => {
        courses.value = courses.value.filter(val => !selectedCourses.value.includes(val));
        deleteCoursesDialog.value = false;
        selectedCourses.value = null;
        useCourses(true)
        $toast.add({severity: 'success', summary: 'Успешно', detail: 'Курсы удалены', life: 5000});
      })
      .catch(error => console.error('Error delete courses:', error));
};

function getCategories() {
  loading.value = true;
  fetchCourses()
      .then(data => {
        courses.value = data
        loading.value = false;
      })
      .catch(error => console.error('Error fetching courses:', error));
}
</script>

<template>
  <div class="main-content">
    <div class="card">
      <Toolbar class="mb-4">
        <template #start>
          <Button label="Добавить" icon="pi pi-plus" severity="success" class="mr-2"
                  @click="router.push('/course/create')"/>
          <Button label="Удалить" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected"
                  :disabled="!selectedCourses || !selectedCourses.length"/>
        </template>

        <template #end>
          <Button label="Экспорт" icon="pi pi-upload" severity="help" @click="exportCSV($event)"/>
        </template>
      </Toolbar>
      <DataTable ref="dt" :value="courses" v-model:selection="selectedCourses" dataKey="id" :loading="loading"
                 style="max-width: 1500px" tableStyle="min-width: 60rem"
                 showGridlines resizableColumns columnResizeMode="fit"
                 :paginator="true" :rows="10" :filters="filters"
                 paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                 :rowsPerPageOptions="[10,25,50]"
                 currentPageReportTemplate="Показаны {first} до {last} из {totalRecords}">
        <template #header>
          <div class="flex flex-wrap gap-3 items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <h4 class="m-0 text-xl text-900 font-bold">Управление курсами</h4>
              <Button icon="pi pi-refresh" rounded raised @click="getCategories"/>
            </div>
            <IconField iconPosition="left">
              <InputIcon>
                <i class="pi pi-search"/>
              </InputIcon>
              <InputText v-model="filters['global'].value" placeholder="Поиск..."/>
            </IconField>
          </div>
          <MultiSelect v-model="selectedColumns" :options="columns" optionLabel="header"
                       @update:modelValue="onToggleColumns"
                       display="chip" placeholder="Выберите колонки"/>
        </template>
        <template #empty>Курсы не найдены</template>

        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column v-for="(col, index) of selectedColumns" sortable :field="col.field" :header="col.header"
                :key="col.field + '_' + index">
          <template
              v-if="col.field !== 'name' && col.field !== 'ends_at' && col.field !== 'starts_at' && col.field !== 'updated_at' && col.field !== 'created_at' && col.field !== 'active'"
              #body="slotProps">
            {{ slotProps.data[col.field] }}
          </template>
          <template v-else-if="col.field === 'active'" #body="slotProps">
            {{ slotProps.data.active === true ? "Да" : "Нет"}}
          </template>
          <template v-else-if="col.field === 'name'" #body="slotProps">
            <NuxtLink :to="`/course/${slotProps.data.id}`">{{ slotProps.data.name }}</NuxtLink>
          </template>
          <template v-else-if="col.field === 'ends_at'" #body="slotProps">
            {{ formatDate(slotProps.data.ends_at) }}
          </template>
          <template v-else-if="col.field === 'starts_at'" #body="slotProps">
            {{ formatDate(slotProps.data.starts_at) }}
          </template>
          <template v-else-if="col.field === 'updated_at'" #body="slotProps">
            {{ formatDate(slotProps.data.updated_at) }}
          </template>
          <template v-else-if="col.field === 'created_at'" #body="slotProps">
            {{ formatDate(slotProps.data.created_at) }}
          </template>
        </Column>
        <!-- Действия для каждой строки -->
        <Column :exportable="false" style="width:2rem">
          <template #body="slotProps">
            <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editUser(slotProps.data)"/>
            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteCourse(slotProps.data)"/>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
  <Dialog v-model:visible="courseDialog" :style="{width: '450px'}" header="Детали курса" :modal="true"
          class="p-fluid">
    <div class="field my-3">
      <label for="name">Название</label>
      <InputText class="mt-2" id="name" v-model.trim="course.name" required
                 :invalid="submitted && !course.name"/>
      <small class="p-error" v-if="submitted && !course.name">Название курса обязательно для заполнения.</small>
    </div>
    <template #footer>
      <Button label="Отмена" icon="pi pi-times" text @click="hideDialog"/>
      <Button label="Сохранить" icon="pi pi-check" text @click="saveCategorie"/>
    </template>
  </Dialog>
  <Dialog v-model:visible="deleteCourseDialog" :style="{width: '500px'}" header="Подтверждение" :modal="true">
    <div class="confirmation-content p-3">
      <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"/>
      <span v-if="course">Вы действительно хотите удалить категорию <b>{{ course.name }}</b> <span
          style="font-size: 0.90rem">{{ course.username }}?</span></span>
    </div>
    <template #footer>
      <Button label="Нет" icon="pi pi-times" text @click="deleteCourseDialog = false"/>
      <Button label="Да" icon="pi pi-check" text @click="deleteCourse"/>
    </template>
  </Dialog>
  <Dialog v-model:visible="deleteCoursesDialog" :style="{width: '450px'}" header="Подтверждение" :modal="true">
    <div class="confirmation-content p-3">
      <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"/>
      <span v-if="course">Вы действительно хотите удалить выделенные курсы?</span>
    </div>
    <template #footer>
      <Button label="Нет" icon="pi pi-times" text @click="deleteCoursesDialog = false"/>
      <Button label="Да" icon="pi pi-check" text @click="deleteSelectedCourses"/>
    </template>
  </Dialog>
</template>

<style scoped lang="scss">

</style>