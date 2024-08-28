<script setup>
import HeadLinker from "~/components/ui-kit/HeadLinker.vue";
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import AwButton from "~/components/ui-kit/AwButton.vue";
import AwModal from "~/components/ui-kit/AwModal.vue";

definePageMeta({layout: 'home'})
useHead({
  title: 'Тесты'
})

const {$toast} = useNuxtApp();
const token = useCookie('token')
const runtimeConfig = useRuntimeConfig()
const searchQuery = ref("");
const modalName = ref('')
const modalActive = ref(false)
const levels = ref([1, 2, 3, 4, 5, 6, 7, 8, 9])
const selectedAnswer = ref(0)
const selectedSubject = ref(null)
const subjects = ref(null)
const activeQuestionId = ref(0)
const modalButtonText = ref('Создать')

const currentQuestion = ref({
  "text": '',
  "type": {name: 'С одним правильным вариантом ответа', type: 'TEXT_ANSWER'},
  "level": 5
})

const currentAnswers = ref([
  {content: '', correct: true, type: 'TEXT'},
  {content: '', correct: false, type: 'TEXT'}
])

const QuestionTypes = ref([
  {type: 'ONE_ANSWER', name: 'С одним правильным вариантом ответа'},
  {type: 'MANY_ANSWERS', name: 'С несколькими правильными вариантами ответа'},
  {type: 'TEXT_ANSWER', name: 'С текстовым ответом'}
])

const {
  data: questionData,
  pending: questionPending,
  error: questionError,
  refresh: questionRefresh
} = useFetch(`${runtimeConfig.public.apiBase}/tests/questions`, {
  onRequest({request, options}) {
    options.headers = options.headers || {};
    options.headers.authorization = useCookie("token").value;
  }
});

const {
  data: subjectsData,
  pending: subjectsPending,
  error: subjectsError,
  refresh: subjectsRefresh
} = useFetch(`${runtimeConfig.public.apiBase}/tests/subjects`, {
  onRequest({request, options}) {
    options.headers = options.headers || {};
    options.headers.authorization = useCookie("token").value;
  }
});

function openQuestionModal(window_name = '', button_name = 'Создать') {
  modalActive.value = true
  modalName.value = window_name
  modalButtonText.value = button_name
}

const transformData = (serverData) => {

  const map = {};
  const result = [];

  serverData.forEach(item => {
    map[item.id] = {...item, children: []};
  });

  serverData.forEach(item => {
    if (item.parentId !== null) {
      map[item.parentId].children.push(map[item.id]);
    } else {
      result.push(map[item.id]);
    }
  });

  const removeEmptyChildren = (node) => {
    if (node.children.length === 0) {
      delete node.children;
    } else {
      node.children.forEach(removeEmptyChildren);
    }
  };

  result.forEach(removeEmptyChildren);

  return result;
};


function createSubject() {

}

function sendQuestion() {
  if (currentQuestion.value.type.type === 'ONE_ANSWER') {
    currentAnswers.value.forEach((answer, index) => {
      answer.correct = index === selectedAnswer.value;
    });
  }

  if (currentQuestion.value.type.type === 'MANY_ANSWERS' && Array.isArray(selectedAnswer.value)) {
    const updatedAnswers = currentAnswers.value.map((answer, index) => ({
      ...answer,
      correct: selectedAnswer.value.includes(index)
    }));

    currentAnswers.value = updatedAnswers;
  }

  if (currentQuestion.value.type.type === 'TEXT_ANSWER') {
    currentAnswers.value = [currentAnswers.value[0]];
  }

  if (selectedSubject.value) {
    currentQuestion.value.subjectId = selectedSubject.value.id;
  }

  currentQuestion.value.answers = currentAnswers.value;
  // TODO: Эта строчка причастна к исчезанию вариантов ответа
  const temporaryQuestionStorage = currentQuestion.value.type;
  currentQuestion.value.type = currentQuestion.value.type.type;

  let url = `${runtimeConfig.public.apiBase}/tests/questions`
  let method = 'POST'

  if (activeQuestionId.value !== 0) {
    url = `${runtimeConfig.public.apiBase}/tests/questions/${activeQuestionId.value}`
    method = 'PUT'
  }

  fetch(url, {
    method: method,
    headers: {
      'Authorization': token.value,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(currentQuestion.value)
  }).then(async (response) => {
    switch (response.status) {
      case 401:
        break;
      case 200:
        modalActive.value = false;
        modalName.value = ''
        await questionRefresh()
        questions.value = questionData.value.filter(item => item.subjectId === selectedSubject.value.id);
        selectedAnswer.value = 0

        currentAnswers.value = [
          {content: '', correct: true, type: 'TEXT'},
          {content: '', correct: false, type: 'TEXT'}
        ]

        currentQuestion.value = {
          "text": '',
          "type": {name: 'С одним правильным вариантом ответа', type: 'TEXT_ANSWER'},
          "level": 5
        }
        break;
    }
    return response.json();
  }).then((data) => {
    if (data.error) $toast.add({severity: 'warn', summary: 'Внимание', detail: data.error, life: 3000});
  }).catch((err) => {
    console.error("Невозможно отправить запрос", err);
  });

  currentQuestion.value.type = temporaryQuestionStorage;
}

function changeQuestion(id) {
  const question = questionData.value.find(obj => obj.id === id)

  currentAnswers.value = question.answers
  currentQuestion.value = {
    "text": question.text,
    "level": question.level,
    "type": {type: question.type},
    "answers": toRaw(currentAnswers.value),
    "subjectId": question.subjects?.id
  }

  if (currentQuestion.value.subjectId === undefined) currentQuestion.value.subjectId = null

  if (question.type === 'ONE_ANSWER') selectedAnswer.value = question.answers.findIndex(item => item.correct === true)
  if (question.type === 'MANY_ANSWERS') selectedAnswer.value = question.answers.filter(item => item.correct === true).map((item, index) => index);

  activeQuestionId.value = question.id
  openQuestionModal('Изменить вопрос', 'Сохранить')
}

function deleteQuestion(id) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", token.value);

  const requestOptions = {
    method: "DELETE",
    headers: myHeaders,
  };

  fetch(`${runtimeConfig.public.apiBase}/tests/subjects/${id}`, requestOptions)
      .then((response) => {
        switch (response.status) {
          case 200:
            $toast.add({severity: 'success', summary: 'Удалено', detail: 'Успешно', life: 3000});
            questionRefresh()
            break;
        }
        return response.json();
      }).then((result) => {
    if (result.error) {
      $toast.add({severity: 'warn', summary: 'Внимание', detail: result.error, life: 3000});
    }
  }).catch((error) => console.error(error));
}

const questions = ref()

function updateList() {
  questions.value = questionData.value.filter(item => item.text.includes(searchQuery.value));
}

function updateSubject() {
  questions.value = questionData.value.filter(item => item.subjectId === selectedSubject.value.id);
}

watchEffect(() => {

  if (questionData.value !== null) {
    questions.value = questionData.value
  }

  if (subjectsData.value !== null) {
    subjects.value = transformData(subjectsData.value);
  }
})

const visibleSubjectDialog = ref(false);
const newSubjectName = ref('');
const selectednewSubjectParent = ref(null);

function newSubject() {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", token.value);

  const data = {
    name: newSubjectName.value
  }

  if (selectednewSubjectParent.value !== null) data['parentId'] = selectednewSubjectParent.value.id

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(data)
  };

  fetch(`${runtimeConfig.public.apiBase}/tests/subjects`, requestOptions)
      .then((response) => {
        switch (response.status) {
          case 200:
            $toast.add({severity: 'success', summary: 'Cохранено', detail: newSubjectName.value, life: 3000});
            subjectsRefresh()
            break;
        }
        return response.json();
      }).then((result) => {
    if (result.error) {
      $toast.add({severity: 'warn', summary: 'Внимание', detail: result.error, life: 3000});
    }
  }).catch((error) => console.error(error));
}
</script>

<template>
  <Dialog v-model:visible="visibleSubjectDialog" modal header="Создание темы" :style="{ width: '25rem' }">
    <p>Название:</p>
    <InputText type="text" class="w-full" v-model="newSubjectName" placeholder="Введите название..."/>

    <p>Родитель: <span class="cursor-pointer text-blue-500" @click="selectednewSubjectParent = null">Очистить</span></p>
    <CascadeSelect v-model="selectednewSubjectParent" variant="filled" :options="subjects" optionLabel="name"
                   class="w-full"
                   optionGroupLabel="name"
                   :optionGroupChildren="['children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children']"
                   style="min-width: 14rem"
                   placeholder="Выбор темы"/>

    <Button label="Создать" class="my-5" @click="newSubject"/>
  </Dialog>
  <AwModal @close="modalActive =! modalActive" :modalActive="modalActive" :title="modalName">
    <div class="modal-content flex flex-col gap-2">
      <label>Текст вопроса:</label>
      <input type="text" class="inpt" v-model="currentQuestion.text">

      <p>Выбранная тема:</p>
      <CascadeSelect v-model="selectedSubject" variant="filled" :options="subjects" optionLabel="name"
                     optionGroupLabel="name"
                     :optionGroupChildren="['children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children', 'children']"
                     style="min-width: 14rem"
                     placeholder="Выбор темы"/>

      <label>Сложность:</label>
      <div class="level">
        <Badge class="cursor-pointer mr-1" v-for="value in levels" :key="value" :value="value" size="large"
               :severity="currentQuestion.level===value?'':'secondary'"
               @click="currentQuestion.level=value"></Badge>
      </div>

      <div class="questionType">
        <p>Тип вопроса</p>
        <Dropdown v-model="currentQuestion.type" :options="QuestionTypes" optionLabel="name"
                  placeholder="Выбрать тип"
                  class="w-full md:w-14rem"/>
      </div>

      <p v-if="currentQuestion.type.type === 'TEXT_ANSWER'">Ответ:</p>
      <p v-else>Ответы:</p>
      <div class="one-answers" v-if="currentQuestion.type.type === 'ONE_ANSWER'">
        <div class="answer flex gap-2 flex-col" v-for="(answer, index) in currentAnswers">
          <div class="answer-row flex gap-1">
            <InputText type="text" class="w-full" placeholder="Добавить вариант" v-model="answer.content"/>
            <Button icon="pi pi-trash" class="p-button-primary" @click="currentAnswers.splice(index, 1)"
                    v-if="index!==0"></Button>
          </div>
          <div class="flex align-items-center mb-5">
            <RadioButton v-model="selectedAnswer" :inputId="'radio'+index" :name="'radio'+index" :value="index"/>
            <label :for="'radio'+index" class="ml-2">Правильный</label>
          </div>
        </div>

        <InputText type="text" class="w-full" placeholder="Добавить вариант"
                   @click="currentAnswers.push({content: '', correct: false, type: 'TEXT'})"/>
      </div>

      <div class="many-answers" v-else-if="currentQuestion.type.type === 'MANY_ANSWERS'">
        <div class="answer flex gap-2 flex-col" v-for="(answer, index) in currentAnswers">
          <div class="answer-row flex gap-1">
            <InputText type="text" class="w-full" placeholder="Добавить вариант" v-model="answer.content"/>
            <Button icon="pi pi-trash" class="p-button-primary" @click="currentAnswers.splice(index, 1)"
                    v-if="index!==0"></Button>
          </div>
          <div class="flex align-items-center mb-5">
            <Checkbox v-model="selectedAnswer" :inputId="'radio'+index" :name="'radio'+index" :value="index"/>
            <label :for="'radio'+index" class="ml-2">Правильный</label>
          </div>
        </div>
        <InputText type="text" class="w-full" placeholder="Добавить вариант"
                   @click="currentAnswers.push({content: '', correct: false, type: 'TEXT'})"/>
      </div>
      <div class="text-answer" v-else-if="currentQuestion.type.type === 'TEXT_ANSWER'">
        <InputText type="text" class="w-full" placeholder="Добавить вариант" v-model="currentAnswers[0].content"/>
      </div>
      <AwButton @click="sendQuestion">{{ modalButtonText }}</AwButton>
    </div>
  </AwModal>
  <div class="main-content white-box">
    <div class="header flex w-full justify-between">
      <h2>Вопросы</h2>

      <HeadLinker :menuItems="[
      { text: 'Вопросы', url: '/tests' },
      { text: 'Конструктор теста', url: '/tests/create' }
    ]"/>

      <div class="flex items-center">
        <input class="inpt mr-2" type="text" v-model="searchQuery" placeholder="Поиск">
        <button class="btn" @click="updateList">Найти</button>
      </div>
    </div>

    <div class="btn-panel flex w-full gap-2 items-center">
      <Button label="Создать вопрос" @click="openQuestionModal('Создать вопрос')"/>
      <div class="card flex justify-content-center">
        <CascadeSelect v-model="selectedSubject" variant="filled" :options="subjects" optionLabel="name"
                       optionGroupLabel="name"
                       :optionGroupChildren="['children', 'children', 'children']"
                       style="min-width: 14rem"
                       placeholder="Выбор темы"
                       @change="updateSubject"/>
      </div>
      <p class="m-0 cursor-pointer" @click="visibleSubjectDialog = true">Создать тему</p>
    </div>
    <DataTable :value="questions" paginator :rows="50" :rowsPerPageOptions="[10, 50, 100, 150]"
               class="w-full"
               tableStyle="min-width: 50rem"
               paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
               currentPageReportTemplate="{first} to {last} of {totalRecords}">
      <Column field="text" header="Вопрос" style="width: 25%"></Column>
      <Column field="level" header="Сложность" style="width: 25%"></Column>
      <Column field="subject" header="Тема" style="width: 25%">
        <template #body="slotProps">
          {{ slotProps.data.subjects ? slotProps.data.subjects.name : '' }}
        </template>
      </Column>
      <Column field="discriminationIndex" header="a(Дискр.)" style="width: 25%">
        <template #body="slotProps">
          <Button :severity="slotProps.data.discriminationIndex<=0?'danger':''"
                  text v-tooltip="slotProps.data.discriminationComment">
            {{ slotProps.data.discriminationIndex }}
            <i class="pi pi-question-circle" v-if="slotProps.data.discriminationIndex < 0"></i>
          </Button>
        </template>
      </Column>
      <Column header="Действия" style="min-width: 2rem" class="flex gap-2">
        <template #body="slotProps">
          <section class="my-10 flex gap-2">
            <Button icon="pi pi-pen-to-square" class="p-button-primary"
                    @click="changeQuestion(slotProps.data.id)"></Button>
            <Button icon="pi pi-trash" class="p-button-danger" @click="deleteQuestion(slotProps.data.id)"></Button>
          </section>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;


</style>