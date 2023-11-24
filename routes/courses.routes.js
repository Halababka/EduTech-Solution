import express from "express";
import { allCourses, newCourses } from "../controller/courses.controller.js";


const router = express.Router();

router.get("/", allCourses);
router.post("/", newCourses);

export default router;