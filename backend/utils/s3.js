const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
});

const BUCKET = process.env.S3_BUCKET;

async function uploadAudio(buffer, key) {
  await s3.putObject({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'audio/mpeg',
  }).promise();

  return key;
}

function getSignedUrl(key, expiresSec = 86400) {
  return s3.getSignedUrl('getObject', {
    Bucket: BUCKET,
    Key: key,
    Expires: expiresSec,
  });
}

module.exports = {
  uploadAudio,
  getSignedUrl,
};
