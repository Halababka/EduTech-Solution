import multer from "multer";
import multerS3 from "multer-s3";
import { s3 } from "../s3.js";
import { client } from "../db.js";

export class FileController {
    async getAllFiles(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            const files = await client.materials.findMany({
                skip: startIndex,
                take: limit,
                orderBy: {id: "asc"} // Упорядочиваем файлы по возрастанию ID
            });

            const totalCount = await client.materials.count(); // Общее количество файлов

            // Формируем метаданные о пагинации
            const pagination = {};
            if (endIndex < totalCount) {
                pagination.next = {
                    page: page + 1,
                    limit: limit
                };
            }
            if (startIndex > 0) {
                pagination.prev = {
                    page: page - 1,
                    limit: limit
                };
            }

            res.status(200).json({
                status: "success",
                data: files,
                pagination: pagination
            });
        } catch (error) {
            console.error("Error fetching files:", error);
            res.status(500).json({error: "Failed to fetch files"});
        }
    }

    async uploadFiles(req, res) {

        const upload = multer({
            storage: multerS3({
                s3: s3,
                bucket: process.env.S3_BUCKET_NAME,
                contentType: multerS3.AUTO_CONTENT_TYPE,
                acl: "public-read",
                key: (req, file, cb) => {
                    cb(null, `uploads/${Date.now()}-${file.originalname}`);
                }
            }),
            limits: {fileSize: 1024 * 1024 * 1024} // 1GB лимит файла
        }).array("files", 50); // Позволяет загружать до 50 файлов, имя поля 'files'

        upload(req, res, async (err) => {
            if (err) {
                console.error("Error uploading files:", err);
                return res.status(500).json({err});
            }

            try {
                const uploadedFiles = req.files; // Массив загруженных файлов
                // Сохранение информации о каждом файле в базе данных
                const savedFiles = await Promise.all(uploadedFiles.map(async (file) => {
                    // Создание записи в базе данных для файла
                    console.log(file);
                    const savedFile = await client.materials.create({
                        data: {
                            name: file.originalname,
                            description: "",
                            mime_type: file.mimetype,
                            key: file.key,
                            path: file.location, // Путь к файлу в S3
                            owner: {connect: {id: parseInt(req.user.id)}}, // Идентификатор пользователя, загрузившего файл (если нужно)
                            size: file.size
                        }
                    });
                    console.log(`File download to BD: ${savedFile.name}`);
                    return savedFile;
                }));

                console.log("Files uploaded successfully");
                return res.status(200).json({message: "Files uploaded successfully", files: savedFiles});
            } catch (error) {
                console.error("Error saving files to database:", error);
                return res.status(500).json({error: "Error saving files to database"});
            }
        });
    }

    async downloadFile(req, res) {
        const {fileId} = req.params; // Получаем идентификатор файла из запроса

        try {
            // Проверяем, является ли fileId числом
            if (isNaN(fileId)) {
                return res.status(400).json({ error: "File ID must be a number" });
            }
            // Извлекаем информацию о файле из базы данных
            const file = await client.materials.findUnique({
                where: {id: parseInt(fileId)},
                select: {name: true, key: true}
            });
            if (!file) {
                return res.status(404).json({error: "File not found"});
            }

            // Параметры запроса для скачивания файла из S3
            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: file.key // Используем ключ файла из базы данных
            };

            // Скачиваем файл из S3
            const fileStream = s3.getObject(params).createReadStream();

            // Кодируем имя файла
            const encodedFileName = encodeURIComponent(file.name);

            // Устанавливаем заголовок Content-Disposition для скачивания файла с указанием его имени
            res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"`);


            // Отправляем файл в ответ на запрос
            fileStream.pipe(res);
        } catch (error) {
            console.error("Error downloading file:", error);
            res.status(500).json({error: "Error downloading file from S3"});
        }
    }

    async deleteFiles(req, res) {
        try {
            const {fileIds} = req.body;

            // Проверяем, что fileIds является массивом
            if (!Array.isArray(fileIds)) {
                return res.status(400).json({error: "File IDs must be an array"});
            }

            // Проверяем, что массив не пустой
            if (fileIds.length === 0) {
                return res.status(400).json({error: "File IDs array is empty"});
            }

            // Удаляем файлы из хранилища S3
            const deletedFiles = await Promise.all(fileIds.map(async (fileId) => {
                // Находим информацию о файле в базе данных
                const file = await client.materials.findUnique({where: {id: parseInt(fileId)}});

                // Проверяем, существует ли файл
                if (!file) {
                    return {fileId, deleted: false, message: "File not found"};
                }

                // Удаляем файл из хранилища S3
                const params = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: file.path.replace(`https://${process.env.S3_BUCKET_NAME}.s3.aeza.cloud/`, "")
                };

                await s3.deleteObject(params).promise();

                // Удаляем запись о файле из базы данных
                await client.materials.delete({where: {id: parseInt(fileId)}});

                return {fileId, deleted: true, message: "File deleted successfully"};
            }));

            res.status(200).json({message: "Files deleted", deletedFiles});
        } catch (error) {
            console.error("Error deleting files:", error);
            res.status(500).json({error: "Internal server error"});
        }
    }
}