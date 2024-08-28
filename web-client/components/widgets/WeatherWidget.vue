<script setup lang="ts">
import {computed} from "vue";
import translate from "translate";

interface WeatherCodes {
  [code: string]: string;
}

interface WeatherSymbols {
  [description: string]: string;
}

interface WeatherData {
  weather: number;
  weatherText: string;
  lastLessonWeather: number;
  weatherCode: string;
  weatherStatus: string;
  fetchDate: number;
}

interface WeatherError {
  errorText: string;
}

const weatherCodes: WeatherCodes = {
  "0": "Unknown",
  "113": "Sunny",
  "116": "PartlyCloudy",
  "119": "Cloudy",
  "122": "VeryCloudy",
  "143": "Fog",
  "176": "LightShowers",
  "179": "LightSleetShowers",
  "182": "LightSleet",
  "185": "LightSleet",
  "200": "ThunderyShowers",
  "227": "LightSnow",
  "230": "HeavySnow",
  "248": "Fog",
  "260": "Fog",
  "263": "LightShowers",
  "266": "LightRain",
  "281": "LightSleet",
  "284": "LightSleet",
  "293": "LightRain",
  "296": "LightRain",
  "299": "HeavyShowers",
  "302": "HeavyRain",
  "305": "HeavyShowers",
  "308": "HeavyRain",
  "311": "LightSleet",
  "314": "LightSleet",
  "317": "LightSleet",
  "320": "LightSnow",
  "323": "LightSnowShowers",
  "326": "LightSnowShowers",
  "329": "HeavySnow",
  "332": "HeavySnow",
  "335": "HeavySnowShowers",
  "338": "HeavySnow",
  "350": "LightSleet",
  "353": "LightShowers",
  "356": "HeavyShowers",
  "359": "HeavyRain",
  "362": "LightSleetShowers",
  "365": "LightSleetShowers",
  "368": "LightSnowShowers",
  "371": "HeavySnowShowers",
  "374": "LightSleetShowers",
  "377": "LightSleet",
  "386": "ThunderyShowers",
  "389": "ThunderyHeavyRain",
  "392": "ThunderySnowShowers",
  "395": "HeavySnowShowers",
}

const weatherSymbols: WeatherSymbols = {
  "Unknown": "✨",
  "Cloudy": "☁️",
  "Fog": "🌫",
  "HeavyRain": "🌧",
  "HeavyShowers": "🌧",
  "HeavySnow": "❄️",
  "HeavySnowShowers": "❄️",
  "LightRain": "🌦",
  "LightShowers": "🌦",
  "LightSleet": "🌧",
  "LightSleetShowers": "🌧",
  "LightSnow": "🌨",
  "LightSnowShowers": "🌨",
  "PartlyCloudy": "⛅️",
  "Sunny": "☀️",
  "ThunderyHeavyRain": "🌩",
  "ThunderyShowers": "⛈",
  "ThunderySnowShowers": "⛈",
  "VeryCloudy": "☁️",
}

const weather: Ref<WeatherData> = ref({
  fetchDate: 0,
  lastLessonWeather: 0,
  weather: 0,
  weatherCode: "",
  weatherStatus: "",
  weatherText: "",
});

let lastLessonTime = 1705;

const weatherEmoji = computed(() => {
  return weatherSymbols[weatherCodes[weather.value.weatherCode]];
});

const nowDay = computed(() => {
  return new Date().toLocaleString("ru", {weekday: "long"})[0].toUpperCase() + new Date().toLocaleString("ru", {weekday: "long"}).slice(1)
});

function timeIndex(): number {
  let closestTime: number;
  let j = Math.floor(lastLessonTime / 100);
  if (j % 3 > 1) {
    closestTime = j + 1;
  } else {
    closestTime = j - j % 3;
  }
  if (closestTime === 24) {
    closestTime = 0;
  }
  return closestTime / 3;
}

const loading = ref(true);

async function getTemperature() {
  let storedWeather: WeatherData | null = null;
  if (typeof window !== 'undefined') {
    storedWeather = await JSON.parse(<string>localStorage.getItem("weather"));
  }
  if (storedWeather !== null && !isWeatherExpired(storedWeather)) {
    weather.value = await storedWeather
    loading.value = false;
  } else {
    await console.log('Погода истекла или её нет, получаю новую')
    await fetchWeather()
  }
}

function isWeatherExpired(weather: WeatherData): boolean {
  let secondsPassed = 0;
  const hoursExpired = 1;
  const secondsExpired = hoursExpired * 60 * 60;
  const nowSeconds = Date.now() / 1000;
  if (typeof window !== 'undefined') {
    secondsPassed = nowSeconds - weather.fetchDate;
  }
  return secondsPassed > secondsExpired;
}
function containsCyrillic(text: string): boolean {
  return /[а-яА-ЯЁё]/.test(text);
}
async function fetchWeather() {
  const city = "Волгодонск";
  const {
    data,
    pending,
    error,
    refresh
  } = await useFetch(`https://wttr.in/${city}?format=j1`, {
        onRequestError({request, options, error}) {
          // Handle the request errors
          console.log(error)
        },
        async onResponse({request, response, options}) {
          // Process the response data
          const data = response._data
          const fetchedWeather = {
            fetchDate: Math.round(Date.now() / 1000),
            lastLessonWeather: parseInt(data.weather[0].hourly[timeIndex()].tempC),
            weather: parseInt(data.current_condition[0].temp_C),
            weatherCode: data.weather[0].hourly[timeIndex()]["weatherCode"],
            weatherStatus: data.weather[0].hourly[timeIndex()]["lang_ru"][0].value.toLowerCase(),
            weatherText: data.current_condition[0].lang_ru[0].value.toLowerCase(),
          }
          if (!containsCyrillic(fetchedWeather.weatherStatus)) {
            // Перевод на русский, если требуется
            fetchedWeather.weatherStatus = await translate(fetchedWeather.weatherStatus, {to: 'ru'});
          }
          if (!containsCyrillic(weather.value.weatherText)) {
            // Перевод на русский, если требуется
            fetchedWeather.weatherText = await translate(fetchedWeather.weatherText, {to: 'ru'});
          }
          localStorage.setItem('weather', JSON.stringify(fetchedWeather))
          weather.value = fetchedWeather
          loading.value = false;
        },
        onResponseError({request, response, options}) {
          // Handle the response errors
          console.log(response)
        }
      }
  )
}

// fetchWeather()
getTemperature()
</script>

<template>
  <div id='weather' v-bind:class="loading ? 'skeleton' : ''">
    <div class="top">
      <p id='dateNowDay'>{{ weather.weather }}&deg;</p>
      <span id='wicon'>
          {{ weatherEmoji }}
        </span>

    </div>
    <p id='dateNowDay'>{{ nowDay }}, {{ weather.weatherText }}</p>
    <p>К концу занятий {{ weather.lastLessonWeather }}°,
      {{ weather.weatherStatus }}</p>
  </div>
</template>

<style scoped lang="scss">
.lds-ripple {
  align-self: center;
}

#weather {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 5px;

  flex-wrap: nowrap;
}

#weather p, #weather h1 {
  font-size: 24px;
  margin: 0;
}

#weather #wicon {
  font-size: 85pt;
  user-select: none;
  font-family: 'Noto Color Emoji', sans-serif;
}

#weather .top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 120px;
}

.top #dateNowDay {
  font-size: 36pt !important;
}
</style>