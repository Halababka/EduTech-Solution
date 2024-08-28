// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  ssr: false,
  css: [
    'normalize.css/normalize.css',
    'primeicons/primeicons.css',
    "@/assets/themes/mytheme/theme.scss",
    "@/assets/scss/main.scss"],
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8080/api',
      domainName: 'http://127.0.0.1:8080',
      apiNotification: 'http://localhost:8181/api'
    }
  },
  modules: ['@nuxtjs/tailwindcss', "nuxt-primevue"],
  build: {
    transpile: ["primevue"],
  },
  devtools: {
    enabled: false
  }
})