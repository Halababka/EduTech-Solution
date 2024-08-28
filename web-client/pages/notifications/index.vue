<script setup>
definePageMeta({layout: 'home'})
useHead({
  title: 'Уведомления'
})

const notifications = (await useNotification()).value
const notificationItems = ref()
const totalRecords = ref(0);
const rowsPerPage = ref(20);
const currentPage = ref(0);

watchEffect(() => {
  if (!notifications.pending) {
    totalRecords.value = notifications.notificationData.data.length;
    notificationItems.value = notifications.notificationData.data.slice(0, rowsPerPage.value);
  }
});

const onPageChange = (event) => {
  currentPage.value = event.page;
  const start = event.first;
  const end = start + event.rows;
  notificationItems.value = notifications.notificationData.data.slice(start, end);
};
</script>

<template>
  <div class="main-content">
    <div class="notification">
      <div class="header">
        <h2>Уведомления</h2>
        <i class="pi pi-bell" style="font-size: 1.75rem"/>
      </div>
      <div class="notification-content">
        <NuxtLink :to="`/notifications/`" class="notification-card" v-for="notification in notificationItems">
          <p>{{ notification.message }}</p>
        </NuxtLink>
      </div>
      <div class="footer">
        <Paginator
            :rows="rowsPerPage"
            :totalRecords="totalRecords"
            :page="currentPage"
            :rowsPerPageOptions="[10, 20, 30]"
            @page="onPageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

.main-content {
height: 100%;
}

.notification {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height:100%;
  @include theme('background', $general-background-light);
  padding: 20px;
  border-radius: 15px;

  & .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 15px;
  }

  & .footer {
    margin-top: 10px;
  }
}

.notification-content {
  display: flex;
  align-items: start;
  flex-direction: column;
  gap: 10px;
}

.notification-card {
  display: flex;
  width: 20rem;
  align-items: center;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #a9a9a9;

  & p {
    margin: 0px;
  }
}
</style>