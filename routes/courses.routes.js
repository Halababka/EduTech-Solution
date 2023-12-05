import express from "express";
import { CoursesController } from "../controller/courses.controller.js";

const coursesController = new CoursesController()
const router = express.Router();

router.get("/", coursesController.allCourses);
router.post("/", coursesController.newCourses);

export default router;