<template>
  <div class="jitsi-container">
    <iframe
        ref="jitsiIframe"
        :src="jitsiSrc"
        class="jitsi-iframe"
        allow="camera; microphone; fullscreen; display-capture"
    ></iframe>
  </div>
</template>

<script setup>
definePageMeta({layout: 'home'})
useHead({
  title: 'Конференция'
})

const roomName = 'Физика';  // Замените на ваше уникальное имя комнаты
const jitsiSrc = `https://meet.jit.si/${roomName}`;
const jitsiIframe = ref(null);
</script>

<style scoped>
.jitsi-container {
  /*width: 800px;*/
  height: 600px;
  border: 1px solid #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto; /* Выравнивание по центру */
}

.jitsi-iframe {
  width: 100%;
  height: 100%;
  border: none; /* Уберите границу у iframe */
}
</style>
