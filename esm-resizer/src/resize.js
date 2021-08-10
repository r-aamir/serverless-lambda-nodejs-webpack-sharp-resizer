import AWS from 'aws-sdk';
import sharp from 'sharp';
import stream from 'stream';

const S3 = new AWS.S3({
  signatureVersion: 'v4',
});

const readStreamFromS3 = ({ Bucket, Key }) => {
  return S3.getObject({ Bucket, Key }).createReadStream()
};

const writeStreamToS3 = ({ Bucket, Key }) => {
  const pass = new stream.PassThrough();
  return {
    writeStream: pass,
    uploadFinished: S3.upload({
      Body: pass,
      Bucket,
      ContentType: 'image/png',
      Key
    }).promise()
  }
};

const streamToSharp = ({ width, height }) => {
  return sharp()
    .resize(width, height)
    .toFormat('png')
};

export {
  readStreamFromS3,
  writeStreamToS3,
  streamToSharp,
};

