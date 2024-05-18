import express from "express";
import {
    registerLink, createRegisterLink, registerUserToLink, deleteRegisterLinks, getAllRegisterLinks
} from "../controller/registration.controller.js";
import {authenticateToken} from '../middleware/authenticateToken.js'

const router = express.Router();

// Маршруты без токена авторизации
router.get('/', registerLink);
router.post('/', registerUserToLink);

// Маршруты с токеном авторизации
router.use(authenticateToken);
router.get("/links", getAllRegisterLinks);
router.post("/links",createRegisterLink);
router.delete("/links", deleteRegisterLinks);
export default router;