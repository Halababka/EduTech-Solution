<script setup lang="ts">

</script>

<template>
  <div class="loader-overlay">
    <div class="loader"></div>
  </div>
</template>

<style scoped lang="scss">
.loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Задний фон с прозрачностью */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* Поверх всего контента */
}

.loader {
  border: 4px solid #f3f3f3; /* Light grey */
  border-top: 4px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>