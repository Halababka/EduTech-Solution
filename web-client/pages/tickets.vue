<script setup>
import AwButton from "~/components/ui-kit/AwButton.vue";

definePageMeta({layout: 'home'})
useHead({
  title: 'Тикеты'
})
</script>

<template>
  <div class="main-content">
    <div class="tickets">
      <div class="ticket-card white-box">
        <h2>Название курса</h2>
        <p class="author"><b>Автор: </b>Имя В.</p>
        <div class="materials">
          <b>Содержимое:</b>
          <p>Файлики или ссылочки тексики </p>
        </div>
        <div class="input-form">
          <b>Отзыв:</b>
          <textarea name="description" id="description" rows="3"></textarea>
        </div>
        <AwButton>Ответить</AwButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tickets {
  width: 100%;
}

.ticket-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review {
  display: flex;
  flex-direction: column;
}
textarea{
  margin: 0;
  resize: none;
}
</style>