<script setup>

definePageMeta({layout: 'home'})
useHead({
  title: 'Тестирование'
})

const runtimeConfig = useRuntimeConfig()
const route = useRoute()
const router = useRouter()
const {$toast} = useNuxtApp();
const token = useCookie('token')


const selectedAnswers = ref([])
const answerText = ref('')

const {
  data: questionData,
  pending: questionPending,
  error: questionError,
  refresh: questionRefresh
} = useFetch(`${runtimeConfig.public.apiBase}/tests/assign/${route.params.id}/nextQuestion`, {
  method: 'POST',
  onRequest({request, options}) {
    options.headers = options.headers || {};
    options.headers.authorization = useCookie("token").value;
  },
  onResponse({response}) {
    // Сохраняем код статуса ответа

    if (response.status === 204) {
      $toast.add({severity: 'success', summary: 'Тест завершён', detail: response._data.error, life: 3000});
      router.push('/tests/assign')
    } else if (response._data.error) {
      $toast.add({severity: 'warn', summary: 'Внимание', detail: response._data.error, life: 3000});
      router.push('/tests/assign')
    }
  },
  onError({error}) {
    // Обработка ошибки (если нужно)
    console.error('Request error:', error);
  }
});


function sendAnswer() {

  let fetchBody = questionData.value.type === 'ONE_ANSWER' ? {ids: [selectedAnswers.value]} :
      questionData.value.type === 'MANY_ANSWERS' ? {ids: selectedAnswers.value} :
          questionData.value.type === 'TEXT_ANSWER' ? {text_answer: answerText.value} : null

  fetch(`${runtimeConfig.public.apiBase}/tests/assign/${route.params.id}/nextQuestion`, {
    method: 'POST',
    headers: {
      'Authorization': token.value,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fetchBody)
  }).then((response) => {
    switch (response.status) {
      case 401:
        break;
      case 403:
        router.push(`/tests/assign`)
        break;
      case 204:
        router.push(`/tests/result/${route.params.id}`)
        break;
      case 200:
        questionRefresh()
        selectedAnswers.value = []
        answerText.value = ''
        break;
    }
    return response.json();
  }).then((data) => {
    // if (data.error) $toast.add({severity: 'warn', summary: 'Внимание', detail: data.error, life: 3000});
  }).catch((err) => {
    console.error("Невозможно отправить запрос", err);
  });
}

</script>

<template>
  <Breadcrumb :model="questionData.breadcrumb" v-if="!questionPending"
              class="max-w-[1100px] mx-auto my-0 mb-4 rounded-[15px]"/>

  <div class="max-w-[1100px] mx-auto my-0 p-4 mb-4 rounded-[15px] bg-white flex items-center justify-between">
    <Timer :startTime="questionData.startTime"
           v-if="questionData && questionData.startTime"/>
    <p class="m-0" v-if="questionData && questionData.duration">
      На тест выделено {{ questionData.duration }} мин.
    </p>
  </div>

  <div class="main-content white-box flex flex-col" v-if="!questionPending">
    <h1> {{ questionData.text }} </h1>
    <div class="flex flex-col gap-8 w-full px-12 align-center justify-center">
      <div v-if="questionData.type !== 'TEXT_ANSWER'" class="grid grid-cols-2 gap-6">
        <div v-for="answer in questionData.answers" :key="answer.id">
          <div v-if="questionData.type === 'ONE_ANSWER'" class="flex gap-2 p-2 rounded-lg">
            <RadioButton v-model="selectedAnswers" :inputId="String(answer.id)" name="answer" :value="answer.id"/>
            <label :for="answer.id">{{ answer.content }}</label>
          </div>
          <div v-else class="flex gap-2 p-2 rounded-lg">
            <Checkbox v-model="selectedAnswers" :inputId="String(answer.id)" name="answer" :value="answer.id"/>
            <label :for="String(answer.id)">{{ answer.content }}</label>
          </div>
        </div>
      </div>
      <div v-else class="flex align-center justify-center">
        <Textarea v-model="answerText" autoResize rows="8" cols="60"/>
      </div>
      <div class="flex w-full align-center justify-center">
        <button class="btn" @click="sendAnswer">Подтвердить</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;
</style>
