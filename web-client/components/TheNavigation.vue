<script setup lang="ts">

import {handleMenu, handleMobile, useMenu, useMobile} from "~/composables/mobile";

const runtimeConfig = useRuntimeConfig()
const router = useRouter();
const token = useCookie('token')

const mobile = useMobile()
const menuActive = useMenu()
const windowWidth = ref(0)

function checkScreen() {
  windowWidth.value = window.innerWidth;
  if (windowWidth.value <= 920) {
    handleMobile(true);
    return;
  }
  handleMobile(false);
  menuActive.value = false;
  return;
}

onMounted(() => {
  window.addEventListener('resize', checkScreen);
  checkScreen()
})

</script>

<template>
  <aside :class="mobile ? 'menu-horizontal' : 'menu-vertical'">
    <TheNavbar v-show="!mobile"></TheNavbar>
    <div class="header-aside" v-show="mobile">
      <NuxtLink to="/home" style="display: flex; justify-content: center; align-items: center">
        <img src="@/assets/imgs/logo.svg" alt="logo" style="width: 40px"/>
      </NuxtLink>
      <div class="icon-menu" @click="handleMenu()" :class="{'icon-active':menuActive}"></div>
    </div>
    <transition name="mobile-nav">
      <div v-show="menuActive" class="full-screen" @click.stop="handleMenu(false)">
        <nav class="navigation-dropdown" @click.stop>
          <TheNavbar></TheNavbar>
        </nav>
      </div>
    </transition>
  </aside>
</template>
<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.menu-vertical {
  display: flex;
  position: sticky;
  height: 100vh;
  width: max-content;
  padding: 10px 10px 40px 10px;
  z-index: 1;
  top: 0;
  left: 0;
  @include theme('background', $general-background-light);
  @include theme('box-shadow', $shadow-color, true, 2px 0px 8px 0px);
  transition: all .3s ease;

  .navigation {
    display: flex;
    flex-direction: column;
    justify-content: start;
  }
}

.menu-horizontal {
  display: flex;
  position: sticky;
  width: 100vw;
  padding: 10px 10px 15px 10px;
  z-index: 1;
  top: 0;
  left: 0;
  @include theme('box-shadow', $shadow-color, true, 0px 2px 8px 0px);
  @include theme('background', $general-background-light);
  transition: all .3s ease;

  .navigation {
    display: flex;
    height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
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

.navigation-main, .navigation-other {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.icon-active {
  transform: rotate(360deg);
}

.icon-menu {
  cursor: pointer;
  transition: .3s ease all;
}

.full-screen {
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 98;
}

.header-aside {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

@media only screen and (min-width: 1921px) {
  .menu-vertical {
    height: min-content;
    border-radius: 20px;
    padding: 10px;
  }

  .navigation {
    gap: 50px;
  }
}

.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition-property: opacity, transform;
  transition-duration: .3s;
}

.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

</style>