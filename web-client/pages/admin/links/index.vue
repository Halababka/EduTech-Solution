<script setup>
import {useToast} from 'primevue/usetoast';
import {FilterMatchMode} from 'primevue/api';
import {createRegistrationLink, deleteRegistrationLinks, getAllRegistrationLinks} from '~/helpers/registration'; // Импортировать функции для работы с регистрационными ссылками
import {fetchRoles} from '~/helpers/role';
import {fetchGroups, getGroupFullNames} from '~/helpers/groups';
import {formatDates} from "~/helpers/date";

definePageMeta({
  layout: 'home',
  middleware: [
    'admin'
  ]
})
useHead({
  title: 'Управление ссылками регистрации'
})

const runtimeConfig = useRuntimeConfig()
const router = useRouter();

const { $toast } = useNuxtApp();
const dt = ref();
const links = ref([]);
const linkDialog = ref(false);
const deleteLinkDialog = ref(false);
const deleteLinksDialog = ref(false);
const link = ref({});
const selectedLinks = ref([]);
const filters = ref({
  'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
});
const submitted = ref(false);
const roles = ref([]);
const groups = ref([]);
const loading = ref(true);

const columns = ref([
  {field: 'name', header: 'Название'},
  {field: 'description', header: 'Описание'},
  {field: 'role.name', header: 'Роль'},
  {field: 'groups', header: 'Группы'},
  {field: 'remaining_usages', header: 'Оставшиеся использования'},
  {field: 'url', header: 'URL'},
  {field: 'created_at', header: 'Дата создания'},
  {field: 'updated_at', header: 'Дата обновления'}
]);
const selectedColumns = ref(columns.value.filter(column => column.field !== 'updated_at'));

const openNew = () => {
  link.value = {};
  submitted.value = false;
  linkDialog.value = true;
};

const hideDialog = () => {
  linkDialog.value = false;
  submitted.value = false;
};

const saveLink = () => {
  submitted.value = true;

  if (link?.value.name?.trim()) {
    if (link.value.id) {

    } else {
      console.log(link.value)
      createRegistrationLink(link.value)
          .then(data => {
            console.log(data)
            links.value.push(data);
            $toast.add({severity: 'success', summary: 'Успешно', detail: 'Ссылка создана', life: 3000});
          })
          .catch(error => console.error('Ошибка при создании ссылки:', error));
    }

    linkDialog.value = false;
    link.value = {};
  }
};

const confirmDeleteLink = (lnk) => {
  link.value = lnk;
  deleteLinkDialog.value = true;
};

const deleteLink = () => {
  deleteRegistrationLinks([link.value.id])
      .then(data => {
        links.value = links.value.filter(val => val.id !== link.value.id);
        deleteLinkDialog.value = false;
        link.value = {};
        $toast.add({severity: 'success', summary: 'Успешно', detail: 'Ссылка удалена', life: 3000});
      })
      .catch(error => console.error('Ошибка при удалении ссылки:', error));
};

const findIndexById = (id) => {
  let index = -1;
  for (let i = 0; i < links.value.length; i++) {
    if (links.value[i].id === id) {
      index = i;
      break;
    }
  }
  return index;
};

const exportCSV = () => {
  dt.value.exportCSV();
};

const confirmDeleteSelected = () => {
  deleteLinksDialog.value = true;
};

const deleteSelectedLinks = () => {
  deleteRegistrationLinks(selectedLinks.value.map(link => link.id))
      .then(data => {
        links.value = links.value.filter(val => !selectedLinks.value.includes(val));
        deleteLinksDialog.value = false;
        selectedLinks.value = null;
        $toast.add({severity: 'success', summary: 'Успешно', detail: 'Ссылки удалены', life: 3000});
      })
      .catch(error => console.error('Ошибка при удалении ссылок:', error));
};

const onToggleColumns = (val) => {
  selectedColumns.value = columns.value.filter(col => val.includes(col));
};

const getRoleNames = (role) => {
  if (!role) return "Роли нету"
  return role.name;
};

const getLinks = () => {
  loading.value = true;
  getAllRegistrationLinks()
      .then(data => {
        links.value = data.links.map(link => ({
          ...link
        }));
        links.value = formatDates(links.value)
        loading.value = false;
      })
      .catch(error => console.error('Ошибка при получении ссылок:', error));
};

const updateRole = (value) => {
  const selectedRoleObject = roles.value.find(role => role.name === value);
  if (selectedRoleObject) {
    link.value.role = selectedRoleObject;
  }
};

onMounted(() => {
  getLinks();
  fetchRoles()
      .then(rolesData => {
        roles.value = rolesData;
      })
      .catch(error => console.error('Ошибка при получении ролей:', error));
  fetchGroups()
      .then(groupsData => {
        groups.value = groupsData;
      })
      .catch(error => console.error('Ошибка при получении групп:', error));

});
</script>

<template>
  <div class="main-content">
    <div class="card">
      <Toolbar class="mb-4">
        <template #start>
          <Button label="Добавить" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew"/>
          <Button label="Удалить" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected"
                  :disabled="!selectedLinks || !selectedLinks.length"/>
        </template>

        <template #end>
          <Button label="Экспорт" icon="pi pi-upload" severity="help" @click="exportCSV($event)"/>
        </template>
      </Toolbar>

      <DataTable ref="dt" :value="links" v-model:selection="selectedLinks" dataKey="id" :loading="loading"
                 style="max-width: 1500px" tableStyle="min-width: 60rem"
                 showGridlines resizableColumns columnResizeMode="fit"
                 :paginator="true" :rows="10" :filters="filters"
                 paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                 :rowsPerPageOptions="[10, 25, 50]"
                 currentPageReportTemplate="Показаны {first} до {last} из {totalRecords}">
        <template #header>
          <div class="flex flex-wrap gap-3 items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <h4 class="m-0 text-xl text-900 font-bold">Управление регистрационными ссылками</h4>
              <Button icon="pi pi-refresh" rounded raised @click="getLinks"/>
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
        <template #empty> Ссылки не найдены</template>

        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column v-for="(col, index) of selectedColumns" sortable :field="col.field" :header="col.header"
                :key="col.field + '_' + index">
          <template v-if="col.field !== 'groups' && col.field !== 'role.name'" #body="slotProps">
            <span>{{ slotProps.data[col.field] }}</span>
          </template>
          <template v-else-if="col.field === 'role.name'" #body="slotProps">
            <span>{{ getRoleNames(slotProps.data.role) }}</span>
          </template>
          <template v-else-if="col.field === 'groups'" #body="slotProps">
            <span v-if="slotProps.data.groups && slotProps.data.groups.length">{{
                getGroupFullNames(slotProps.data.groups)
              }}</span>
            <span v-else>Групп нет</span>
          </template>
        </Column>
        <Column :exportable="false" style="min-width: 2rem">
          <template #body="slotProps">
            <Button icon="pi pi-trash" rounded raised severity="danger" @click="confirmDeleteLink(slotProps.data)"/>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>

  <Dialog v-model:visible="linkDialog" :style="{width: '450px'}" :modal="true" header="Детали ссылки" class="p-fluid">
    <div class="field my-3">
      <label for="name">Название*</label>
      <InputText id="name" v-model="link.name" required autoFocus class="mt-2"/>
    </div>
    <div class="field my-3">
      <label for="description">Описание</label>
      <Textarea id="description" v-model.trim="link.description" rows="3" class="mb-0 my-2"/>
    </div>
    <div class="field my-3">
      <label for="remaining_usages">Число макимальных использований*</label>
      <InputNumber id="remaining_usages" v-model="link.remaining_usages" class="mt-2"/>
    </div>
    <div class="field my-3">
      <label for="role">Роль</label>
      <Dropdown class="mt-2" id="role" :modelValue="link.role ? link.role.name : ''" @update:modelValue="updateRole"
                :options="roles.map(role => role.name)" placeholder="Выберите роль"/>
    </div>
    <div class="field my-3">
      <label for="groups">Группы</label>
      <MultiSelect class="mt-2" v-model="link.groups" :options="groups" optionLabel="abbreviation"
                   :filter="true" :filterFields="['full_name', 'abbreviation']" display="chip"
                   placeholder="Выберите группы">
        <template #option="slotProps">
          <div class="flex flex-col justify-center flex-wrap">
            <div>{{ slotProps.option.full_name }}</div>
            <div>{{ slotProps.option.abbreviation }}</div>
          </div>
        </template>
      </MultiSelect>
    </div>
    <template #footer>
      <Button label="Отмена" icon="pi pi-times" text @click="hideDialog"/>
      <Button label="Сохранить" icon="pi pi-check" text @click="saveLink"/>
    </template>
  </Dialog>

  <Dialog v-model:visible="deleteLinkDialog" :style="{width: '500px'}" header="Подтверждение" :modal="true">
    <div class="confirmation-content p-3">
      <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"/>
      <span v-if="link">Вы действительно хотите удалить пользователя <b>{{ link.name }}</b> <span
          style="font-size: 0.90rem">{{ link.created_at }}?</span></span>
    </div>
    <template #footer>
      <Button label="Нет" icon="pi pi-times" text @click="deleteLinkDialog = false"/>
      <Button label="Да" icon="pi pi-check" text @click="deleteLink"/>
    </template>
  </Dialog>

  <Dialog v-model:visible="deleteLinksDialog" :style="{width: '450px'}" header="Подтверждение" :modal="true">
    <div class="confirmation-content p-3">
      <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"/>
      <span v-if="link">Вы действительно хотите удалить выделенные ссылки?</span>
    </div>
    <template #footer>
      <Button label="Нет" icon="pi pi-times" text @click="deleteLinksDialog = false"/>
      <Button label="Да" icon="pi pi-check" text @click="deleteSelectedLinks"/>
    </template>
  </Dialog>
</template>

<style scoped lang="scss">

</style>