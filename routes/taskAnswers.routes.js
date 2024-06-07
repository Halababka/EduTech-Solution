import express from "express";
import { authenticateToken } from "../middleware/authenticateToken.js";
import { AnswerController } from "../controller/taskAnswers.controller.js";

const answerController = new AnswerController();
const router = express.Router();

router.use(authenticateToken);
router.get('/answers', answerController.getAllAnswers);
router.post("/answers", answerController.createAnswer);
router.put('/answers/grade', answerController.gradeAnswer);
router.put("/answers/:id", answerController.updateAnswer);

export default router;