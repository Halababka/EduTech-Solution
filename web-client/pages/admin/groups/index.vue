<script setup>
import {
  createGroup,
  deleteGroups,
  fetchGroups,
  updateGroup,
  deleteGroupUser,
  getGroupFullNames,
  addUsersToGroup, fetchGroupsWithUsers
} from "~/helpers/groups";

definePageMeta({
  layout: 'home',
  middleware: [
    'admin'
  ]
})
useHead({
  title: 'Администрирование групп'
})

const runtimeConfig = useRuntimeConfig()
const router = useRouter();

const loading = ref(true)
const { $toast } = useNuxtApp();
const dt = ref();
const groups = ref();
const groupDialog = ref(false);
const deleteGroupDialog = ref(false);
const deleteGroupsDialog = ref(false);
const group = ref({});
const selectedGroups = ref();
const filters = ref({
  'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
});
const filtersUserTable = ref({
  'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
})
const filtersExpandedUsers = ref({
  'fullname': {value: null, matchMode: FilterMatchMode.CONTAINS},
});
const submitted = ref(false);
const roles = ref([]);
const statuses = ref([
  {label: 'ACTIVE', value: 'active'},
  {label: 'INACTIVE', value: 'inactive'},
  {label: 'BLOCKED', value: 'blocked'}
]);

const columns = ref([
  {field: 'full_name', header: 'Наименование'},
  {field: 'abbreviation', header: 'Аббревиатура'},
  {field: 'created_at', header: 'Дата создания'},
  {field: 'updated_at', header: 'Дата обновления'},
]);
const selectedColumns = ref(columns.value.filter(column => column.field !== 'updated_at'));
const expandedRows = ref({});
const selectedUsers = ref();
const users = ref();
const columnsUser = ref([
  {field: 'email', header: 'Почта'},
  {field: 'fullname', header: 'ФИО'},
  {field: 'username', header: 'Логин'},
  {field: 'about', header: 'Описание'},
  {field: 'role.name', header: 'Роль'},
  {field: 'groups', header: 'Группы'}
]);
const selectedColumnsUser = ref(columnsUser.value.filter(column => column.field !== 'about'));

const openNew = () => {
  group.value = {};
  submitted.value = false;
  groupDialog.value = true;
};

const hideDialog = () => {
  groupDialog.value = false;
  submitted.value = false;
};

const saveGroup = () => {
  submitted.value = true;

  if (group?.value.full_name?.trim()) {
    if (group.value.id) {
      console.log(group.value.id, group.value)
      updateGroup(group.value.id, group.value) // Отправляем запрос на обновление группы
          .then(data => {
            groups.value[findIndexById(group.value.id)] = data;
            $toast.add({severity: 'success', summary: 'Успешно', detail: 'Группа обновлена', life: 5000});
            groupDialog.value = false;
            group.value = {};
            getGroups()
          })
          .catch(error => console.error('Error updating group:', error));
    } else {
      createGroup(group.value)
          .then(data => {
            groups.value.push(data); // Добавляем созданную группу в список
            $toast.add({severity: 'success', summary: 'Успешно', detail: 'Группа создана', life: 5000});
          })
          .catch(error => console.error('Error creating group:', error));
    }

    groupDialog.value = false;
    group.value = {};
  }
};

const editGroup = (usr) => {
  group.value = {...usr};
  groupDialog.value = true;
  console.log(group)
};

const confirmDeleteGroup = (usr) => {
  group.value = usr;
  deleteGroupDialog.value = true;
};

const deleteGroup = () => {
  deleteGroups([group.value.id])
      .then(data => {
        groups.value = groups.value.filter(val => val.id !== group.value.id);
        deleteGroupDialog.value = false;
        group.value = {};
        $toast.add({severity: 'success', summary: 'Успешно', detail: 'Группа удалена', life: 5000});
      })
      .catch(error => console.error('Error delete group:', error));
};

const removeUserFromGroup = (groupId, userIds) => {
  deleteGroupUser(groupId, userIds)
      .then(() => {
        // Обновление списка групп после удаления пользователя
        getGroups();
        $toast.add({severity: 'success', summary: 'Успешно', detail: 'Пользователь удален из группы', life: 5000});
      })
      .catch(error => console.error('Ошибка удаления пользователя из группы:', error))
      .finally(getUsers);
};

const addUserToGroup = (groupId, userIds) => {
  addUsersToGroup(groupId, userIds)
      .then(() => {
        getGroups();
        $toast.add({severity: 'success', summary: 'Успешно', detail: 'Пользователь добавлен в группу', life: 5000});
      })
      .catch(error => console.error('Ошибка добавления пользователя в группу:', error))
      .finally(getUsers);
};

const findIndexById = (id) => {
  let index = -1;
  for (let i = 0; i < groups.value.length; i++) {
    if (groups.value[i].id === id) {
      index = i;
      break;
    }
  }
  return index;
};

const createId = () => {
  let id = '';
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < 5; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

const exportCSV = () => {
  dt.value.exportCSV();
};

const confirmDeleteSelected = () => {
  deleteGroupsDialog.value = true;
};

const confirmAddSelectedUserToGroup = () => {
  console.log(selectedUsers.value)
  addUserToGroup(group.value.id, selectedUsers.value.map(user => user.id))
  selectedUsers.value = null
}

const deleteSelectedGroups = () => {
  deleteGroups(selectedGroups.value.map(group => group.id))
      .then(data => {
        groups.value = groups.value.filter(val => !selectedGroups.value.includes(val));
        deleteGroupsDialog.value = false;
        selectedGroups.value = null;
        $toast.add({severity: 'success', summary: 'Успешно', detail: 'Пользователи удалены', life: 5000});
      })
      .catch(error => console.error('Error delete groups:', error));
};

const isGroupInDataGroups = (groupId, groups) => {
  if (!groupId) {
    return true; // Если groupId не задан, кнопка должна быть отключена
  }

  // Проверяем наличие id у вложенных элементов в groups
  const hasValidGroupId = groups.some(group => {
    return group?.id === groupId || (group?.children?.some(child => child?.id === groupId));
  });

  return !hasValidGroupId;
}

const onToggleColumns = (val) => {
  // Фильтруем выбранные колонки на основе значения мультиселектора
  selectedColumns.value = columns.value.filter(col => val.includes(col));
};
const onRowExpand = (event) => {

};
const onRowCollapse = (event) => {

};
// Получение групп с сервера при монтировании компонента
import {FilterMatchMode} from "primevue/api";
import {fetchUsers} from "~/helpers/user";
import {formatDates} from "~/helpers/date";

function getGroups() {
  fetchGroupsWithUsers()
      .then(data => {
        data.forEach(group => {
          if (group.users) {
            group.users.forEach(user => {
              user.fullname = `${user.last_name} ${user.first_name} ${user.middle_name}`;
              user.group_id = group.id;
            });
          }
        });
        groups.value = data.map(group => ({
          ...group
        }));
        groups.value = formatDates(groups.value)
        console.log(groups.value)
        loading.value = false;
      })
      .catch(error => console.error('Error fetching groups:', error));
}

function getUsers() {
  loading.value = true
  fetchUsers()
      .then(data => {
        users.value = data.map(user => ({
          ...user,
          fullname: `${user.last_name} ${user.first_name} ${user.middle_name}`
        }));
        loading.value = false;
      })
      .catch(error => console.error('Error fetching users:', error))
      .finally(() => {
        loading.value = false
      });
}

onMounted(() => {
  getGroups()
  getUsers()
});
</script>


<template>
  <div class="main-content flex-col">
    <div class="card">
      <Toolbar class="mb-4">
        <template #start>
          <Button label="Добавить" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew"/>
          <Button label="Удалить" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected"
                  :disabled="!selectedGroups || !selectedGroups.length"/>
        </template>

        <template #end>
          <Button label="Экспорт" icon="pi pi-upload" severity="help" @click="exportCSV($event)"/>
        </template>
      </Toolbar>

      <DataTable ref="dt" v-model:expandedRows="expandedRows" :value="groups" v-model:selection="selectedGroups"
                 dataKey="id"
                 style="max-width: 1500px" :loading="loading"
                 @rowExpand="onRowExpand" @rowCollapse="onRowCollapse"
                 showGridlines resizableColumns columnResizeMode="fit"
                 :paginator="true" :rows="10" :filters="filters"
                 paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                 :rowsPerPageOptions="[10,25,50]"
                 currentPageReportTemplate="Показаны {first} до {last} из {totalRecords}">
        <template #header>
          <div class="flex flex-wrap gap-3 items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <h4 class="m-0 text-xl text-900 font-bold">Управление группами</h4>
              <Button icon="pi pi-refresh" rounded raised @click="getGroups"/>
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
        <Column expander style="width: 3rem"/>
        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column v-for="(col, index) of selectedColumns" sortable :field="col.field" :header="col.header"
                :key="col.field + '_' + index"/>

        <!-- Действия для каждой строки -->
        <Column :exportable="false" style="min-width:8rem">
          <template #body="slotProps">
            <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editGroup(slotProps.data)"/>
            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteGroup(slotProps.data)"/>
          </template>
        </Column>
        <!-- Расширенная таблица -->
        <template #expansion="slotProps">
          <div>
            <h4 class="m-0 mb-2">Участники группы {{ slotProps.data.abbreviation }}</h4>
            <DataTable v-if="slotProps.data.users?.length !== 0"
                       v-model:filters="filtersExpandedUsers" filterDisplay="row" :globalFilterFields="['fullname']"
                       :value="slotProps.data.users"
                       :paginator="true" :rows="20"
                       paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                       :rowsPerPageOptions="[20,40,80]"
                       currentPageReportTemplate="Показаны {first} до {last} из {totalRecords}">

              <Column field="fullname" header="ФИО">
                <template #body="slotProps">
                  {{ slotProps.data.fullname }}
                </template>
                <template #filter="{ filterModel, filterCallback }">
                  <InputText v-model="filterModel.value" type="text" @input="filterCallback()" class="p-column-filter"
                             placeholder="Поиск по имени"/>
                </template>
              </Column>
              <Column field="email" header="Почта">
                <template #body="slotProps">
                  {{ slotProps.data.email }}
                </template>
              </Column>
              <Column field="username" header="Логин">
                <template #body="slotProps">
                  {{ slotProps.data.username }}
                </template>
              </Column>

              <Column :exportable="false" style="width: 2rem">
                <template #body="slotProps">
                  <Button icon="pi pi-trash" outlined rounded severity="danger"
                          @click="removeUserFromGroup(slotProps.data.group_id, [slotProps.data.id])"/>
                </template>
              </Column>
            </DataTable>
          </div>
        </template>
      </DataTable>
    </div>
    <div>
      <h2>Управление составом групп</h2>
      <div class="card">
        <Toolbar class="mb-4">
          <template #start>
            <Button label="Добавить" icon="pi pi-plus" severity="success" @click="confirmAddSelectedUserToGroup"
                    :disabled="!selectedUsers || !selectedUsers.length || !group.id"/>
          </template>
          <template #end>
            <Dropdown v-model="group" :options="groups" filter optionLabel="abbreviation" placeholder="Выберите группу"
                      class="w-full md:w-14rem">
              <template #value="slotProps">
                <div v-if="slotProps.value.abbreviation" class="flex align-items-center">
                  <div>{{ slotProps.value.abbreviation }}</div>
                </div>
                <span v-else>
                  {{ slotProps.placeholder }}
                </span>
              </template>
              <template #option="slotProps">
                <div class="flex flex-col justify-center flex-wrap">
                  <div>{{ slotProps.option.full_name }}</div>
                  <div>{{ slotProps.option.abbreviation }}</div>
                </div>
              </template>
            </Dropdown>
          </template>
        </Toolbar>

        <DataTable ref="dt" :value="users" v-model:selection="selectedUsers" dataKey="id" :loading="loading"
                   style="max-width: 1500px" tableStyle="min-width: 60rem"
                   showGridlines resizableColumns columnResizeMode="fit"
                   :paginator="true" :rows="10" :filters="filtersUserTable"
                   paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                   :rowsPerPageOptions="[10,25,50]"
                   currentPageReportTemplate="Показаны {first} до {last} из {totalRecords}">
          <template #header>
            <div class="flex flex-wrap gap-3 items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <h4 class="m-0 text-xl text-900 font-bold">Пользователи</h4>
                <Button icon="pi pi-refresh" rounded raised @click="getUsers"/>
              </div>
              <IconField iconPosition="left">
                <InputIcon>
                  <i class="pi pi-search"/>
                </InputIcon>
                <InputText v-model="filtersUserTable['global'].value" placeholder="Поиск..."/>
              </IconField>
            </div>
            <MultiSelect v-model="selectedColumnsUser" :options="columnsUser" optionLabel="header"
                         @update:modelValue="onToggleColumns"
                         display="chip" placeholder="Выберите колонки"/>
          </template>
          <template #empty> Пользователи не найдены</template>

          <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
          <Column v-for="(col, index) of selectedColumnsUser" sortable :field="col.field" :header="col.header"
                  :key="col.field + '_' + index">
            <!-- Измененный код для колонки "Группы" -->
            <template v-if="col.field !== 'groups' && col.field !== 'role.name'" #body="slotProps">
              {{ slotProps.data[col.field] }}
            </template>
            <template v-else-if="col.field === 'role.name'" #body="slotProps">
              {{ slotProps.data.role.name }}
            </template>
            <template v-else-if="col.field === 'groups'" #body="slotProps">
              {{ getGroupFullNames(slotProps.data.groups) }}
            </template>
          </Column>


          <!-- Действия для каждой строки -->
          <Column :exportable="false" style="min-width:8rem">
            <template #body="slotProps">
              <Button icon="pi pi-plus" outlined rounded class="mr-2" severity="success"
                      :disabled="!group.id"
                      @click="addUserToGroup(group.id, [slotProps.data.id])"/>
              <Button icon="pi pi-trash" outlined rounded severity="danger"
                      :disabled="isGroupInDataGroups(group.id, slotProps.data.groups)"
                      @click="removeUserFromGroup(group.id, [slotProps.data.id])"/>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>

  <Dialog v-model:visible="groupDialog" :style="{width: '450px'}" header="Сведения о группе" :modal="true"
          class="p-fluid">
    <!-- Add group details form -->
    <div class="field my-3">
      <label for="full_name">Полное название</label>
      <InputText class="mt-2" id="full_name" v-model.trim="group.full_name" required autofocus
                 :invalid="submitted && !group.full_name"/>
      <small class="p-error" v-if="submitted && !group.full_name">Полное название обязательно для заполнения.</small>
    </div>

    <div class="field my-3">
      <label for="abbreviation">Аббревиатура</label>
      <InputText class="mt-2" id="abbreviation" v-model.trim="group.abbreviation" required
                 :invalid="submitted && !group.abbreviation"/>
      <small class="p-error" v-if="submitted && !group.abbreviation">Аббревиатура обязательна для заполнения.</small>
    </div>
    <template #footer>
      <Button label="Отмена" icon="pi pi-times" text @click="hideDialog"/>
      <Button label="Сохранить" icon="pi pi-check" text @click="saveGroup"/>
    </template>
  </Dialog>

  <Dialog v-model:visible="deleteGroupDialog" :style="{width: '500px'}" header="Подтверждение" :modal="true">
    <div class="confirmation-content p-3">
      <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"/>
      <span v-if="group">Вы действительно хотите удалить группу <b>{{ group.full_name }}</b></span>
    </div>
    <template #footer>
      <Button label="Нет" icon="pi pi-times" text @click="deleteGroupDialog = false"/>
      <Button label="Да" icon="pi pi-check" text @click="deleteGroup"/>
    </template>
  </Dialog>

  <Dialog v-model:visible="deleteGroupsDialog" :style="{width: '450px'}" header="Подтверждение" :modal="true">
    <!-- Confirmation for deleting multiple groups -->
    <div class="confirmation-content p-3">
      <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"/>
      <span v-if="group">Вы действительно хотите удалить выделенные группы?</span>
    </div>
    <template #footer>
      <Button label="Нет" icon="pi pi-times" text @click="deleteGroupsDialog = false"/>
      <Button label="Да" icon="pi pi-check" text @click="deleteSelectedGroups"/>
    </template>
  </Dialog>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.main-content {
  align-content: center !important;
  align-items: center !important;
}

.p-button-text {
  margin-right: 0.5rem;
}

.mt-4 {
  margin-top: 1rem;
}

.mb-4 {
  margin-bottom: 1rem;
}
</style>