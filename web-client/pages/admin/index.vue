<script setup>
import { useUser } from "~/composables/user";
import { ref, computed, watchEffect } from 'vue';

definePageMeta({
  layout: "home",
  middleware: [
    "admin"
  ]
});
useHead({
  title: "Администрирование"
});

const runtimeConfig = useRuntimeConfig();
const token = useCookie("token");

const user = (await useUser()).value;

const sectionsData = ref([
  { title: "Группы", description: "Перейти", link: "/admin/groups", permissions: ["CRUD_GROUPS"] },
  { title: "Пользователи", description: "Перейти", link: "/admin/users", permissions: ["CRUD_USERS"] },
  { title: "Курсы", description: "Перейти", link: "/admin/courses", permissions: ["CREATE_COURSES"] },
  { title: "Роли", description: "Перейти", link: "/admin/roles", permissions: ["CRUD_ROLES"] },
  { title: "Категории", description: "Перейти", link: "/admin/categories", permissions: ["CRUD_CATEGORIES"] },
  { title: "Ссылки", description: "Перейти", link: "/admin/links", permissions: ["CRUD_LINKS"] }
]);

const allowedSections = ref([]);

watchEffect(() => {
  if (!user.pending) {
    const allowedPermissions = user.userData.permissions.map((permission) => permission.code);

    allowedSections.value = sectionsData.value.filter(section =>
        section.permissions.some(permission => allowedPermissions.includes(permission))
    );
  }
});
</script>

<template>
  <div class="main-content admin-page">
    <div class="grid grid-cols-3 gap-4">
      <section v-for="(section, index) in allowedSections" :key="index" class="admin-section min-w-[200px]">
        <h2>{{ section.title }}</h2>
        <NuxtLink :to="section.link" class="admin-link">
          {{ section.description }}
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.admin-page {
  padding: 10px;
}

.admin-section {
  padding: 20px;
  border: 2px solid #ccc;
  border-radius: 15px;
  position: relative; /* добавлено для позиционирования подчеркивания */
  @include theme('box-shadow', $shadow-color, true, 2px 0px 8px 0px);
  @include theme('background', $general-background-light);
}

.admin-section h2 {
  margin-top: 0;
  margin-bottom: 15px;
}

.admin-link {
  display: inline-block;
  padding: 8px 16px;
  background-color: #007bff;
  color: #fff;
  text-decoration: none;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.admin-link:hover {
  background-color: #0056b3;
}

.admin-link:hover {
  text-decoration: none; /* убираем стандартное подчеркивание при наведении */
}

.admin-link:hover ~ .admin-section::after {
  transform: scaleX(0.8); /* увеличиваем подчеркивание при наведении на ссылку */
}
</style>