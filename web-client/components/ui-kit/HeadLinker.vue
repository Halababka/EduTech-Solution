<script setup lang="ts">

const props = defineProps({
  menuItems: {
    type: Array,
    required: true,
  }
})
const menuItems = props.menuItems
</script>

<template>
  <ul class="list-none flex items-center gap-5 flex-wrap text-black">
    <li v-for="(item, index) in menuItems" :key="index">
      <NuxtLink :to="item.url">{{item.text}}</NuxtLink>
    </li>
  </ul>
</template>
-
<style scoped lang="scss">

</style>