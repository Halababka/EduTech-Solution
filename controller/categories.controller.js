import { client } from "../db.js";
import dbErrorsHandler from "../utils/dbErrorsHandler.js";

export class CategoriesController {
    async createCategories(req, res) {
        const { names } = req.body;
        try {
            const createdCategories = [];
            for (const name of names) {
                // Проверяем, существует ли категория с таким именем
                const existingCategory = await client.categories.findFirst({
                    where: {
                        name: name
                    }
                });

                if (existingCategory) {
                    console.log(`Category ${name} already exists`);
                    continue;
                }

                // Создаем новую категорию
                const createdCategory = await client.categories.create({
                    data: {
                        name: name
                    }
                });

                createdCategories.push(createdCategory);
                console.log(`Category ${name} created successfully`);
            }

            res.status(201).json(createdCategories);
        } catch (error) {
            console.error('Error creating categories:', error);
            res.status(500).json({ error: 'Error creating categories' });
        }
    }
    async getCategoryByIds(req, res) {
        const {ids} = req.body;
        try {
            const categories = await client.categories.findMany({
                where: {
                    id: {in: ids.map(id => parseInt(id))}
                }
            });
            res.status(200).json(categories);
        } catch (error) {
            console.error("Error fetching categories:", error);
            res.status(500).json({error: "Error fetching categories"});
        }
    }

    async getAllCategories(req, res) {
        try {
            const categories = await client.categories.findMany();
            res.status(200).json(categories);
        } catch (error) {
            console.error("Error fetching categories:", error);
            res.status(500).json({error: "Error fetching categories"});
        }
    }

    async getCategoryById(req, res) {
        const {id} = req.params;
        try {
            const category = await client.categories.findUnique({
                where: {id: parseInt(id)}
            });
            if (!category) {
                res.status(404).json({error: "Category not found"});
                return;
            }
            res.status(200).json(category);
        } catch (error) {
            console.error("Error fetching category:", error);
            res.status(500).json({error: "Error fetching category"});
        }
    }

    async updateCategories(req, res) {
        const {ids, name} = req.body;
        try {
            const updatedCategories = await client.categories.updateMany({
                where: {
                    id: {in: ids.map(id => parseInt(id))}
                },
                data: {
                    name
                }
            });
            res.status(200).json(updatedCategories);
        } catch (error) {
            console.error("Error updating categories:", error);
            res.status(500).json({error: "Error updating categories"});
        }
    }

    async deleteCategories(req, res) {
        const {ids} = req.body;
        try {
            await client.categories.deleteMany({
                where: {
                    id: {in: ids.map(id => parseInt(id))}
                }
            });
            res.status(204).send();
        } catch (error) {
            console.error("Error deleting categories:", error);
            res.status(500).json({error: "Error deleting categories"});
        }
    }
}