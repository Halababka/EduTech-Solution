import { defineNuxtPlugin } from "#app";
import PrimeVue from "primevue/config";
import ToastService from 'primevue/toastservice';

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(PrimeVue, {
        ripple: true,
    });

    // Add the ToastService to the Vue app
    return {
        provide: {
            toast: nuxtApp.vueApp.config.globalProperties.$toast}}
    //other components that you need
});