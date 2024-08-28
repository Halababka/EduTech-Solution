<script setup lang="ts">
const props = defineProps(['title'])

const dropdown = {
  state: ref(false),
  close: () => {
    dropdown.state.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', dropdown.close)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', dropdown.close)
})

</script>

<template>
  <li class="dropdown" @click.stop="dropdown.state.value = !dropdown.state.value"
      v-bind:style="[dropdown.state.value?{'border-bottom-right-radius': '0','border-bottom-left-radius': '0',}:{}]">
    <slot name="top-title"/>
    {{ props.title }}
    <div v-bind:style="[dropdown.state.value?{'transform':'rotate(90deg)', 'transition':'.1s'}:{ 'transition':'.1s'}]">
      <slot name="bottom-title"/>
    </div>
    <transition name="slide-fade">
      <div class="sub-menu" v-show="dropdown.state.value">
        <slot name="item"/>
      </div>
    </transition>
  </li>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

slot {
  width: 100%;
}

.dropdown {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 5px;
  position: relative;
  font-size: 18px;
  cursor: pointer;
}

.sub-menu {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  cursor: pointer;
  user-select: none;
  z-index: 2;
  width: 100%;
  top: calc(100%);
  border-bottom-right-radius: 10px;
  border-bottom-left-radius: 10px;
  box-shadow: rgba(0, 0, 0, 0.231372549) 0 7px 9px 0;
}
</style>