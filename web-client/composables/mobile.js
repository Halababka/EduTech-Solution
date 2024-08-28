import { useState } from "#app";

export const useMobile = () => {
    return useState('mobile', () => false)
}

export const useMenu = () => {
    return useState('menuActive', () => false)
}

export const handleMobile = async (force = null) => {
    let mobile = useMobile()
    console.log("Force mobile", force)
    if (process.client) {
        if (force !== null) {
            mobile.value = force
        } else {
            mobile.value = !mobile.value
        }
    }

    return mobile
}

export const handleMenu = async (force = null) => {
    let menuActive = useMenu()
    console.log("Force menu", force)
    if (process.client) {
        if (force !== null) {
            menuActive.value = force
        } else {
            menuActive.value = !menuActive.value
        }
    }

    return menuActive
}