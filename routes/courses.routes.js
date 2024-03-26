import express from "express";
import { CoursesController } from "../controller/courses.controller.js";

const coursesController = new CoursesController();
const router = express.Router();
import { authenticateToken } from "../middleware/authenticateToken.js";

router.use(authenticateToken);
router.get("/", coursesController.allCourses);
router.get('/users/:userId/courses', coursesController.getCoursesByUserId);
router.post("/", coursesController.newCourse);
router.get("/:id", coursesController.getCourse);
router.delete("/:id", coursesController.deleteCourse);

export default router;