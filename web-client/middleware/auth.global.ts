export default defineNuxtRouteMiddleware(async (to, from) => {
    if (!process.server) {
        const token = useCookie('token')
        if (!token.value && to.path !== '/' && to.path !== '/registration') {
            return navigateTo('/');
        }
        if (token.value && to.path == '/') {
            return navigateTo('/home')
        }
    }
})
