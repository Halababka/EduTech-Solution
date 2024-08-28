<script setup>
import {createUser, deleteUsers, fetchUsers, updateUser} from "~/helpers/user";
import {fetchGroups, getGroupFullNames, formatGroups} from '~/helpers/groups';
import {FilterMatchMode} from "primevue/api";
import {fetchRoles} from "~/helpers/role";

definePageMeta({
  layout: 'home',
})
useHead({
  title: 'Администрирование пользователей'
})

const toast = useToast();
const dt = ref();
const users = ref();
const userDialog = ref(false);
const deleteUserDialog = ref(false);
const deleteUsersDialog = ref(false);
const user = ref({});
const selectedUsers = ref();
const filters = ref({
  'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
});
const submitted = ref(false);
const roles = ref([]);
const statuses = ref([
  {label: 'ACTIVE', value: 'active'},
  {label: 'INACTIVE', value: 'inactive'},
  {label: 'BLOCKED', value: 'blocked'}
]);
const columns = ref([
  {field: 'email', header: 'Почта'},
  {field: 'fullname', header: 'ФИО'},
  {field: 'username', header: 'Логин'},
  {field: 'about', header: 'Описание'},
  {field: 'role.name', header: 'Роль'},
  {field: 'groups', header: 'Группы'}
]);
const selectedColumns = ref(columns.value.filter(column => column.field !== 'about'));
const groups = ref([]);
const loading = ref(true);

onMounted(() => {
  getUsers();
  fetchRoles()
      .then(rolesData => {
        roles.value = rolesData;
      })
      .catch(error => console.error('Error fetching roles:', error));
  fetchGroups()
      .then(groupsData => {
        groups.value = groupsData;
        console.log(groups.value)
      })
      .catch(error => console.error('Error fetching groups:', error));
});

const openNew = () => {
  user.value = {};
  submitted.value = false;
  userDialog.value = true;
};

const hideDialog = () => {
  userDialog.value = false;
  submitted.value = false;
};

const saveUser = () => {
  submitted.value = true;

  if (user?.value.username?.trim()) {
    if (user.value.id) {
      delete user.value.fullname;
      updateUser(user.value.id, user.value) // Отправляем запрос на обновление пользователя
          .then(data => {
            users.value[findIndexById(user.value.id)] = data;
            toast.add({severity: 'success', summary: 'Успешно', detail: 'Пользователь обновлен', life: 3000});
            userDialog.value = false;
            user.value = {};
            getUsers()
          })
          .catch(error => console.error('Error updating user:', error));
    } else {
      createUser([user.value])
          .then(data => {
            users.value.push(data); // Добавляем созданного пользователя в список
            toast.add({severity: 'success', summary: 'Успешно', detail: 'Пользователь создан', life: 3000});
          })
          .catch(error => console.error('Error creating user:', error));
    }

    userDialog.value = false;
    user.value = {};
  }
};

const editUser = (usr) => {
  user.value = {...usr};
  userDialog.value = true;
  console.log(user)
};

const confirmDeleteUser = (usr) => {
  user.value = usr;
  deleteUserDialog.value = true;
};

const deleteUser = () => {
  deleteUsers([user.value.id])
      .then(data => {
        users.value = users.value.filter(val => val.id !== user.value.id);
        deleteUserDialog.value = false;
        user.value = {};
        toast.add({severity: 'success', summary: 'Успешно', detail: 'Пользователь удален', life: 3000});
      })
      .catch(error => console.error('Error delete user:', error));
};

const findIndexById = (id) => {
  let index = -1;
  for (let i = 0; i < users.value.length; i++) {
    if (users.value[i].id === id) {
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
  deleteUsersDialog.value = true;
};

const deleteSelectedUsers = () => {
  deleteUsers(selectedUsers.value.map(user => user.id))
      .then(data => {
        users.value = users.value.filter(val => !selectedUsers.value.includes(val));
        deleteUsersDialog.value = false;
        selectedUsers.value = null;
        toast.add({severity: 'success', summary: 'Успешно', detail: 'Пользователи удалены', life: 3000});
      })
      .catch(error => console.error('Error delete users:', error));
};
const onToggleColumns = (val) => {
  // Фильтруем выбранные колонки на основе значения мультиселектора
  selectedColumns.value = columns.value.filter(col => val.includes(col));
};
// Получение пользователей с сервера при монтировании компонента
function getUsers() {
  fetchUsers()
      .then(data => {
        users.value = data.map(user => ({
          ...user,
          fullname: `${user.last_name} ${user.first_name} ${user.middle_name}`
        }));
        loading.value = false;
      })
      .catch(error => console.error('Error fetching users:', error));
}

const updateRole = (value) => {
  const selectedRoleObject = roles.value.find(role => role.name === value);
  if (selectedRoleObject) {
    // user.value.rolesId = selectedRoleObject.id;
    user.value.role = selectedRoleObject; // Обновляем объект роли пользователя
  }
  console.log(user.value)
};
</script>

<template>
  <div class="main-content">
    <div class="card">
      <Toolbar class="mb-4">
        <template #start>
          <Button label="Добавить" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew"/>
          <Button label="Удалить" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected"
                  :disabled="!selectedUsers || !selectedUsers.length"/>
        </template>

        <template #end>
          <FileUpload mode="basic" accept="image/*" :maxFileSize="1000000" label="Import" chooseLabel="Импорт"
                      class="mr-2 inline-block"/>
          <Button label="Экспорт" icon="pi pi-upload" severity="help" @click="exportCSV($event)"/>
        </template>
      </Toolbar>

      <DataTable ref="dt" :value="users" v-model:selection="selectedUsers" dataKey="id" :loading="loading"
                 style="max-width: 1500px" tableStyle="min-width: 60rem"
                 showGridlines resizableColumns columnResizeMode="fit"
                 :paginator="true" :rows="10" :filters="filters"
                 paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                 :rowsPerPageOptions="[10,25,50]"
                 currentPageReportTemplate="Показаны {first} до {last} из {totalRecords}">
        <template #header>
          <div class="flex flex-wrap gap-3 items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <h4 class="m-0 text-xl text-900 font-bold">Управление пользователями</h4>
              <Button icon="pi pi-refresh" rounded raised @click="getUsers"/>
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
        <template #empty> Пользователи не найдены</template>

        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column v-for="(col, index) of selectedColumns" sortable :field="col.field" :header="col.header"
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
            <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editUser(slotProps.data)"/>
            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteUser(slotProps.data)"/>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
  <Dialog v-model:visible="userDialog" :style="{width: '450px'}" header="Сведения о пользователе" :modal="true"
          class="p-fluid">
    <!-- Add user details form -->
    <div class="field my-3">
      <label for="username">Логин</label>
      <InputText class="mt-2" id="username" v-model.trim="user.username" required autofocus
                 :invalid="submitted && !user.username"/>
      <small class="p-error" v-if="submitted && !user.username">Имя пользователя обязательно для заполнения.</small>
    </div>
    <div class="field my-3">
      <label for="password">Пароль</label>
      <Password class="mt-2" id="password" promptLabel="Введите пароль" :weakLabel="'Слабый'" :mediumLabel="'Средний'"
                :strongLabel="'Сильный'" v-model.trim="user.password" toggleMask required
                :invalid="submitted && !user.password"/>
      <small class="p-error" v-if="submitted && !user.password">Пароль обязателен для заполнения.</small>
    </div>
    <div class="field my-3">
      <label for="first_name">Имя</label>
      <InputText class="mt-2" id="first_name" v-model.trim="user.first_name" required
                 :invalid="submitted && !user.first_name"/>
      <small class="p-error" v-if="submitted && !user.first_name">Имя обязательно для заполнения.</small>
    </div>
    <div class="field my-3">
      <label for="last_name">Фамилия</label>
      <InputText class="mt-2" id="last_name" v-model.trim="user.last_name" required
                 :invalid="submitted && !user.last_name"/>
      <small class="p-error" v-if="submitted && !user.last_name">Фамилия обязательна для заполнения.</small>
    </div>
    <div class="field my-3">
      <label for="middle_name">Отчество</label>
      <InputText class="mt-2" id="middle_name" v-model.trim="user.middle_name"/>
    </div>
    <div class="field my-3">
      <label for="about">Описание</label>
      <Textarea class="mt-2" id="about" v-model.trim="user.about"/>
    </div>
    <div class="field my-3">
      <label for="email">Email</label>
      <InputText class="mt-2" id="email" v-model.trim="user.email" required :invalid="submitted && !user.email"/>
      <small class="p-error" v-if="submitted && !user.email">Email обязателен для заполнения.</small>
    </div>
    <div class="field my-3">
      <label for="role">Роль</label>
      <Dropdown class="mt-2" id="role" :modelValue="user.role ? user.role.name : ''" @update:modelValue="updateRole"
                :options="roles.map(role => role.name)" placeholder="Выберите роль"/>
    </div>
    <div class="field my-3">
      <label for="groups">Группы</label>
      <MultiSelect class="mt-2" v-model="user.groups" :options="groups" optionLabel="abbreviation"
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
      <Button label="Сохранить" icon="pi pi-check" text @click="saveUser"/>
    </template>
  </Dialog>
  <Dialog v-model:visible="deleteUserDialog" :style="{width: '500px'}" header="Подтверждение" :modal="true">
    <div class="confirmation-content p-3">
      <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"/>
      <span v-if="user">Вы действительно хотите удалить пользователя <b>{{ user.fullname }}</b> <span
          style="font-size: 0.90rem">{{ user.username }}?</span></span>
    </div>
    <template #footer>
      <Button label="Нет" icon="pi pi-times" text @click="deleteUserDialog = false"/>
      <Button label="Да" icon="pi pi-check" text @click="deleteUser"/>
    </template>
  </Dialog>
  <Dialog v-model:visible="deleteUsersDialog" :style="{width: '450px'}" header="Подтверждение" :modal="true">
    <!-- Confirmation for deleting multiple users -->
    <div class="confirmation-content p-3">
      <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"/>
      <span v-if="user">Вы действительно хотите удалить выделенных пользователей?</span>
    </div>
    <template #footer>
      <Button label="Нет" icon="pi pi-times" text @click="deleteUsersDialog = false"/>
      <Button label="Да" icon="pi pi-check" text @click="deleteSelectedUsers"/>
    </template>
  </Dialog>
</template>

<style scoped lang="scss">

</style>