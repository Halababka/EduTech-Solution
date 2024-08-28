<script setup>
import Button from "primevue/button";

definePageMeta({layout: 'home'})
useHead({
  title: 'Результат'
})
import Chart from 'primevue/chart';
import {useUser} from "~/composables/user";

const runtimeConfig = useRuntimeConfig();
const route = useRoute();
const token = useCookie('token');
const user = (await useUser()).value;

const {
  data: resultData,
  pending: resultPending,
  error: resultError,
  refresh: resultRefresh
} = useFetch(`${runtimeConfig.public.apiBase}/tests/assign/${route.params.id}/result`, {
  method: 'GET',
  onRequest({request, options}) {
    options.headers = options.headers || {};
    options.headers.authorization = useCookie("token").value;
  }
});

const {
  data: userQuestionsData,
  pending: userQuestionsPending,
  error: userQuestionsError,
  refresh: userQuestionsRefresh
} = useFetch(`${runtimeConfig.public.apiBase}/tests/assign/${route.params.id}/result/questions`, {
  method: 'GET',
  onRequest({request, options}) {
    options.headers = options.headers || {};
    options.headers.authorization = useCookie("token").value;
  }
});

const chartsData = ref([]);
const chartsOptions = ref([]);

// Functions to set chart data and options
const setChartData = (data) => {
  const documentStyle = getComputedStyle(document.documentElement);
  const thresholdData = new Array(data.levels.length).fill(data.threshold);

  return {
    labels: data.levels.map((value, index) => index + 1),
    datasets: [
      {
        label: data.subject,
        data: data.levels,
        fill: false,
        borderColor: documentStyle.getPropertyValue('--cyan-500'),
        tension: 0.4
      },
      {
        label: 'Порог',
        data: thresholdData,
        fill: false,
        borderColor: 'red',
        borderDash: [10, 5], // Делает линию пунктирной
        tension: 0
      }
    ]
  };
};

const setChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--text-color');
  const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
  const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

  return {
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    plugins: {
      legend: {
        labels: {
          color: '#000'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary
        },
        grid: {
          color: surfaceBorder
        }
      },
      y: {
        ticks: {
          color: textColorSecondary
        },
        grid: {
          color: surfaceBorder
        }
      }
    }
  };
};

// Watch for changes and set chart data and options
watchEffect(() => {
  if (!resultPending.value && resultData.value) {
    chartsData.value = resultData.value.map(item => setChartData(item));
    chartsOptions.value = resultData.value.map(() => setChartOptions());
  }
});


function getAverageValue(array) {
  const sum = array.reduce((accumulator, current) => accumulator + current, 0);
  return (sum / array.length).toFixed(2);
}

const value = ref(1);
const checked = ref(true);
const unchecked = ref(false);

const generateRecommendations = (chartData) => {
  if (!chartData || !chartData.datasets || chartData.datasets.length < 2) {
    return "Недостаточно данных для генерации рекомендации";
  }

  const physicsData = chartData.datasets.find(dataset => dataset.label === "Физика" || dataset.label === "Органика");
  const thresholdData = chartData.datasets.find(dataset => dataset.label === "Порог");

  if (!physicsData || !thresholdData) {
    return "Недостаточно данных для генерации рекомендации";
  }

  const finalDifficulty = physicsData.data[physicsData.data.length - 1]; // Последнее значение сложности
  const threshold = thresholdData.data[0]; // Пороговое значение

  let recommendations = [];

  if (finalDifficulty < threshold) {
    recommendations.push(`Вам необходимо улучшить результат (${finalDifficulty}) по теме: <strong>${physicsData.label}</strong>.`);
    recommendations.push(`Полученный результат ниже требуемого значения (${threshold}).`);

    // recommendations.push("Повторите темы:");
    // // Возможно, вам нужно будет заменить или дополнить этот блок данными вашего приложения.
    // recommendations.push("- Динамика. Силы");
    // recommendations.push("- Статика. Момент силы");
  } else {
    recommendations.push(`Ваш результат (${finalDifficulty}) по теме: <strong>${physicsData.label}</strong> соответствует требуемому значению (${threshold}) или выше.`);
  }

  return recommendations.join("<br>");
};

</script>

<template>
  <div class="main-content white-box">
    <div class="header w-full">
      <h2>Результат</h2>
      <p>Тестируемый: {{ user.userData.first_name }} {{ user.userData.last_name }}</p>
    </div>
    <div v-if="resultPending && userQuestionsPending">
      <p>Loading...</p>
    </div>
    <div class="w-full" v-else>
      <TabView class="w-full">
        <TabPanel header="График">
          <div class="flex justify-evenly">
            <div class="charts w-2/3">
              <div v-for="(chartData, index) in chartsData" :key="index" class="flex gap-5 items-end">
                <div class="chart w-1/2">
                  <h3>{{ chartData.datasets[0].label }}</h3>
                  <Chart type="line" :data="chartData" :options="chartsOptions[index]" class="w-full"></Chart>
                </div>
                <div class="info w-1/2">
                  <p>
                    Максимальная сложность - {{ Math.max(...chartData.datasets[0].data) }}
                  </p>
                  <p>
                    Минимальная сложность - {{ Math.min(...chartData.datasets[0].data) }}
                  </p>
                  <p>
                    Средняя сложность - {{ getAverageValue(chartData.datasets[0].data) }}
                  </p>
                  <p>
                    Финальная сложность - {{ chartData.datasets[0].data[chartData.datasets[0].data.length - 1] }}
                  </p>
                </div>
              </div>
            </div>
            <Card class="w-1/3">
              <template #title>
                <h3>Рекомендации</h3>
              </template>
              <template #content>
                <div class="recommendations flex flex-col gap-5">
                  <p class="m-0" v-for="(chartData, index) in chartsData" v-html="generateRecommendations(chartData)">
                  </p>
                </div>
              </template>
            </Card>
          </div>
        </TabPanel>
        <TabPanel header="Ответы">
          <div v-for="subject in userQuestionsData">
            <h3>{{ subject.subjectName }}</h3>

            <div v-for="question in subject.questions">
              <h4>{{ question.question.text }}</h4>

              <div v-if="question.question.type === 'ONE_ANSWER'">
                <div v-for="answer in question.answer" :class="answer.selected?'bg-blue-0':''">
                  <div class="flex items-center relative mt-2">
                    <RadioButton v-if="answer.correct" v-model="value" :value="1" disabled/>
                    <RadioButton v-else v-model="value" :value="2" disabled/>
                    <label :for="'answer' + answer.id" class="ml-2">
                      {{ answer.content }}
                    </label>
                    <span v-if="answer.correct && answer.selected">✔</span>
                    <span v-if="!answer.correct && answer.selected">❌</span>
                  </div>
                </div>
              </div>

              <div v-if="question.question.type === 'MANY_ANSWERS'">
                <div v-for="answer in question.answer" :class="answer.selected?'bg-blue-0':''">
                  <div class="flex items-center relative mt-2">
                    <!--                    {{ answer }}-->

                    <Checkbox v-if="answer.correct" v-model="checked" :binary="true" disabled/>
                    <Checkbox v-else v-model="unchecked" :binary="true" disabled/>
                    <label :for="'answer' + answer.id" class="ml-2">
                      {{ answer.content }}
                    </label>
                    <span v-if="answer.correct && answer.selected">✔</span>
                    <span v-else>❌</span>
                  </div>
                </div>
              </div>
              <div v-if="question.question.type === 'TEXT_ANSWER'">
                <div v-for="answer in question.answer">
                  <div class="answer flex items-center gap-5">
                    <p>Ответ:</p>
                    <Textarea v-model="answer.answeredContent" rows="1" autoResize disabled/>
                    <span v-if="answer.content.toUpperCase() === answer.answeredContent.toUpperCase()">✔</span>
                    <span v-else>❌</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </TabPanel>
        <TabPanel header="Информация">
          <DataTable :value="resultData" tableStyle="min-width: 50rem">
            <Column field="subject" header="Тема"></Column>
            <Column field="correct" header="Отвеченные верно"></Column>
            <Column field="total" header="Всего вопросов"></Column>
            <Column header="Результат">
              <template #body="slotProps">
                {{slotProps.data.correct/slotProps.data.total*100}}%
              </template>
            </Column>
          </DataTable>
        </TabPanel>
      </TabView>


    </div>
  </div>

</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;
</style>
