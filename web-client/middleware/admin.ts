export default defineNuxtRouteMiddleware((to, from) => {
    if (!process.server) {
        // const role = parseInt(<string>localStorage.getItem('role'))
        // const token = useCookie('token')
        // if ((!role || role !== 3) && token.value) {
        //     return navigateTo('/home')
        // }
    }
})