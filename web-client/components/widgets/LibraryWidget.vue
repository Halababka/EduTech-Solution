<script setup lang="ts">
const nuxtApp = useNuxtApp()

let coursesSwitch = ref(false)

const role = ref(localStorage.getItem('role'))
const {courses, pending, error} = nuxtApp.$courses


watchEffect(() => {
  if (!pending.value) {
    if (courses.value.length > 0) coursesSwitch.value = true
  }
})

</script>

<template>
  <div class="navigation">
    <ul class="navigation-list">
      <li class="nav-item" v-if="coursesSwitch">
        <NuxtLink to="/courses">
          <div class="icon">
            <div class="icon-book"></div>
          </div>
          <p>Курсы</p>
        </NuxtLink>
      </li>
      <li class="nav-item" v-if="role>=3">
        <NuxtLink to="/admin">
          <div class="icon">
            <div class="icon-admin_panel"></div>
          </div>
          <p>Админ</p>
        </NuxtLink>
      </li>
      <li class="nav-item" v-if="role>=2">
        <NuxtLink to="/createCourse">
          <div class="icon">
            <div class="icon-book_add"></div>
          </div>
          <p>Создание курсов</p>
        </NuxtLink>
      </li>
      <li class="nav-item" v-if="role>=2 && coursesSwitch">
        <NuxtLink to="/controlCourse">
          <div class="icon">
            <div class="icon-book_change"></div>
          </div>
          <p>Управление курсами</p>
        </NuxtLink>
      </li>
      <li class="nav-item" v-if="role>=2">
        <NuxtLink to="/tickets">
          <div class="icon">
            <div class="icon-homework_check"></div>
          </div>
          <p>Проверка заданий</p>
        </NuxtLink>
      </li>
      <li class="nav-item">
        <NuxtLink to="/profile">
          <div class="icon">
            <div class="icon-profile"></div>
          </div>
          <p>Профиль</p>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.navigation-list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  row-gap: 10px;
  column-gap: 12px;
}

.nav-item {
  width: 54px;
  overflow: hidden;
}

.nav-item a {
  color: #121212;
}

.nav-item p {
  white-space: nowrap;
  @include theme('color', $primary-text-color);
  width: inherit;
  margin-top: 10px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
}

.icon {
  @include theme('background', $primary-color);
  border-radius: 15px;
  margin: 0 auto;
  height: 54px;
  display: flex;
  justify-content: center;
  align-items: center;
}

@media (min-width: 1190px) {
  .nav-item {
    width: 65px;
  }
  .icon {
    height: 65px;
  }
  .navigation-list {
    grid-template-columns: repeat(6, 1fr);
    gap: 45px;
  }
}
</style>