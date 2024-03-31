import multer from "multer";
import multerS3 from "multer-s3";
import { s3 } from "../s3.js";
import { client } from "../db.js";

export class FileController {
    async uploadFile(req, res) {
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
            limits: { fileSize: 1024*1024*1024} // 1GB лимит файла
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
                    const savedFile = await client.materials.create({
                        data: {
                            name: file.originalname,
                            description: "",
                            mime_type: file.mimetype,
                            path: file.location, // Путь к файлу в S3
                            owner: {connect: {id: parseInt(req.user.id)}}, // Идентификатор пользователя, загрузившего файл (если нужно)
                            size: file.size
                        }
                    });
                    console.log(`File download to BD: ${savedFile.name}`)
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
}