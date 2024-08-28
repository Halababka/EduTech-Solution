<script setup>
import {
  createRole,
  deleteRoles,
  fetchRoles,
  updateRole,
  deleteRolePermission,
  addPermissionsToRole
} from "~/helpers/role";
import {FilterMatchMode} from "primevue/api";
import {fetchPermissions, getPermissionsFullNames} from "~/helpers/permission";
import {formatDates} from "~/helpers/date";
import {getGroupFullNames} from "~/helpers/groups";

definePageMeta({
  layout: 'home',
  middleware: [
    'admin'
  ]
})
useHead({
  title: 'Администрирование ролей'
})

const runtimeConfig = useRuntimeConfig()
const router = useRouter();

const loading = ref(true)
const {$toast} = useNuxtApp();
const dt = ref();
const roles = ref();
const roleDialog = ref(false);
const deleteRoleDialog = ref(false);
const deleteRolesDialog = ref(false);
const role = ref({});
const selectedRoles = ref();
const filters = ref({
  'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
});
const filtersPermissionTable = ref({
  'global': {value: null, matchMode: FilterMatchMode.CONTAINS},
})
const filtersExpandedPermissions = ref({
  'name': {value: null, matchMode: FilterMatchMode.CONTAINS},
});
const submitted = ref(false);
const permissions = ref([]);
const statuses = ref([
  {label: 'ACTIVE', value: 'active'},
  {label: 'INACTIVE', value: 'inactive'},
  {label: 'BLOCKED', value: 'blocked'}
]);

const columns = ref([
  {field: 'name', header: 'Наименование'},
  {field: 'code', header: 'Код'},
  {field: 'permissions', header: 'Права'},
]);
const selectedColumns = ref(columns.value.filter(column => column.field !== 'permissions'));
const expandedRows = ref({});
const selectedPermissions = ref();
const permissionsList = ref();
const columnsPermission = ref([
  {field: 'name', header: 'Наименование'},
  {field: 'code', header: 'Код'},
]);
const selectedColumnsPermission = ref(columnsPermission.value.filter(column => column.field !== 'code'));

const openNew = () => {
  role.value = {};
  submitted.value = false;
  roleDialog.value = true;
};

const hideDialog = () => {
  roleDialog.value = false;
  submitted.value = false;
};

const saveRole = () => {
  submitted.value = true;

  if (role?.value.name?.trim()) {
    if (role.value.id) {
      updateRole(role.value.id, role.value) // Отправляем запрос на обновление роли
          .then(data => {
            roles.value[findIndexById(role.value.id)] = data;
            $toast.add({severity: 'success', summary: 'Успешно', detail: 'Роль обновлена', life: 5000});
            roleDialog.value = false;
            role.value = {};
            getRoles()
          })
          .catch(error => console.error('Ошибка обновления роли:', error));
    } else {
      createRole(role.value)
          .then(data => {
            roles.value.push(data); // Добавляем созданную роль в список
            $toast.add({severity: 'success', summary: 'Успешно', detail: 'Роль создана', life: 5000});
          })
          .catch(error => console.error('Ошибка создания роли:', error));
    }

    roleDialog.value = false;
    role.value = {};
  }
};

const editRole = (usr) => {
  role.value = {...usr};
  roleDialog.value = true;
};

const confirmDeleteRole = (usr) => {
  role.value = usr;
  deleteRoleDialog.value = true;
};

const deleteRole = () => {
  deleteRoles([role.value.id])
      .then(data => {
        roles.value = roles.value.filter(val => val.id !== role.value.id);
        deleteRoleDialog.value = false;
        role.value = {};
        $toast.add({severity: 'success', summary: 'Успешно', detail: 'Роль удалена', life: 5000});
      })
      .catch(error => console.error('Ошибка удаления роли:', error));
};

const removePermissionFromRole = (roleId, permissionIds) => {
  deleteRolePermission(roleId, permissionIds)
      .then(() => {
        // Обновление списка ролей после удаления разрешения
        getRoles();
        $toast.add({severity: 'success', summary: 'Успешно', detail: 'Разрешение удалено из роли', life: 5000});
      })
      .catch(error => console.error('Ошибка удаления разрешения из роли:', error))
      .finally(getPermissions);
};

const addPermissionToRole = (roleId, permissionIds) => {
  addPermissionsToRole(roleId, permissionIds)
      .then(() => {
        getRoles();
        $toast.add({severity: 'success', summary: 'Успешно', detail: 'Разрешение добавлено в роль', life: 5000});
      })
      .catch(error => console.error('Ошибка добавления разрешения в роль:', error))
      .finally(getPermissions);
};

const findIndexById = (id) => {
  let index = -1;
  for (let i = 0; i < roles.value.length; i++) {
    if (roles.value[i].id === id) {
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
  deleteRolesDialog.value = true;
};

const confirmAddSelectedPermissionToRole = () => {
  addPermissionToRole(role.value.id, selectedPermissions.value.map(permission => permission.id))
  selectedPermissions.value = null
}

const deleteSelectedRoles = () => {
  deleteRoles(selectedRoles.value.map(role => role.id))
      .then(data => {
        roles.value = roles.value.filter(val => !selectedRoles.value.includes(val));
        deleteRolesDialog.value = false;
        selectedRoles.value = null;
        $toast.add({severity: 'success', summary: 'Успешно', detail: 'Роли удалены', life: 5000});
      })
      .catch(error => console.error('Ошибка удаления ролей:', error));
};

const isPermissionInRolePermissions = (roleId, permissions) => {
  if (!roleId) {
    return true; // Если roleId не задан, кнопка должна быть отключена
  }

  // Проверяем наличие id у вложенных элементов в permissions
  const hasValidPermissionId = permissions.some(permission => {
    return permission?.id === roleId || (permission?.children?.some(child => child?.id === roleId));
  });

  return !hasValidPermissionId;
}

const onToggleColumns = (val) => {
  // Фильтруем выбранные колонки на основе значения мультиселектора
  selectedColumns.value = columns.value.filter(col => val.includes(col));
};
const onRowExpand = (event) => {

};
const onRowCollapse = (event) => {

};

// Получение ролей с сервера при монтировании компонента

function getRoles() {
  loading.value = true;
  fetchRoles()
      .then(data => {
        roles.value = data;
        loading.value = false;
      })
      .catch(error => console.error('Ошибка получения ролей:', error));

}

function getPermissions() {
  loading.value = true
  fetchPermissions()
      .then(data => {
        permissions.value = data;
        loading.value = false;
      })
      .catch(error => console.error('Ошибка получения разрешений:', error))
      .finally(() => {
        loading.value = false
      });

}

onMounted(() => {
  getRoles()
  getPermissions()
});
</script>


<template>
  <div class="main-content flex-col">
    <div class="card">
      <Toolbar class="mb-4">
        <template #start>
          <Button label="Добавить" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew"/>
          <Button label="Удалить" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected"
                  :disabled="!selectedRoles || !selectedRoles.length"/>
        </template>

        <template #end>
          <Button label="Экспорт" icon="pi pi-upload" class="inline-block" @click="exportCSV"/>
        </template>
      </Toolbar>

      <DataTable v-model:expandedRows="expandedRows" v-model:selection="selectedRoles" ref="dt" :loading="loading"
                 :value="roles"
                 selectionMode="checkbox" dataKey="id" :paginator="true" :rows="10"
                 :rowsPerPageOptions="[10, 25, 50]" :filters="filters" :filterDisplay="'menu'"
                 paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                 currentPageReportTemplate="Показаны {first} до {last} из {totalRecords}"
                 responsiveLayout="scroll" :globalFilterFields="['name', 'email']"
                 rowExpansionTemplate="expandedRowTemplate" :expandedRowKeys="expandedRows">
        <template #empty>
          <span class="text-lg">Роли не найдены</span>
        </template>

        <template #header>
          <div class="flex flex-wrap gap-3 items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <h4 class="m-0 text-xl text-900 font-bold">Управление ролями</h4>
              <Button icon="pi pi-refresh" rounded raised @click="getRoles"/>
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
                :key="col.field + '_' + index">
          <template v-if="col.field !== 'permissions'" #body="slotProps">
            {{ slotProps.data[col.field] }}
          </template>
          <template v-else-if="col.field === 'permissions'" #body="slotProps">
            {{ getPermissionsFullNames(slotProps.data.permissions) }}
          </template>
        </Column>

        <!-- Действия для каждой строки -->
        <Column :exportable="false" style="min-width:8rem">
          <template #body="slotProps">
            <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editRole(slotProps.data)"/>
            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteRole(slotProps.data)"/>
          </template>
        </Column>

        <!-- Расширенная таблица -->
        <template #expansion="slotProps">
          <div>
            <h4 class="m-0 mb-2">Права роли {{ slotProps.data.name }}</h4>
            <DataTable v-if="slotProps.data.permissions?.length !== 0"
                       v-model:filters="filtersExpandedPermissions" filterDisplay="row" :globalFilterFields="['name']"
                       :value="slotProps.data.permissions"
                       :paginator="true" :rows="20"
                       paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                       :rowsPerPageOptions="[20,40,80]"
                       currentPageReportTemplate="Показаны {first} до {last} из {totalRecords}">

              <Column field="name" header="Название">
                <template #body="slotProps">
                  {{ slotProps.data.name }}
                </template>
                <template #filter="{ filterModel, filterCallback }">
                  <InputText v-model="filterModel.value" type="text" @input="filterCallback()" class="p-column-filter"
                             placeholder="Поиск по названию"/>
                </template>
              </Column>
              <Column field="code" header="Код">
                <template #body="slotProps">
                  {{ slotProps.data.code }}
                </template>
              </Column>
            </DataTable>
          </div>
        </template>
      </DataTable>
    </div>

    <Dialog v-model:visible="roleDialog" header="Детали роли" :modal="true" :style="{width: '450px'}" class="p-fluid">
      <template #footer>
        <Button label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog"/>
        <Button label="Сохранить" icon="pi pi-check" class="p-button-text" @click="saveRole"/>
      </template>
      <div class="field">
        <label for="name">Наименование</label>
        <InputText id="name" v-model="role.name" required autoFocus/>
      </div>
      <div class="field">
        <label for="code">Код</label>
        <InputText id="code" v-model="role.code"/>
      </div>
      <div class="field">
        <label for="permissions">Разрешения</label>
        <MultiSelect class="mt-2" v-model="role.permissions" :options="permissions" optionLabel="name"
                     :filter="true" :filterFields="['name', 'code']" display="chip"
                     placeholder="Выберите разрешения" id="permissions">
          <template #option="slotProps">
            <div class="flex flex-col justify-center flex-wrap">
              <div>{{ slotProps.option.name }}</div>
              <div>{{ slotProps.option.code }}</div>
            </div>
          </template>
        </MultiSelect>
      </div>
    </Dialog>

    <Dialog v-model:visible="deleteRoleDialog" header="Подтвердить" :modal="true">
      <div class="confirmation-content p-3">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"/>
        <span>Вы уверены, что хотите удалить {{ role.name }}?</span>
      </div>
      <template #footer>
        <Button label="Нет" icon="pi pi-times" class="p-button-text" @click="deleteRoleDialog = false"/>
        <Button label="Да" icon="pi pi-check" class="p-button-text" @click="deleteRole"/>
      </template>
    </Dialog>

    <Dialog v-model:visible="deleteRolesDialog" header="Подтвердить" :modal="true">
      <div class="confirmation-content p-3">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"/>
        <span>Вы уверены, что хотите удалить выбранные роли?</span>
      </div>
      <template #footer>
        <Button label="Нет" icon="pi pi-times" class="p-button-text" @click="deleteRolesDialog = false"/>
        <Button label="Да" icon="pi pi-check" class="p-button-text" @click="deleteSelectedRoles"/>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.main-content {
  align-content: center !important;
  align-items: center !important;
}
</style>
