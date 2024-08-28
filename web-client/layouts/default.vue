<script setup lang="ts">

</script>

<template>
  <div class="wrapper">
    <div class="page">
      <slot/>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.wrapper {
  display: flex !important;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  max-width: 1920px;
  @include theme('background', $general-background);
}

@media only screen and (min-width: 1930px) {
  .wrapper {
    min-width: 100vw;
  }
}
</style>