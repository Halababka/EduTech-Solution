import express from 'express';
import {TestsController} from '../controller/tests.controller.js';

const testsController = new TestsController();
const router = express.Router();
import {authenticateToken} from '../middleware/authenticateToken.js'

router.use(authenticateToken)

router.post('/subjects', testsController.createSubject)
router.get('/subjects', testsController.getSubjects)
router.put('/subjects/:id', testsController.updateSubjects)
// router.delete('/subjects/:id', testsController.getTest)

router.post('/questions', testsController.createQuestion)
router.get('/questions', testsController.getQuestion)
router.put('/questions/:id', testsController.updateSubjects)
// router.delete('/subjects/:id', testsController.getTest)



// // /tests/
// router.post('/', testsController.getTest)
// router.get('/:id', testsController.getTest)
// router.put('/:id', testsController.getTest)
// router.delete('/:id', testsController.getTest)
// // /tests/themes
// router.post('/themes', testsController.getTest)
// router.get('/themes/:theme_id', testsController.getTest)
// router.put('/themes/:theme_id', testsController.getTest)
// router.delete('/themes/:theme_id', testsController.getTest)
// // /tests/themes/questions
// router.post('/themes/:theme_id/questions', testsController.getTest)
// router.get('/themes/:theme_id/questions/:question_id', testsController.getTest)
// router.put('/themes/:theme_id/questions/:question_id', testsController.getTest)
// router.delete('/themes/:theme_id/questions/:question_id', testsController.getTest)
// // /tests/themes/questions/answers
// router.post('/themes/:theme_id/questions/:question_id', testsController.getTest)
// router.get('/themes/:theme_id/questions/:question_id', testsController.getTest)
// router.put('/themes/:theme_id/questions/:question_id/answers/:answer_id', testsController.getTest)
// router.delete('/themes/:theme_id/questions/:question_id/answers/:answer_id', testsController.getTest)
export default router;