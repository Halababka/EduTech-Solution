<script setup>
import Column from "primevue/column";
import HeadLinker from "~/components/ui-kit/HeadLinker.vue";

definePageMeta({layout: 'home'})
useHead({
  title: 'Назначение'
})

const runtimeConfig = useRuntimeConfig()

const {
  data: assignData,
  pending: assignPending,
  error: assignError,
  refresh: assignRefresh
} = useFetch(`${runtimeConfig.public.apiBase}/tests/assign/user`, {
  onRequest({request, options}) {
    options.headers = options.headers || {};
    options.headers.authorization = useCookie("token").value;
  }
});

function formatDate(isoDate) {
  if (typeof isoDate !== 'string') {
    return '-';
  }

  const date = new Date(isoDate);

  // Получаем компоненты даты в локальной временной зоне
  const day = date.getDate();
  const month = date.getMonth() + 1; // Месяцы в JavaScript идут от 0 до 11
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Формируем строку даты в нужном формате
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;
}

</script>

<template>
  <div class="main-content white-box">
    <div class="header flex w-full">
      <h2>Тесты</h2>

      <HeadLinker :menuItems="[
      { text: 'Вопросы', url: '/tests' },
      { text: 'Конструктор теста', url: '/tests/create' }
    ]"/>

<!--      <div class="flex items-center">-->
<!--        <input class="inpt mr-2" type="text" placeholder="Поиск">-->
<!--        <button class="btn" type="submit">Найти</button>-->
<!--      </div>-->
    </div>

    <DataTable :value="assignData" class="w-full">
      <Column field="assign.name" header="Название">
        <template #body="slotProps">
          <NuxtLink v-if="slotProps.data.attempts<slotProps.data.assign.testSettings.attemptsCount"
                    :to="'/tests/'+ slotProps.data.assignId">{{ slotProps.data.assign.name }}
          </NuxtLink>
          <p v-else>
            {{ slotProps.data.assign.name }}</p>
        </template>
      </Column>
      <Column header="Начало">
        <template #body="slotProps">
          {{ formatDate(slotProps.data.assign.testSettings.startTime) }}
        </template>
      </Column>
      <Column header="Окончание">
        <template #body="slotProps">
          {{ formatDate(slotProps.data.assign.testSettings.endTime) }}
        </template>
      </Column>
<!--      <Column header="Попытки">-->
<!--        <template #body="slotProps">-->
<!--          {{ slotProps.data.attempts }}/-->
<!--          {{-->
<!--            slotProps.data.assign.testSettings.attemptsCount !== null ? slotProps.data.assign.testSettings.attemptsCount : '∞'-->
<!--          }}-->
<!--        </template>-->
<!--      </Column>-->
      <Column header="Статус" style="min-width: 2rem" class="flex gap-2">
        <template #body="slotProps">
          <Tag class="m-4"
              :severity="slotProps.data.status==='PASSED'?'success':slotProps.data.status==='NOT STARTED'?'secondary':slotProps.data.status==='COMPLETED'?'success':'secondary'"
              value="Secondary"
              v-if="['PASSED', 'NOT STARTED', 'COMPLETED'].includes(slotProps.data.status)">
            {{
              slotProps.data.status === 'PASSED' ? 'Отправлен' : slotProps.data.status === 'NOT STARTED' ? 'Не начат' : slotProps.data.status === 'COMPLETED' ? 'Завершён' : 'Идёт'
            }}
          </Tag>
          <NuxtLink class="m-4" :to="'/tests/'+ slotProps.data.assignId"
                    v-else-if="!['PASSED', 'NOT STARTED', 'COMPLETED'].includes(slotProps.data.status)">Пройти
          </NuxtLink>
        </template>
      </Column>
      <Column header="Результат">
        <template #body="slotProps">
          <NuxtLink :to="'/tests/result/'+ slotProps.data.assignId" v-if="slotProps.data.status=='PASSED'">Перейти
          </NuxtLink>
          <p class="m-0" v-else>-</p>
        </template>
      </Column>
    </DataTable>
  </div>

</template>

<style scoped lang="scss">

</style>