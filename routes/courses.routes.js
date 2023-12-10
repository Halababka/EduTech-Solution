import express from "express";
import { CoursesController } from "../controller/courses.controller.js";

const coursesController = new CoursesController()
const router = express.Router();
import { authenticateToken } from '../middleware/authenticateToken.js'

router.use(authenticateToken)
router.get("/", coursesController.allCourses);
router.post("/", coursesController.newCourse);

export default router;