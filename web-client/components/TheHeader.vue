<script setup lang="ts">
import AwDropdown from "~/components/ui-kit/AwDropdown.vue";

const router = useRouter();

interface UserData {
  first_name: string;
  last_name: string;
  middle_name: string;
  modal: boolean;
}

let userData: UserData;
userData = {
  first_name: '',
  last_name: '',
  middle_name: '',
  modal: false
}
const name = computed(() => {
  return userData.first_name && userData.last_name ? `${userData.first_name} ${userData.last_name[0]}.` : "Профиль";
});

let menu = false;


</script>

<template>
  <nav>
    <ul id="topMenu">
      <AwDropdown class="menu-item" :title="``">
        <template v-slot:top-title>
          <a id="profile-title">
            <span>{{ name }}</span>
          </a>
        </template>
        <template v-slot:bottom-title>
          <div class="avatar-arrow" style="transform:rotate(-90deg); transition:.1s">
            <img src="@/assets/imgs/arrow.svg"/>
          </div>
        </template>
        <template v-slot:item>
          <NuxtLink to="/profile" class="sub-menu-item">Профиль</NuxtLink>
          <a class="sub-menu-item" v-on:click="logout">Выйти</a>
        </template>
      </AwDropdown>
    </ul>
  </nav>
  <!--  <div class="warn">-->
  <!--    <p><b>У вас не заполнен профиль.</b> Перейдите в-->
  <!--      <router-link to="profile">профиль</router-link>-->
  <!--      , чтобы заполнить данные.-->
  <!--    </p>-->
  <!--  </div>-->
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

#topMenu {
  display: flex;
  width: 100%;
  gap: 16px;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
}

#topMenu li a {
  display: flex;
  color: $dark;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 18px;
  height: 100%;
  position: relative;
  white-space: nowrap;
}

#profile-title {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 5px;
  min-height: 70px;
}

.menu-item {
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  text-align: center;
  float: right;

}

.sub-menu-item {
  background-color: $light;
  padding: 10px 0;
}

.sub-menu-item:last-of-type {
  border-radius: 0 0 10px 10px;
}

.sub-menu-item:hover {
  background: $light-mate;
}

#topMenu > li:last-child {
  background: $light;
  border-radius: 10px;
  padding: 0 1.5rem;
  user-select: none;
}

@media screen and (max-width: 872px) {
  nav {
    width: 100%;
  }

  #topMenu {
    float: right;
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>