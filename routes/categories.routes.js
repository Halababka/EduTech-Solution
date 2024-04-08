import express from 'express';
import { CategoriesController } from "../controller/categories.controller.js";
import { authenticateToken } from "../middleware/authenticateToken.js";

const categoriesController = new CategoriesController();
const router = express.Router();

router.use(authenticateToken)
// Роут для создания категорий
router.post('/', categoriesController.createCategories);

// Роут для получения категорий по их ID
router.post('/getByIds', categoriesController.getCategoryByIds);

// Роут для получения всех категорий
router.get('/', categoriesController.getAllCategories);

// Роут для получения категории по ее ID
router.get('/:id', categoriesController.getCategoryById);

// Роут для обновления категорий
router.put('/', categoriesController.updateCategories);

// Роут для удаления категорий
router.delete('/categories', categoriesController.deleteCategories);
export default router;