<script setup lang="ts">
import ical from "node-ical";

let directEvents: any = ical.sync.parseICS(`BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-TIMEZONE:Europe/Moscow
BEGIN:VTIMEZONE
TZID:Europe/Moscow
X-LIC-LOCATION:Europe/Moscow


BEGIN:STANDARD
TZOFFSETFROM:+0300
TZOFFSETTO:+0300
TZNAME:MSK
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
DTSTART;TZID=Europe/Moscow:20230510T103000
DTEND;TZID=Europe/Moscow:20230510T120500
UID:20230510T103000-1234567890abcdef1234567890
DTSTAMP:20230510T103000
SUMMARY:лекц.Экономика
DESCRIPTION:  доцент   Попова Татьяна Сергеевна
LOCATION:актовый зал
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Moscow:20230510T122000
DTEND;TZID=Europe/Moscow:20230510T135500
UID:20230510T122000-1234567890abcdef1234567890
DTSTAMP:20230510T122000
SUMMARY:лаб.Управление данными
DESCRIPTION:  преподаватель   Литвинов Филипп Борисович
LOCATION:404
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Moscow:20230510T143000
DTEND;TZID=Europe/Moscow:20230510T160500
UID:20230510T143000-1234567890abcdef1234567890
DTSTAMP:20230510T143000
SUMMARY:пр.Культура безопасности
DESCRIPTION:  ст. преподаватель   Евдошкина Юлия Александровна
LOCATION:215
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Moscow:20230510T162000
DTEND;TZID=Europe/Moscow:20230510T175500
UID:20230510T162000-1234567890abcdef1234567890
DTSTAMP:20230510T162000
SUMMARY:лаб.Администрирование в информационных системах
DESCRIPTION:  преподаватель   Коломыцев Сергей Александрович
LOCATION:418
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Moscow:20230511T103000
DTEND;TZID=Europe/Moscow:20230511T120500
UID:20230511T103000-1234567890abcdef1234567890
DTSTAMP:20230511T103000
SUMMARY:лекц.Теория информационных процессов и систем
DESCRIPTION:  профессор   Чернов Александр Викторович
LOCATION:412
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Moscow:20230511T122000
DTEND;TZID=Europe/Moscow:20230511T135500
UID:20230511T122000-1234567890abcdef1234567890
DTSTAMP:20230511T122000
SUMMARY:пр.Теория информационных процессов и систем
DESCRIPTION:  профессор   Чернов Александр Викторович
LOCATION:412
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Moscow:20230511T143000
DTEND;TZID=Europe/Moscow:20230511T160500
UID:20230511T143000-1234567890abcdef1234567890
DTSTAMP:20230511T143000
SUMMARY:пр.Экономика
DESCRIPTION:  доцент   Попова Татьяна Сергеевна
LOCATION:424
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Moscow:20230511T162000
DTEND;TZID=Europe/Moscow:20230511T175500
UID:20230511T162000-1234567890abcdef1234567890
DTSTAMP:20230511T162000
SUMMARY:пр.Физическая культура (элективная дисциплина)
DESCRIPTION:  ст. преподаватель   Николаев Сергей Владимирович
LOCATION:Спортзал
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Moscow:20230512T103000
DTEND;TZID=Europe/Moscow:20230512T120500
UID:20230512T103000-1234567890abcdef1234567890
DTSTAMP:20230512T103000
SUMMARY:лаб.Web-программирование
DESCRIPTION:  преподаватель   Глуховский Кирилл Сергеевич
LOCATION:3-102
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Moscow:20230512T122000
DTEND;TZID=Europe/Moscow:20230512T135500
UID:20230512T122000-1234567890abcdef1234567890
DTSTAMP:20230512T122000
SUMMARY:лаб.Web-программирование
DESCRIPTION:  преподаватель   Глуховский Кирилл Сергеевич
LOCATION:3-102
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Moscow:20230513T084000
DTEND;TZID=Europe/Moscow:20230513T101500
UID:20230513T084000-1234567890abcdef1234567890
DTSTAMP:20230513T084000
SUMMARY:лекц.Методы оптимальных решений
DESCRIPTION:  зав.кафедрой   Цуверкалова Ольга Феликсовна
LOCATION:3-208
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Moscow:20230513T103000
DTEND;TZID=Europe/Moscow:20230513T120500
UID:20230513T103000-1234567890abcdef1234567890
DTSTAMP:20230513T103000
SUMMARY:пр.Методы оптимальных решений
DESCRIPTION:  зав.кафедрой   Цуверкалова Ольга Феликсовна
LOCATION:3-208
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=Europe/Moscow:20230513T122000
DTEND;TZID=Europe/Moscow:20230513T135500
UID:20230513T122000-1234567890abcdef1234567890
DTSTAMP:20230513T122000
SUMMARY:лаб.Методы оптимальных решений
DESCRIPTION:  зав.кафедрой   Цуверкалова Ольга Феликсовна
LOCATION:3-208
END:VEVENT
END:VCALENDAR`);

const keys = Object.keys(directEvents);
const firstKey: any = keys.shift();
delete directEvents[firstKey];
const lastKey = keys.slice(-1);
lastKey.forEach(key => delete directEvents[key]);


interface Event {
  description: string;
  summary: string;
  start: Date;
  end: Date;
  location: string;
}

let calendar: Ref<Event[]> = ref([]);
const today = ref(new Date());

for (let key in directEvents) {
  if (directEvents[key].type === 'VEVENT') {
    const event = directEvents[key];

    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    // Заменяем дату начала и окончания на сегодняшнюю, сохраняя время
    startDate.setFullYear(today.value.getFullYear(), today.value.getMonth(), today.value.getDate());
    endDate.setFullYear(today.value.getFullYear(), today.value.getMonth(), today.value.getDate());

    event.start = startDate;
    event.end = endDate;
    event.dtstamp = startDate;
  }
}

for (let key of Object.keys(directEvents)) {
  const eventStart = new Date(directEvents[key]["start"]);
  const eventEnd = new Date(directEvents[key]["end"]);

  // Проверяем, что событие происходит в текущий день
  if (
      eventStart.getDate() === today.value.getDate() &&
      eventStart.getMonth() === today.value.getMonth() &&
      eventStart.getFullYear() === today.value.getFullYear()
  ) {
    calendar.value.push({
      description: directEvents[key]["description"],
      summary: directEvents[key]["summary"],
      start: eventStart,
      end: eventEnd,
      location: directEvents[key]["location"]
    });
  }
}

const getDayOfWeekRussian = () => {
  const daysOfWeek = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  return daysOfWeek[today.value.getDay()];
};
</script>

<template>
  <div id="timetable">
    <h1 class="m-0 text-wrap">Сегодня {{ getDayOfWeekRussian() }}</h1>
    <div class="flex flex-col gap-2 overflow-y-scroll">
      <div class="block-timetable" v-for="event in calendar">
        <div class="wand"></div>
        <div class="left">
          <div>
            <p>{{ event.summary }}</p>
          </div>
          <div>
            <p>{{ event.description }} <b>{{ event.location }}</b></p>
          </div>
        </div>
        <div class="right">
          <p>{{ event.start.getHours() }}:{{ event.start.getMinutes() }}</p>
          <p>{{ event.end.getHours() }}:{{ event.end.getMinutes() }}</p>
        </div>
      </div>
      <div class="no-events text-xl text-center" v-if="calendar.length===0">
        Сегодня нет занятий
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;
#timetable {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 12px;
  overflow: hidden;
  justify-content: flex-start;
}

.wand {
  @include theme('background', $primary-color);
  position: absolute;
  left: 10px;
  bottom: 10%;
  top: 10%;
  width: 7px !important;
  border-radius: 10px;
}

.block-timetable {
  background: rgb(34 85 244 / 15%);
  @include theme('background', $primary-color-opacity);
  position: relative;
  display: flex;
  flex-direction: row;
  padding: 7px 10px 7px 26px;
  border-radius: 10px;
  @include theme('color', $primary-color);
  align-items: center;
  justify-content: space-between;
}

.right {
  text-align: right;
}
</style>