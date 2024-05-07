import express from 'express';
import {TestsController} from '../controller/tests.controller.ts';

const testsController = new TestsController();
const router = express.Router();
import {authenticateToken} from '../middleware/authenticateToken.js'
import {TestValidates} from '../middleware/validates/validateTests.ts'

const testValidates = new TestValidates()

router.use(authenticateToken)

router.post('/subjects', testValidates.validateSubject, testsController.createSubject)
router.get('/subjects', testsController.getSubjects)
router.put('/subjects/:id', testValidates.validateSubject, testsController.updateSubjects)
// router.delete('/subjects/:id', testsController.getTest)

router.post('/topics', testValidates.validateTopic, testsController.createTopic)
router.get('/topics', testsController.getTopics)
router.put('/topics/:id', testValidates.validateTopic, testsController.updateTopic)
// router.delete('/subjects/:id', testsController.getTest)

router.post('/folders', testValidates.validateFolder, testsController.createFolder)
router.get('/folders', testsController.getFolders)
router.put('/folders/:id', testValidates.validateFolder, testsController.updateFolder)
// router.delete('/subjects/:id', testsController.getTest)

router.post('/questions', await testValidates.vaildateQuestion, testsController.createQuestion)
router.get('/questions', testsController.getQuestion)
router.put('/questions/:id', await testValidates.vaildateQuestion, testsController.updateQuestion)
// router.delete('/subjects/:id', testsController.getTest)

router.post('/questions/:questionId/answers', testValidates.vaildateAnswers, testsController.createAnswer)
router.get('/questions/:questionId/answers', testsController.getAnswers)
router.put('/questions/:questionId/:questionId/answers/:answerId', testsController.updateQuestion)
// router.delete('/questions/:questionId/:questionId/answers/:answerId', testsController.updateQuestion)
// router.delete('/subjects/:id', testsController.getTest)

router.post('/template', testsController.createTestTemplate)
router.post('/settings', testsController.createTestSettings)
router.post('/assign', testsController.createTestAssign)
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