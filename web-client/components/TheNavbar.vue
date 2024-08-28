<script setup lang="ts">
import { useUser } from "~/composables/user";
import { useMobile } from "~/composables/mobile";
import { markNotificationsAsRead } from "~/helpers/notification";

interface MenuItem {
  id: number;
  name: string;
  permissions: string[];
  title: string;
  link: string;
  icon: string;
}

const user = (await useUser()).value
const mobile = useMobile()
const menuItems = ref<MenuItem[]>([])
const menuIsOpen = ref(false)
const notificationPanel = ref();
// const notifications = (await useNotification()).value
// const unreadNotificationsCount = computed(() => {
//   if (notifications.pending) return 0;
//   return notifications.notificationData.data.filter(notification => !notification.is_read).length;
// });

watchEffect(() => {
  if (!user.pending) {
    const allowedPermissions = user.userData.permissions.map((permission: any) => permission.code);

    const menuItemsFromPermissions: MenuItem[] = [
      {
        id: 1,
        name: 'Read Courses',
        permissions: ['READ_COURSES'],
        title: 'Курсы',
        link: '/course',
        icon: 'book'
      },
      // {
      //   id: 2,
      //   name: 'Create Courses',
      //   permissions: ['CREATE_COURSES'],
      //   title: 'Создать курс',
      //   link: '/course/create',
      //   icon: 'book_add'
      // },
      // {
      //   id: 3,
      //   name: 'Update Courses',
      //   permissions: ['UPDATE_COURSES'],
      //   title: 'Управление курсами',
      //   link: '/controlCourse',
      //   icon: 'book_change'
      // },
      {
        id: 4,
        name: 'Meets',
        permissions: ['CRUD_USERS'],
        title: 'Звонки',
        link: '/meet',
        icon: 'meet'
      },
      {
        id: 5,
        name: 'Tests assign',
        permissions: ['CRUD_USERS'],
        title: 'Тестирование',
        link: '/tests/assign',
        icon: 'tests'
      },
      {
        id: 6,
        name: 'Admin Panel',
        permissions: ['CRUD_USERS', 'CRUD_ROLES', 'CRUD_GROUPS', 'CREATE_COURSES', 'UPDATE_COURSES'],
        title: 'Администрирование',
        link: '/admin',
        icon: 'admin_panel'
      }
    ]

    // Фильтрация элементов меню на основе разрешений
    menuItems.value = menuItemsFromPermissions.filter(item =>
        item.permissions.some(permission => allowedPermissions.includes(permission))
    );
  }
});

const allowedMenuItems = computed(() => menuItems.value);

const toggleNotificationPanel = (event) => {
  notificationPanel.value.toggle(event);
};

const hideNotificationPanel = () => {
  notificationPanel.value.hide();
  const unreadNotificationsIds = notifications.notificationData.data
      .filter(notification => !notification.is_read)
      .map(notification => notification.id);
  if (unreadNotificationsIds.length > 0) {
    markNotificationsAsRead(unreadNotificationsIds);
  }
};
</script>

<template>
  <nav class="navigation">
    <header>
      <NuxtLink to="/home" style=" display: flex; gap: 10px; align-content: center;"
                @click="mobile && handleMenu(false)">
        <img src="@/assets/imgs/logo.svg" alt="logo" style="user-select: none; z-index: 1" class="logo-img"/>
        <transition name="slide">
          <div class="header-logo-text" v-show="menuIsOpen">
            <span class="name">EduTech</span>
            <span class="profession">Solution</span>
          </div>
        </transition>
      </NuxtLink>
      <div class="menu-open" :style="menuIsOpen ? 'transform: rotate(-270deg)' : ''"
           @click="menuIsOpen = !menuIsOpen">
        <div class="icon-arrow"></div>
      </div>
    </header>
    <ul class="navigation-main">
      <li class="nav-link" @click="">
        <NuxtLink to="/home" @click="mobile && handleMenu(false)">
          <div class="icon-home"></div>
          <transition name="slide">
            <span class="text-nav" v-show="menuIsOpen">Главная</span>
          </transition>
        </NuxtLink>
      </li>
      <li v-for="elem in allowedMenuItems" :key="elem.id" class="nav-link">
        <NuxtLink :to="elem.link" @click="mobile && handleMenu(false)">
          <div :class="`icon-${elem.icon}`"></div>
          <transition name="slide">
            <span class="text-nav" v-show="menuIsOpen">{{ elem.title }}</span>
          </transition>
        </NuxtLink>
      </li>
    </ul>
    <ul class="navigation-other">
      <li class="nav-link">
        <NuxtLink to="/profile" @click="mobile && handleMenu(false)">
          <div class="icon-profile"></div>
          <transition name="slide">
            <span class="text-nav" v-show="menuIsOpen">Профиль</span>
          </transition>
        </NuxtLink>
      </li>
<!--      <li class="nav-link flex justify-center notification" @click="toggleNotificationPanel">-->
<!--        <NuxtLink @click="mobile && handleMenu(false)">-->
<!--          <div class="relative">-->
<!--            <i class="pi pi-bell" style="font-size: 1.55rem"/>-->
<!--            <Badge :value="unreadNotificationsCount" v-if="unreadNotificationsCount > 0" class="badge"></Badge>-->
<!--          </div>-->
<!--          <transition name="slide">-->
<!--            <span class="text-nav" v-show="menuIsOpen">Уведомления</span>-->
<!--          </transition>-->
<!--        </NuxtLink>-->
<!--      </li>-->
      <li class="nav-link" @click="logout()">
        <NuxtLink @click="mobile && handleMenu(false)">
          <div class="icon-logout"></div>
          <transition name="slide">
            <span class="text-nav" v-show="menuIsOpen">Выйти</span>
          </transition>
        </NuxtLink>
      </li>
    </ul>
    <OverlayPanel ref="notificationPanel" class="min-w-[300px] w-[25rem]" @hide="hideNotificationPanel">
      <div class="flex flex-col gap-3 w-25rem">
        <div class="flex justify-between items-center align-center">
          <span class="font-medium text-900 block">Уведомления</span>
          <NuxtLink to="/notifications" class="text-blue-500">Все</NuxtLink>
        </div>
<!--        <div v-if="notifications.notificationData.data.length > 0">-->
<!--          <ul class="notifications-list">-->
<!--            <li v-for="(notification, index) in notifications.notificationData.data.slice(0, 10)" :key="notification.id"-->
<!--                :class="{ 'unread': !notification.is_read }">-->
<!--              <div class="flex justify-between items-center align-center">-->
<!--                <div class="notification-content">{{ notification.message }}</div>-->
<!--                <div class="notification-dot" v-if="!notification.is_read"></div>-->
<!--              </div>-->
<!--            </li>-->
<!--          </ul>-->
<!--        </div>-->
<!--        <div v-else>-->
<!--          Нет уведомлений-->
<!--        </div>-->
      </div>
    </OverlayPanel>
  </nav>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

ul {
  list-style-type: none;
}

.slide-enter-active,
.slide-leave-active {
  transition-property: all;
  transition-duration: .1s;
  transition-timing-function: ease-out;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-50%);
}

.navigation {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  transition: all .3s ease;
}

.navigation-dropdown {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  position: absolute;
  height: 100vh;
  width: max-content;
  padding: 10px 10px 40px 10px;
  border-radius: 0 10px;
  z-index: 99;
  top: 0;
  left: 0;
  @include theme('box-shadow', $shadow-color, true, 2px 0px 8px 0px);
  @include theme('background', $general-background-light);
}

.logo-img {
  height: 50px;
}

.navigation-main, .navigation-other {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: max-content;
  gap: 5px;
  padding: 0;
}

.navigation-other {
  margin-top: auto;
}

.nav-link {
  text-align: center;
  list-style-type: none;
  border-radius: 10px;
  width: 100%;
  transition: all 0.3s ease;

  a {
    padding: 5px;
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: flex-start;
    @include theme('color', $primary-text-color);
  }

  & i {
    margin: 5px;
  }

  &:hover {
    @include theme('background-color', $primary-color);

    & i {
      color: white;
    }
  }

  & :hover span {
    @include theme('color', $primary-color-text);
  }
}

.nav-link:hover .icon-home,
.nav-link:hover .icon-profile,
.nav-link:hover .icon-logout,
.nav-link:hover .icon-book,
.nav-link:hover .icon-book_add,
.nav-link:hover .icon-book_change,
.nav-link:hover .icon-admin_panel,
.nav-link:hover .icon-tests {
  @include theme('background', $primary-color-text);
}

.text-nav {
  user-select: none;
  font-size: 20px;
  @include theme('color', $primary-text-color);
}

.menu-open {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 25px;
  height: 25px;
  right: -18px;
  top: 25px;
  padding: 10px;
  border-radius: 50%;
  transform: rotate(-90deg);
  transition: all 0.3s ease;
  @include theme('background-color', $divider-color, false, !important);

  .icon-arrow {
    margin: 0px;
    position: absolute;
  }
}

.header-logo-text {
  display: flex;
  flex-direction: column;
  justify-content: start;
  user-select: none;
  z-index: 0;
  @include theme('color', $primary-color);

  & .name {
    font-size: 28px;
  }

  & .profession {
    font-size: 16px;
  }
}

.notifications-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
  padding-right: 5px;
  max-height: 300px; /* Установите максимальную высоту, при которой будет появляться скроллер */
  overflow-y: auto;

  & li {
    margin-bottom: 10px;
    border-radius: 5px;
    border: 1px solid #bbbbbb;
  }
}

.notification-content {
  padding: 10px;
}

.notification-dot {
  width: 8px;
  height: 8px;
  background-color: limegreen; /* Цвет точки можете настроить на свой вкус */
  border-radius: 50%;
  margin-left: auto;
  margin-right: 10px;
}

.unread .notification-content {
  font-weight: bold; /* Пример стилизации непрочитанных уведомлений */
}

.badge {
  position: absolute;
  left: 15px;
  top: -5px;
}
</style>