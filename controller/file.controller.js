import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3 } from '../s3.js';

const storage = multerS3({
    s3,
    bucket: 'productive-girls',
    acl: 'public-read',
    key: function (req, file, cb) {
        cb(null, `uploads/${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage }).single('file');

export class FileController {
    async uploadFile(req, res) {
        console.log(res)
        try {
            upload(req, res, (err) => {
                if (err instanceof multer.MulterError) {
                    return res.status(500).json({ error: 'Multer error' });
                } else if (err) {
                    return res.status(500).json({ error: 'Unknown error' });
                }

                if (!req.file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }

                console.log('File uploaded:', req.file);
                res.status(200).json({ message: 'File uploaded successfully' });
            });
        } catch (error) {
            console.error('Error uploading file:', error);
            res.status(500).json({ error: 'Error uploading file' });
        }
    }
}