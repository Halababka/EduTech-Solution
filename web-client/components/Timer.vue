<template>
  <div id="timer">{{ formattedTime }}</div>
</template>

<script setup>
import { useIntervalFn } from '@vueuse/core'

// Пропс для получения startTime
const props = defineProps({
  startTime: {
    type: String,
    required: true
  }
});

// Начальное время в формате Date
const startTime = new Date(props.startTime);

// Состояние для хранения формата времени
const formattedTime = ref('00:00:00');

// Функция для форматирования времени
function pad(number) {
  return number < 10 ? '0' + number : number;
}

// Функция обновления таймера
function updateTimer() {
  const now = new Date();
  const elapsed = now - startTime; // Разница во времени в миллисекундах

  const hours = Math.floor(elapsed / (1000 * 60 * 60));
  const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

  formattedTime.value = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Используем @vueuse/core для интервала
const { pause, resume } = useIntervalFn(updateTimer, 1000);

// Запускаем таймер при монтировании компонента
onMounted(() => {
  updateTimer();
  resume();
});

// Останавливаем таймер при размонтировании компонента
onUnmounted(() => {
  pause();
});
</script>

<style scoped>

</style>
