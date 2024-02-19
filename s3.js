import AWS from 'aws-sdk';

const s3 = new AWS.S3({
    endpoint: "https://s3.aeza.cloud/",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});