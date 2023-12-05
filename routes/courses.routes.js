import express from "express";
import { CoursesController } from "../controller/courses.controller.js";

const coursesController = new CoursesController()
const router = express.Router();
import { authenticateToken } from '../middleware/authenticateToken.js'

router.get("/", authenticateToken, coursesController.allCourses);
router.post("/", authenticateToken, coursesController.newCourses);

export default router;