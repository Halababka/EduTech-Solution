<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()
const props = defineProps({
  item_data: {
    type: Object,
    default: () => {
    }
  }
})
</script>

<template>
  <div id="carousel-item">
    <NuxtLink :to="`/course/${props.item_data.id}`" class="nuxt-link">
      <div class="card zoom-animation">
        <img
            :src="[runtimeConfig.public.apiBase!==props.item_data.img?`${props.item_data.img}`:'assets/imgs/no_course_photo.png']"/>
        <p>{{ props.item_data.name }}</p>
      </div>
    </NuxtLink>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.nuxt-link {
  text-decoration: none;
  color: $dark;
}

.card {
  border: 1px solid $blue;
  height: 100%;
  border-radius: 25px;
  padding: 21px 10px;
  display: flex;
  flex-direction: column;
  text-align: center;
  flex-basis: auto;
  user-select: none;
  cursor: pointer;
  margin: 0 5px;
  width: 140px;
  @include theme('background', $divider-color);
}

.card p {
  overflow: hidden;
  @include theme('color', $primary-text-color);
}

.card img {
  display: block;
  margin: auto;
  width: 110px;
}
</style>
