import AWS from 'aws-sdk';
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';

import { client } from "./db.js";
import multer from 'multer';
import multerS3 from 'multer-s3';

export const s3 = new AWS.S3({
    endpoint: "https://s3.aeza.cloud/",
    accessKeyId: "e32f7655-a850-4ec2-bc33-1ae24a5db424",
    secretAccessKey: "d0396ae78485fa8542b260899ac4bace89cdee5982556fa745e291ed6d728de2",
});

export const uploadFileToS3 = async (bucketName, filePath, fileContent) => {
    const params = {
        Bucket: bucketName,
        Key: filePath,
        Body: fileContent
    };

    try {
        const data = await s3.upload(params).promise();
        console.log(`File uploaded successfully. ETag: ${data.ETag}`);
        return data.Location;
    } catch (error) {
        console.error("Error uploading file: ", error);
        throw error;
    }
};

export const downloadFileFromS3 = async (bucketName, filePath) => {
    const params = {
        Bucket: bucketName,
        Key: filePath
    };

    try {
        const data = await s3.getObject(params).promise();
        console.log(`File downloaded successfully. Content: ${data.Body.toString()}`);
        return data.Body.toString();
    } catch (error) {
        console.log("Error downloading file: ", error);
        throw error;
    }
};

export const deleteFileToS3 = async (bucketName, filePath) => {
    const params = {
        Bucket: bucketName,
        Key: filePath
    };

    try {
        const data = await s3.deleteObject(params).promise();
        console.log(`File deleted successfully.`);
        return data
    } catch (error) {
        console.error("Error uploading file: ", error);
        throw error;
    }
};

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'productive-girls',
        acl: 'public-read',
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + '-' + file.originalname);
        }
    })
});

const uploadFiles = async (req, res) => {
    try {
        upload(req, res, async function(err) {
            if (err) {
                console.error('Error uploading files:', err);
                res.status(500).json({ error: 'Failed to upload files' });
            } else {
                const files = req.files;
                const savedFiles = [];

                for (const file of files) {
                    const { filename } = file;
                    const url = `https://your-s3-bucket-name.s3.amazonaws.com/${filename}`;

                    try {
                        const savedFile = 'ok'
                        savedFiles.push(savedFile);
                    } catch (error) {
                        console.error('Error saving file to database:', error);
                        res.status(500).json({ error: 'Failed to save file to database' });
                    }
                }

                res.json({ message: 'Files uploaded successfully', files: savedFiles });
            }
        });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
};

const bucketName = 'productive-girls';
const filePath = 'file.txt';
const fileContent = 'This is the content of the file';

// uploadFileToS3(bucketName, filePath, fileContent)
//     .then(() => {
//         return downloadFileFromS3(bucketName, filePath);
//     })
//     .catch(error => {
//         console.error("An error occurred: ", error);
//     });