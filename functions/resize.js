import awS3 from 'aws-sdk/clients/s3';
import sharp from 'sharp';
import stream from 'stream';

const s3 = new awS3({signatureVersion: 'v4'});

// create the read stream abstraction for getting object data from S3
const readStreamFromS3 = ({ Bucket, Key }) => {
  return s3.getObject({ Bucket, Key }).createReadStream()
};

// create the write stream abstraction for uploading data to S3
const writeStreamToS3 = ({ Bucket, Key }) => {
  const pass = new stream.PassThrough();
  return {
    writeStream: pass,
    uploadFinished: s3.upload({
      Body: pass,
      Bucket,
      ContentType: 'image/png',
      Key
    }).promise()
  };
};

// sharp resize stream
const streamToSharp = ({ w, h, config }) => {
  return sharp()
    .resize(w, h, config)
    .toFormat('png') // .jpeg()
}

// sharp resize stream
const isRGB = ({ value }) => {
  return true;
}

export {
  readStreamFromS3,
  writeStreamToS3,
  streamToSharp,
  isRGB
};

