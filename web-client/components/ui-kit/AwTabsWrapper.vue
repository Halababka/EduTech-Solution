<script setup lang="ts">
import {useSlots} from 'vue'

const slots = useSlots()
const tabTitles = ref(slots.default?.().map((tab) => tab.props.title))
const selectedTitle = ref(tabTitles.value[0])

provide("selectedTitle", selectedTitle)
</script>

<template>
    <div class="tabs">
      <ul class="tabs-header">
        <li class="tabs-header-item"
            v-for="title in tabTitles"
            :key="title"
            :class="{selected: selectedTitle == title}"
            @click="selectedTitle = title"
        >
          <span>{{ title }}</span>
        </li>
      </ul>
    </div>
    <slot/>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.tabs {
padding: 10px 0 10px;
}

.tabs-header {
  display: flex;
  align-items: center;
  gap: 10px 5px;
  justify-content: center;
  margin:0;
  padding:0;
}

.tabs-header-item {
  display: inline-block;
  text-align: center;
  text-justify: auto;
  padding: 10px;
  border-radius: 20px;
  @include theme('border', $primary-color-opacity, true, 2px solid);
  list-style-type: none;
  user-select: none;
  transition: 0.4s all ease-out;
  & span {
    font-size: 18px;
  }
}

.selected {
  @include theme('border', $primary-color, true, 2px solid);
}
</style>