import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3 } from "../s3.js";

export class FileController {
    async uploadFile(req, res) {
        const upload = multer({
            storage: multerS3({
                s3: s3,
                bucket: process.env.S3_BUCKET_NAME,
                contentType: multerS3.AUTO_CONTENT_TYPE,
                acl: 'public-read',
                key: (req, file, cb) => {
                    cb(null, `uploads/${Date.now()}-${file.originalname}`);
                },
            }),
        }).single('file');

        upload(req, res, (err) => {
            if (err) {
                console.error('Error uploading file:', err);
                return res.status(500).json({ error: 'Error uploading file' });
            }

            console.log('File uploaded successfully');
            return res.status(200).json({ message: 'File uploaded successfully' });
        });
    }
}