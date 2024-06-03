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

router.post('/questions', await testValidates.vaildateQuestion, testValidates.validateAnswers, testsController.createQuestion)
router.get('/questions', testsController.getQuestion)
router.put('/questions/:id', await testValidates.vaildateQuestion, testsController.updateQuestion)
// router.delete('/subjects/:id', testsController.getTest)

router.post('/questions/:questionId/answers', testValidates.validateAnswers, testsController.createAnswer)
router.get('/questions/:questionId/answers', testsController.getAnswers)
router.put('/questions/:questionId/:questionId/answers/:answerId', testsController.updateQuestion)
// router.delete('/questions/:questionId/:questionId/answers/:answerId', testsController.updateQuestion)
// router.delete('/subjects/:id', testsController.getTest)

// router.post('/templates', testValidates.validateTemplate, testsController.createTestTemplate)
router.post('/templates', testsController.createTestTemplate)
router.get('/templates', testsController.getTestTemplates)
// router.put('/templates/:id', testValidates.validateTemplate, testsController.updateTestTemplate)

router.post('/settings', testValidates.validateSettings, testsController.createTestSettings)
router.get('/settings', testsController.getTestSettings)
router.put('/settings/:id', testValidates.validateSettings, testsController.updateTestSettings)

router.get('/assign/user', testsController.getUserTestAssign)
router.post('/assign/:assign_id/nextQuestion/', testValidates.validateNextQuestion, testsController.nextQuestion)

router.post('/assign', testValidates.validateAssign, testsController.createTestAssign)
router.get('/assign', testsController.getTestAssign)
router.put('/assign/:id', testValidates.validateAssign, testsController.updateTestAssign)
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