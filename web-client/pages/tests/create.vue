<script setup>

import HeadLinker from "~/components/ui-kit/HeadLinker.vue";
import Button from "primevue/button";
import Column from "primevue/column";
import AwButton from "~/components/ui-kit/AwButton.vue";
import AwModal from "~/components/ui-kit/AwModal.vue";

definePageMeta({layout: 'home'})
useHead({
  title: 'Назначение'
})

const token = useCookie('token')
const runtimeConfig = useRuntimeConfig()

// Стейт переменные свойств теста
const settingsId = ref(null)

const testSettingsName = ref(null);

const hasTestDuration = ref(false);
const testDuration = ref(null);

const hasTestAttempts = ref(false);
const testAttempts = ref(null);

const testStart = ref(new Date());
const hasTestStart = ref(false);

const testEnd = ref(new Date());
const hasTestEnd = ref(false);

const modalName = ref('')
const modalActive = ref(false)

const assignName = ref(null)

const levels = ref([1, 2, 3, 4, 5, 6, 7, 8, 9])

// Метод для создания теста
const createTestSettings = () => {
  const data = {}

  if (testSettingsName.value !== null && testSettingsName.value.trim() !== '') {
    data['name'] = testSettingsName.value
  }

  if (hasTestDuration.value !== null) {
    data['duration'] = testDuration.value
  }
  if (hasTestAttempts.value !== null) {
    data['attemptsCount'] = testAttempts.value
  }


  if (hasTestStart.value[0]) {
    data['startTime'] = testStart.value
  }
  if (hasTestEnd.value[0]) {
    data['endTime'] = testEnd.value
  }

  const method = settingsId.value === null ? 'POST' : 'PUT'
  const url = settingsId.value === null ? '' : `/${settingsId.value}`

  fetch(`${runtimeConfig.public.apiBase}/tests/settings${url}`, {
    method: method,
    headers: {
      'Authorization': token.value,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then((response) => {
    switch (response.status) {
      case 200:
        settingsRefresh()
        break;
    }
    return response.json();
  }).then((data) => {
    if (data.id) {
      settingsId.value = data.id
      testSettingsName.value = data.name
      testDuration.value = data.duration
      testAttempts.value = data.attemptsCount
      testStart.value = data.startTime
      testEnd.value = data.endTime
    }
    if (data.error) $toast.add({severity: 'warn', summary: 'Внимание', detail: data.error, life: 3000});
  }).catch((err) => {
    console.error("Невозможно отправить запрос", err);
  });
};

const templateSubjects = ref([]);
const templateName = ref('');
const subjects = ref();
const selectedSubject = ref(null);

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
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

const {
  data: settingsData,
  pending: settingsPending,
  error: settingsError,
  refresh: settingsRefresh
} = useFetch(`${runtimeConfig.public.apiBase}/tests/settings`, {
  onRequest({request, options}) {
    options.headers = options.headers || {};
    options.headers.authorization = useCookie("token").value;
  }
});

const {
  data: templateData,
  pending: templatePending,
  error: templateError,
  refresh: templateRefresh
} = useFetch(`${runtimeConfig.public.apiBase}/tests/templates`, {
  onRequest({request, options}) {
    options.headers = options.headers || {};
    options.headers.authorization = useCookie("token").value;
  }
});

watchEffect(() => {
  if (subjectsData.value !== null) {
    subjects.value = transformData(subjectsData.value);
  }
})

function chooseSubject() {
  templateSubjects.value.push({
    id: selectedSubject.value.id,
    name: selectedSubject.value.name,
    initialDifficulty: 1,
    totalQuestions: 0,
    threshold: 1
  })
  saveTemplateToLocal()
}

const modalParam = ref(0);
const currentIndex = ref(-1);
const currentParam = ref('');

function changeParam(id, param) {
  modalActive.value = true;
  modalName.value = param === 'initialDifficulty' ? 'Начальная сложность' : param === 'totalQuestions' ? 'Количество вопросов' : 'Порог';

  currentIndex.value = templateSubjects.value.findIndex(topic => topic.id === id);
  currentParam.value = param;
}

function saveParam() {
  if (currentParam.value === 'initialDifficulty') {
    templateSubjects.value[currentIndex.value].initialDifficulty = Math.min(Math.max(modalParam.value, 1), 9)
  }
  if (currentParam.value === 'totalQuestions') {
    templateSubjects.value[currentIndex.value].totalQuestions = modalParam.value;
  }
  if (currentParam.value === 'threshold') {
    templateSubjects.value[currentIndex.value].threshold = modalParam.value;
  }

  modalParam.value = 0;
  modalActive.value = false; // Закрытие модального окна после сохранения
  saveTemplateToLocal()
}

function saveTemplateToLocal() {
  localStorage.setItem('templateSubjects', JSON.stringify(templateSubjects.value))
}

onMounted(() => {
  if (localStorage.getItem('templateSubjects') !== null) {
    templateSubjects.value = JSON.parse(localStorage.getItem('templateSubjects'))
  }
  loadUsers()
  loadGroups()
});
const visible = ref(false);

function selectSettings(data) {
  settingsId.value = data.id
  testSettingsName.value = data.name
  testDuration.value = null
  testAttempts.value = null
  testStart.value = null
  testEnd.value = null
  hasTestDuration.value = []
  hasTestAttempts.value = []
  hasTestStart.value = []
  hasTestEnd.value = []

  if (data.duration !== '-') {
    hasTestDuration.value = ["true"]
    testDuration.value = data.duration
  }
  if (data.attemptsCount !== '-') {
    hasTestAttempts.value = ["true"]
    testAttempts.value = data.attemptsCount
  }

  if (data.startTime !== '-') {
    hasTestStart.value = ["true"]
    testStart.value = data.startTime
  }
  if (data.endTime !== '-') {
    hasTestEnd.value = ["true"]
    testEnd.value = data.endTime
  }

  visible.value = false
}

const selectedTemplate = ref();

function chooseTemplate() {
  if (typeof selectedTemplate.value === 'object') {

    templateSubjects.value = selectedTemplate.value.subjectsSettings.map((item) => {
      return {
        id: item.subjectId,
        name: item.subjectName,
        initialDifficulty: item.initialDifficulty === null ? 0 : item.initialDifficulty,
        totalQuestions: item.totalQuestions === null ? 0 : item.totalQuestions,
        threshold: item.threshold === null ? 0 : item.threshold
      };
    })

    // saveTemplateToLocal()
  }
}

function saveTemplate() {
  let subjects = templateSubjects.value.map(item => {
    const {id, ...rest} = item; // деструктурируем объект, исключая id
    return {subjectId: id, ...rest}; // создаем новый объект с subjectId вместо id
  })

  if (!selectedTemplate.value) {
    return $toast.add({severity: 'error', summary: 'Ошибка', detail: 'Не задано имя шаблона', life: 3000});
  }

  if (typeof selectedTemplate.value === 'string') {

    function ensureMandatoryFields(arr) {
      return arr.map(item => {
        if (item.initialDifficulty === undefined) {
          item.initialDifficulty = 0;
        }
        if (item.totalQuestions === undefined) {
          item.totalQuestions = 0;
        }
        if (item.threshold === undefined) {
          item.threshold = 0;
        }
        return item;
      });
    }

    //   Создаём шаблон
    const data = {
      name: selectedTemplate.value,
      subjects: ensureMandatoryFields(subjects)
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", token.value);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(data)
    };

    fetch(`${runtimeConfig.public.apiBase}/tests/templates`, requestOptions)
        .then((response) => {
          switch (response.status) {
            case 201:
              $toast.add({severity: 'success', summary: 'Cохранено', detail: selectedTemplate.value, life: 3000});
              templateRefresh()
              break;
          }
          return response.json();
        }).then((result) => {
      console.log(result)
      if (result.error) {
        $toast.add({severity: 'warn', summary: 'Внимание', detail: result.error, life: 3000});
      } else if (result.id) {
        selectedTemplate.value = result
      }
    }).catch((error) => console.error(error));
  } else {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", token.value);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: JSON.stringify({
        subjects: templateSubjects.value.map(({id, name, ...rest}) => ({
          subjectId: id,
          ...rest
        }))
      })
    };

    fetch(`${runtimeConfig.public.apiBase}/tests/templates/${selectedTemplate.value.id}`, requestOptions)
        .then((response) => {
          switch (response.status) {
            case 200:
              $toast.add({severity: 'success', summary: 'Cохранено', detail: selectedTemplate.value.name, life: 3000});
              templateRefresh()
              break;
          }
          return response.json();
        }).then((result) => {
      if (result.error) {
        $toast.add({severity: 'warn', summary: 'Внимание', detail: result.error, life: 3000});
      } else if (result.id) {
        templateRefresh()
        selectedTemplate.value = result
      }
    }).catch((error) => console.error(error));
  }
}

function deleteTemplate() {
  if (typeof selectedTemplate.value === 'object') {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", token.value);

    const requestOptions = {
      method: "DELETE",
      headers: myHeaders,
    };

    fetch(`${runtimeConfig.public.apiBase}/tests/templates/${selectedTemplate.value.id}`, requestOptions)
        .then((response) => {
          switch (response.status) {
            case 200:
              $toast.add({severity: 'success', summary: 'Удалено', detail: selectedTemplate.value.name, life: 3000});
              templateRefresh()
              localStorage.setItem("templateSubjects", null)
              selectedTemplate.value = null
              templateSubjects.value = []
              break;
          }
          return response.json();
        }).then((result) => {
      if (result.error) {
        $toast.add({severity: 'warn', summary: 'Внимание', detail: result.error, life: 3000});
      }
    }).catch((error) => console.error(error));
  } else {
    $toast.add({severity: 'warn', summary: 'Внимание', detail: 'Не выбран объект для удаления', life: 3000});
  }
}

function deleteSubject(id) {
  templateSubjects.value = templateSubjects.value.filter(item => item.id !== id)
  saveTemplateToLocal()
}

const searchQuery = ref("");
const selectedGroup = ref(null);
const groups = ref([]);
const selectedLetter = ref(null);
const alphabet = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ".split("");
const selectedSearchItems = ref([]); // Выбранные результаты поиска
const searchResults = ref([]);
const selectedParticipantsItems = ref([]); // Выбранные участники
const {$toast} = useNuxtApp();

const loadUsers = async () => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/users`, {
      method: "GET",
      headers: {
        "Authorization": `${token.value}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    const data = await response.json();
    searchResults.value = data;
  } catch (error) {
    console.error("Error loading users:", error);
  }
};

const loadGroups = async () => {
  try {
    const response = await fetch(`${runtimeConfig.public.apiBase}/groups`, {
      method: "GET",
      headers: {
        "Authorization": `${token.value}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }
    const data = await response.json();
    groups.value = data;
  } catch (error) {
    console.error("Error loading groups:", error);
  }
};

// Функция сброса фильтров
const resetFilters = () => {
  searchQuery.value = "";
  selectedGroup.value = null;
  selectedLetter.value = null;
};

const courseInfo = ref({
  enrolledStudents: []
})

const addParticipant = (participant) => {
  if (!courseInfo.value.enrolledStudents.some(p => p.id === participant.id)) {
    courseInfo.value.enrolledStudents.push(participant);
    console.log(courseInfo.value.enrolledStudents);
  } else {
    // Можно добавить обработку ошибки или уведомление о том, что пользователь уже добавлен
    $toast.add({severity: 'warn', summary: 'Внимание', detail: "Пользователь уже добавлен", life: 3000});

  }
};

// Функция добавления выбранных участников
const addSelectedParticipants = () => {
  console.log(selectedSearchItems.value)
  selectedSearchItems.value.forEach(item => {
    if (!courseInfo.value.enrolledStudents.some(p => p.id === item.id)) {
      courseInfo.value.enrolledStudents.push(item);
    }
  });
  selectedSearchItems.value = [];
};

const filteredResults = computed(() => {
  let filtered = [...searchResults.value];

  filtered.forEach(item => {
    item.fullName = `${item.last_name} ${item.first_name} ${item.middle_name}`;
  });

  if (searchQuery.value.trim() !== "") {
    filtered = filtered.filter(item => item.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()));
  }

  if (selectedGroup.value) {
    filtered = filtered.filter(item => item.groups.some(group => group.id === selectedGroup.value));
  }

  if (selectedLetter.value) {
    const firstLetter = selectedLetter.value.toLowerCase();
    filtered = filtered.filter(item => item.last_name.toLowerCase().startsWith(firstLetter));
  }

  return filtered;
});

const removeSelectedParticipants = () => {
  courseInfo.value.enrolledStudents = courseInfo.value.enrolledStudents.filter(item => !selectedParticipantsItems.value.includes(item));
  selectedParticipantsItems.value = [];
};

const displaySelectedParticipants = computed(() => [...courseInfo.value.enrolledStudents]);

const removeParticipant = (participant) => {
  const index = courseInfo.value.enrolledStudents.findIndex(item => item === participant);
  if (index !== -1) {
    courseInfo.value.enrolledStudents.splice(index, 1);
  }
};

function assign() {

  if (typeof selectedTemplate.value !== 'object') {
    return $toast.add({severity: 'warn', summary: 'Внимание', detail: 'Набор тем не выбран', life: 3000});
  }
  if (!settingsId.value) {
    return $toast.add({severity: 'warn', summary: 'Внимание', detail: 'Не заданы свойства', life: 3000});
  }
  if (courseInfo.value.enrolledStudents.map(obj => obj.id).length <= 0) {
    return $toast.add({severity: 'warn', summary: 'Внимание', detail: 'Участники тестирования не выбраны', life: 3000});
  }

  const data = {
    testTemplateId: selectedTemplate.value.id,
    testSettingsId: settingsId.value,
    users: courseInfo.value.enrolledStudents.map(obj => obj.id),
  }

  if (assignName.value !== null || typeof assignName.value === 'string' && assignName.value.trim() !== '') data['name'] = assignName.value

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", token.value);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(data)
  };

  fetch(`${runtimeConfig.public.apiBase}/tests/assign`, requestOptions)
      .then((response) => {
        switch (response.status) {
          case 200:
            $toast.add({severity: 'success', summary: 'Назначено', detail: "Тестирование", life: 3000});
            templateRefresh()
            break;
        }
        return response.json();
      }).then((result) => {
    if (result.error) {
      $toast.add({severity: 'warn', summary: 'Внимание', detail: result.error, life: 3000});
    }
  }).catch((error) => console.error(error));
  // if (!settingsId.value) {
  //   return $toast.add({severity: 'warn', summary: 'Внимание', detail: 'Не заданы свойства', life: 3000});
  // }
}

function calculateSuccess(initialDifficulty, threshold, totalQuestions) {
  if (totalQuestions < 1) return {ok: true};
  if (threshold < 5) return {ok: true};

  let currentDifficulty = initialDifficulty;
  let coefficient = 1;

  for (let i = 0; i < totalQuestions; i++) {
    coefficient = 1 / currentDifficulty; // Коэффициент = 1 / текущая сложность
    // console.log(`После ${i + 1} вопроса: коэффициент = ${coefficient.toFixed(2)}, сложность = ${currentDifficulty.toFixed(2)}`);

    // Если текущая сложность достигла порога или ниже, выходим
    if (currentDifficulty >= threshold) {
      break;
    }

    // Уменьшаем текущую сложность для следующего вопроса
    currentDifficulty += coefficient; // Пример уменьшения на 0.01
  }

  const projectedDifficulty = 1 / coefficient;
  // console.log(`Максимально достижимая сложность: ${projectedDifficulty.toFixed(2)}, тестируемый не сможет достичь порога ${threshold}`);

  const comment = `Максимально достижимая сложность: ${projectedDifficulty.toFixed(2)}, тестируемый не сможет достичь порога ${threshold}`

  return {
    ok: projectedDifficulty >= threshold,
    comment: comment
  };
}

</script>

<template>
  <AwModal @close="modalActive =! modalActive" :modalActive="modalActive" :title="modalName">
    <div class="modal-content flex flex-col gap-2">

      <Panel header="Начальная сложность" v-if="modalName==='Начальная сложность'">
        <p class="m-0">
          <!--          {{ templateSubjects[currentIndex].id}}-->
          <!--          {{ templateData[0].subjectsSettings[0].subjectId }}-->
          <!--          {{templateData.find(item=>item.subjectsSettings[0].subjectId === templateSubjects[currentIndex].id).subjectsSettings[0]}}-->
          <!--          {{templateData.find(item=>item.subjectsSettings[0].subjectId === templateSubjects[currentIndex].id).subjectsSettings[0].minDifficulty}}-->
          <!--          {{templateData.find(item=>item.subjectsSettings[0].subjectId === templateSubjects[currentIndex].id).subjectsSettings[0].maxDifficulty}}-->
          <!--          {{templateData.find(item=>item.subjectsSettings[0].subjectId === templateSubjects[currentIndex].id).subjectsSettings[0].total}}-->
          Сложность, с которой будет начинаться тестирование в заданной теме.
          В данной теме минимальная сложность -
          <!--          {{-->
          <!--            templateData.find(item => item.subjectsSettings[0].subjectId === templateSubjects[currentIndex].id).subjectsSettings[0].minDifficulty-->
          <!--          }},-->
          <!--          максимальная - -->
          <!--          {{-->
          <!--            templateData.find(item => item.subjectsSettings[0].subjectId === templateSubjects[currentIndex].id).subjectsSettings[0].maxDifficulty-->
          <!--          }}-->
        </p>
      </Panel>

      <Panel header="Количество вопросов" v-if="modalName==='Количество вопросов'">
        <p class="m-0">
          Число вопросов, которые будут заданы тестируемому по выбранной теме.
          <!--          В данной теме всего-->
          <!--          - {{-->
          <!--            templateData.find(item => item.subjectsSettings[0].subjectId === templateSubjects[currentIndex].id).subjectsSettings[0].total-->
          <!--          }} вопросов.-->
        </p>
      </Panel>

      <Panel header="Порог" v-if="modalName==='Порог'">
        <p class="m-0">
          Порог, при достижении которого тест будет успешно пройден
        </p>
      </Panel>

      <div class="input flex items-center gap-5 flex-col">

        <div class="badges mt-5" v-if="modalName!=='Количество вопросов'">
          <Badge class="cursor-pointer mr-1" v-for="value in levels"
                 :key="value"
                 :value="value" size="large"
                 :severity="modalParam===value?'':'secondary'"
                 @click="modalParam=value"/>
        </div>

        <input v-else type="number" class="inpt" v-model="modalParam" @keyup.enter="saveParam">
        <AwButton @click="saveParam">Сохранить</AwButton>
      </div>
    </div>
  </AwModal>

  <Dialog v-model:visible="visible" modal header="Сохраненные свойства">

    <DataTable :value="settingsData" v-if="!settingsPending">
      <Column field="name" header="Название"></Column>
      <Column field="startTime" header="Время начала">
        <template #body="slotProps">
          <p>{{ slotProps.data.startTime !== '-' ? formatDateTime(slotProps.data.startTime) : '-' }}</p>
        </template>
      </Column>
      <Column field="endTime" header="Время окончания">
        <template #body="slotProps">
          <p>{{ slotProps.data.endTime !== '-' ? formatDateTime(slotProps.data.endTime) : '-' }}</p>
        </template>
      </Column>
      <Column field="duration" header="Длительность (мин)"></Column>
      <Column field="attemptsCount" header="Количество попыток"></Column>
      <Column header="Действия" class="flex gap-2">
        <template #body="slotProps">
          <Button icon="pi pi-arrow-right" class="p-button-primary my-2"
                  @click="selectSettings(slotProps.data)"></Button>
        </template>
      </Column>
    </DataTable>
  </Dialog>

  <div class="main-content white-box">
    <div class="header flex w-full justify-between">
      <h2>Создать тест</h2>

      <HeadLinker :menuItems="[
      { text: 'Вопросы', url: '/tests' },
      { text: 'Конструктор теста', url: '/tests/create' }
    ]"/>

      <div class="flex items-center">
        <input class="inpt mr-2" type="text" placeholder="Поиск">
        <button class="btn" type="submit">Найти</button>
      </div>
    </div>

    <TabView class="w-full">
      <TabPanel header="Выбор тем">
        <div class="test-template p-2">
          <div class="flex items-center gap-2 my-5">
            <!--          <FloatLabel>-->
            <!--            <InputText id="templateName" v-model="templateName"/>-->
            <!--            <label for="username">Название шаблона</label>-->
            <!--          </FloatLabel>-->
            <Dropdown v-model="selectedTemplate" editable :options="templateData" optionLabel="name"
                      placeholder="Название шаблона" @change="chooseTemplate"/>
            <Button v-tooltip="{ value: 'Сохраните выбранный набор тем, чтобы использовать повторно' }"
                    label="Сохранить набор тем" @click="saveTemplate"/>
            <Button label="Удалить" severity="danger" text @click="deleteTemplate" class="ml-auto"/>
          </div>

          <DataTable :value="templateSubjects">
            <Column field="name" header="Название" style="width: 40%"></Column>
            <Column field="initialDifficulty" header="Начальная сложность" style="width: 10%">
              <template #body="slotProps">
                <p class="w-full" @click="changeParam(slotProps.data.id, 'initialDifficulty')">
                  {{ slotProps.data.initialDifficulty }}</p>
              </template>
            </Column>
            <Column field="totalQuestions" header="Количество вопросов" style="width: 10%">
              <template #body="slotProps">
                <p class="w-full" @click="changeParam(slotProps.data.id,'totalQuestions')">
                  {{ slotProps.data.totalQuestions }}</p>
              </template>
            </Column>
            <Column field="threshold" header="Порог" style="width: 10%">
              <template #body="slotProps">
                <p class="w-full" @click="changeParam(slotProps.data.id,'threshold')">
                  {{ slotProps.data.threshold }}</p>
              </template>
            </Column>
            <Column header="Рекомендации" style="width: 10%">
              <template #body="slotProps">

                <Button icon="pi pi-check-circle"
                        class="m-5"
                        v-if="calculateSuccess(slotProps.data.initialDifficulty, slotProps.data.threshold, slotProps.data.totalQuestions).ok"
                        severity="success" rounded disabled/>

                <Button icon="pi pi-exclamation-circle" class="m-5" v-else rounded severity="warning"
                        v-tooltip="calculateSuccess(slotProps.data.initialDifficulty, slotProps.data.threshold, slotProps.data.totalQuestions).comment"/>
              </template>
            </Column>
            <Column header="Действия">
              <template #body="slotProps">
                <Button icon="pi pi-minus" class="p-button-primary m-5"
                        @click="deleteSubject(slotProps.data.id)"></Button>
              </template>
            </Column>
          </DataTable>

          <div class="add-subject mt-5 flex items-center gap-3">
            <p>Добавить тему:</p>
            <CascadeSelect v-model="selectedSubject" variant="filled" :options="subjects" optionLabel="name"
                           optionGroupLabel="name"
                           :optionGroupChildren="['children', 'children', 'children']"
                           placeholder="Выбор темы"
                           @change="chooseSubject"/>
          </div>

        </div>
      </TabPanel>
      <TabPanel header="Свойства теста">
        <div class="test-settings p-2">
          <div class="field my-3">
            <label for="testName" class="block">Название свойств</label>
            <section class="flex items-center gap-2">
              <InputText class="w-full" id="testName" v-model.trim="testSettingsName"/>
              <Button label="Выбрать" @click="visible = true"/>
            </section>
          </div>
          <div class="field my-3">
            <label for="testDuration" class="block">Длительность теста (минуты)</label>
            <InputNumber v-if="hasTestDuration[0]" class="mt-2 w-full" id="testDuration" v-model.number="testDuration"/>
            <div class="flex align-items-center mt-2">
              <Checkbox v-model="hasTestDuration" inputId="hasTestDuration" name="hasTestDuration" value="true"/>
              <label for="hasTestDuration" class="ml-2"> Включить </label>
            </div>
          </div>
          <div class="field my-3">
            <label for="testAttempts" class="block">Количество попыток</label>
            <InputNumber v-if="hasTestAttempts[0]" class="mt-2 w-full" id="testAttempts" v-model.number="testAttempts"/>
            <div class="flex align-items-center mt-2">
              <Checkbox v-model="hasTestAttempts" inputId="hasTestAttempts" name="hasTestAttempts" value="true"/>
              <label for="hasTestAttempts" class="ml-2"> Включить </label>
            </div>
          </div>
          <div class="field my-3">
            <label for="testStart" class="block">Дата и время начала теста</label>
            <Calendar v-if="hasTestStart[0]" class="mt-2 w-full" id="testStart" v-model="testStart" showIcon showTime/>
            <div class="flex align-items-center mt-2">
              <Checkbox v-model="hasTestStart" inputId="hasTestStart" name="hasTestStart" value="true"/>
              <label for="hasTestStart" class="ml-2"> Включить </label>
            </div>
          </div>
          <div class="field my-3">
            <label for="testEnd" class="block">Дата окончания теста</label>
            <Calendar v-if="hasTestEnd[0]" class="mt-2 w-full" id="testEnd" v-model="testEnd" showIcon showTime/>
            <div class="flex align-items-center mt-2">
              <Checkbox v-model="hasTestEnd" inputId="hasTestEnd" name="hasTestEnd" value="true"/>
              <label for="hasTestEnd" class="ml-2"> Включить </label>
            </div>
          </div>
          <button @click="createTestSettings" class="mt-4 p-button p-component">
            Сохранить свойства
          </button>
        </div>
      </TabPanel>
      <TabPanel header="Назначение">
        <div class="name flex gap-5 mb-5 justify-between">
          <p class="1/5">Название теста:</p>
          <InputText type="text" class="w-4/5" v-model="assignName" placeholder="Название теста..."/>
        </div>
        <Divider/>
        <div class="enrolledStudents-container flex gap-5">
          <!-- Форма поиска и фильтрации -->
          <div class="search-filter-form">
            <div class="filter-bar">
              <!-- Поиск по ФИО -->
              <div class="mb-4">
                <label for="search" class="block text-sm font-medium mb-1">Поиск по ФИО:</label>
                <input type="text" v-model="searchQuery" id="search" name="search" placeholder="Введите ФИО"
                       class="inpt form-input rounded-md shadow-sm w-full">
              </div>
              <div class="mb-4">
                <label for="group" class="block text-sm font-medium mb-1">Фильтр по группам:</label>
                <select v-model="selectedGroup" id="group" name="group"
                        class="form-select rounded-md shadow-sm w-full">
                  <option :value=null>Все группы</option>
                  <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.abbreviation }}</option>
                </select>
              </div>
              <div class="mb-4">
                <label for="lastNameLetter" class="block text-sm font-medium mb-1">Фильтр по первой букве
                  фамилии:</label>
                <select v-model="selectedLetter" id="lastNameLetter" name="lastNameLetter"
                        class="form-select rounded-md shadow-sm w-full">
                  <option :value=null>Все буквы</option>
                  <option v-for="letter in alphabet" :key="letter" :value="letter">{{ letter }}</option>
                </select>
              </div>
              <Button label="Сбросить фильтры" icon="pi pi-times" class="p-button-secondary" @click="resetFilters"/>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex justify-between w-full items-center mb-2">
              <label class="block text-sm font-medium mb-3">Выбор участников</label>
              <Button label="Добавить" icon="pi pi-check" class="p-button-success"
                      :disabled="!selectedSearchItems.length > 0"
                      @click="addSelectedParticipants"/>
            </div>
            <!-- Таблица с результатами поиска -->
            <DataTable :value="filteredResults" showGridlines :paginator="true" :rows="10"
                       tableStyle="min-width: 35rem"
                       v-model:selection="selectedSearchItems">
              <Column selectionMode="multiple" style="width: 1rem"></Column>
              <Column field="fullName" header="ФИО" style="width: 300px"></Column>
              <Column field="groups" header="Группа" style="width: 25%">
                <template #body="{ data }">
        <span v-for="(group, index) in data.groups" :key="index">
          {{ group.abbreviation }}{{ index === data.groups.length - 1 ? "" : ", " }}
        </span>
                </template>
              </Column>
              <Column style="width: 1rem">
                <template #body="slotProps">
                  <Button icon="pi pi-plus" class="p-button-success" @click="addParticipant(slotProps.data)"></Button>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
        <div class="flex flex-col gap-5">
          <div class="flex justify-between w-full items-center">
            <h2>Участники</h2>
            <Button label="Удалить" icon="pi pi-times" class="p-button-danger h-min"
                    :disabled="!selectedParticipantsItems.length > 0"
                    @click="removeSelectedParticipants"/>
          </div>
          <!-- Таблица с выбранными участниками -->
          <DataTable v-model:selection="selectedParticipantsItems" :value="displaySelectedParticipants" showGridlines
                     :paginator="true" :rows="10" tableStyle="min-width: 30rem">
            <Column selectionMode="multiple" style="width: 1rem"></Column>
            <Column field="fullName" header="ФИО" style="width: 55%"></Column>
            <Column field="groups" header="Группа" style="width: 35%">
              <template #body="{ data }">
              <span v-for="(group, index) in data.groups" :key="index">{{
                  group.abbreviation
                }}{{ index === data.groups.length - 1 ? "" : ", " }}</span>
              </template>
            </Column>
            <Column style="min-width: 2rem">
              <template #body="slotProps">
                <Button icon="pi pi-trash" class="p-button-danger"
                        @click="removeParticipant(slotProps.data)"></Button>
              </template>
            </Column>
          </DataTable>
        </div>
        <AwButton class="m-auto" @click="assign()">Назначить</AwButton>
      </TabPanel>
    </TabView>
  </div>
</template>

<style scoped lang="scss">

</style>