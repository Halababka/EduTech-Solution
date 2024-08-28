<script setup lang="ts">
import {FilterMatchMode} from "primevue/api";
import {fetchGroups, getGroupFullNames} from "~/helpers/groups";
import {fetchRoles} from "~/helpers/role";
import {createUser, deleteUsers, fetchUsers, updateUser} from "~/helpers/user";
import {createCategorie, deleteCategories, fetchCategories, updateCategorie} from "~/helpers/categories";

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
const categories = ref();
const categorieDialog = ref(false);
const deleteCategorieDialog = ref(false);
const deleteCategoriesDialog = ref(false);
const categorie = ref({});
const selectedCategories = ref();
const filters = ref({
  'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
});
const submitted = ref(false);
const roles = ref([]);
const columns = ref([
  {field: 'name', header: 'Название'},
]);
const selectedColumns = ref(columns.value);
const loading = ref(true);

onMounted(() => {
  getCategories();
});

const openNew = () => {
  categorie.value = {};
  submitted.value = false;
  categorieDialog.value = true;
};

const confirmDeleteSelected = () => {
  deleteCategoriesDialog.value = true;
};

const exportCSV = () => {
  dt.value.exportCSV();
};

const onToggleColumns = (val) => {
  // Фильтруем выбранные колонки на основе значения мультиселектора
  selectedColumns.value = columns.value.filter(col => val.includes(col));
};

const editUser = (ctgr) => {
  categorie.value = {...ctgr};
  categorieDialog.value = true;
  console.log(categorie)
};

const confirmDeleteCategory = (ctgr) => {
  categorie.value = ctgr;
  deleteCategorieDialog.value = true;
};

const hideDialog = () => {
  categorieDialog.value = false;
  submitted.value = false;
};

const findIndexById = (id) => {
  let index = -1;
  for (let i = 0; i < categories.value.length; i++) {
    if (categories.value[i].id === id) {
      index = i;
      break;
    }
  }
  return index;
};

const saveCategorie = () => {
  submitted.value = true;

  if (categorie?.value.name?.trim()) {
    if (categorie.value.id) {
      updateCategorie([categorie.value.id], categorie.value.name) // Отправляем запрос на обновление пользователя
          .then(data => {
            categories.value[findIndexById(categorie.value.id)] = data;
            $toast.add({severity: 'success', summary: 'Успешно', detail: 'Категория обновлена', life: 5000});
            categorieDialog.value = false;
            categorie.value = {};
            getCategories()
          })
          .catch(error => console.error('Error updating categorie:', error));
    } else {
      createCategorie([categorie.value.name])
          .then(data => {
            console.log(data)
            categories.value.push(...data); // Добавляем созданного пользователя в список
            $toast.add({severity: 'success', summary: 'Успешно', detail: 'Категория создана', life: 5000});
          })
          .catch(error => console.error('Error creating categorie:', error));
    }

    categorieDialog.value = false;
    categorie.value = {};
  }
};

const deleteCategorie = () => {
  deleteCategories([categorie.value.id])
      .then(data => {
        categories.value = categories.value.filter(val => val.id !== categorie.value.id);
        deleteCategorieDialog.value = false;
        categorie.value = {};
        $toast.add({severity: 'success', summary: 'Успешно', detail: 'Категория удалена', life: 5000});
      })
      .catch(error => console.error('Error delete category:', error));
};

const deleteSelectedCategories = () => {
  deleteCategories(selectedCategories.value.map(categorie => categorie.id))
      .then(data => {
        categories.value = categories.value.filter(val => !selectedCategories.value.includes(val));
        deleteCategoriesDialog.value = false;
        selectedCategories.value = null;
        $toast.add({severity: 'success', summary: 'Успешно', detail: 'Категории удалены', life: 5000});
      })
      .catch(error => console.error('Error delete Categories:', error));
};

function getCategories() {
  loading.value = true;
  fetchCategories()
      .then(data => {
        categories.value = data
        loading.value = false;
      })
      .catch(error => console.error('Error fetching categories:', error));
}
</script>

<template>
  <div class="main-content">
    <div class="card">
      <Toolbar class="mb-4">
        <template #start>
          <Button label="Добавить" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew"/>
          <Button label="Удалить" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected"
                  :disabled="!selectedCategories || !selectedCategories.length"/>
        </template>

        <template #end>
          <Button label="Экспорт" icon="pi pi-upload" severity="help" @click="exportCSV($event)"/>
        </template>
      </Toolbar>
      <DataTable ref="dt" :value="categories" v-model:selection="selectedCategories" dataKey="id" :loading="loading"
                 style="max-width: 1500px" tableStyle="min-width: 60rem"
                 showGridlines resizableColumns columnResizeMode="fit"
                 :paginator="true" :rows="10" :filters="filters"
                 paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                 :rowsPerPageOptions="[10,25,50]"
                 currentPageReportTemplate="Показаны {first} до {last} из {totalRecords}">
        <template #header>
          <div class="flex flex-wrap gap-3 items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <h4 class="m-0 text-xl text-900 font-bold">Управление категориями</h4>
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
        <template #empty>Категории не найдены</template>

        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column v-for="(col, index) of selectedColumns" sortable :field="col.field" :header="col.header"
                :key="col.field + '_' + index">
          <template #body="slotProps">
            {{ slotProps.data[col.field] }}
          </template>
        </Column>
        <!-- Действия для каждой строки -->
        <Column :exportable="false" style="width:2rem">
          <template #body="slotProps">
            <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editUser(slotProps.data)"/>
            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteCategory(slotProps.data)"/>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
  <Dialog v-model:visible="categorieDialog" :style="{width: '450px'}" header="Категория" :modal="true"
          class="p-fluid">
    <div class="field my-3">
      <label for="name">Название</label>
      <InputText class="mt-2" id="name" v-model.trim="categorie.name" required autofocus
                 :invalid="submitted && !categorie.name"/>
      <small class="p-error" v-if="submitted && !categorie.name">Название обязательно для заполнения.</small>
    </div>
    <template #footer>
      <Button label="Отмена" icon="pi pi-times" text @click="hideDialog"/>
      <Button label="Сохранить" icon="pi pi-check" text @click="saveCategorie"/>
    </template>
  </Dialog>
  <Dialog v-model:visible="deleteCategorieDialog" :style="{width: '500px'}" header="Подтверждение" :modal="true">
    <div class="confirmation-content p-3">
      <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"/>
      <span v-if="categorie">Вы действительно хотите удалить категорию <b>{{ categorie.name }}</b> <span
          style="font-size: 0.90rem">{{ categorie.username }}?</span></span>
    </div>
    <template #footer>
      <Button label="Нет" icon="pi pi-times" text @click="deleteCategorieDialog = false"/>
      <Button label="Да" icon="pi pi-check" text @click="deleteCategorie"/>
    </template>
  </Dialog>
  <Dialog v-model:visible="deleteCategoriesDialog" :style="{width: '450px'}" header="Подтверждение" :modal="true">
    <div class="confirmation-content p-3">
      <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"/>
      <span v-if="categorie">Вы действительно хотите удалить выделенные категории?</span>
    </div>
    <template #footer>
      <Button label="Нет" icon="pi pi-times" text @click="deleteCategoriesDialog = false"/>
      <Button label="Да" icon="pi pi-check" text @click="deleteSelectedCategories"/>
    </template>
  </Dialog>
</template>

<style scoped lang="scss">

</style>