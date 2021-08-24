import awS3 from 'aws-sdk/clients/s3';
import sharp from 'sharp';
import stream from 'stream';

const s3 = new awS3({signatureVersion: 'v4'});

const isObjectExists = ({ Bucket, Key }) => {
    return s3
      .headObject({ Bucket, Key })
      .promise()
      .then(
        () => true,
        (err) => {
          if (err.statusCode === 404) {
            return false;
          }
          throw err;
        }
      );
};

// create the read stream abstraction for getting object data from S3
const readStreamFromS3 = ({ Bucket, Key }) => {
  return s3.getObject({ Bucket, Key }).createReadStream();
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

const setSharpConfig = (mode, config) => {
  if (!mode) return;

  switch (mode) {
  case 't': // Transparent
    config.fit = sharp.fit.contain;
    config.background = '#fff';
    break;
  case 'l': // ScaleAspectFill, scaled to fill. some portion of image may be clipped
    config.fit = sharp.fit.cover;
    break;
  case 'r': // DEFAULT: ScaleAspectFit, scale to minimum
    config.fit = sharp.fit.inside;
    break;
  default:
    mode = parseColor(mode);
    if (mode !== false) {
      config.fit = sharp.fit.contain;
      config.background = mode;
    }
  }
}

const parseColor = (c) => {
  if (c.indexOf(',') > -1 || c.indexOf('-') > -1) {
    c = c.replaceAll('-', ',');
    switch (c.split(',').length) {
    case 3: case 4:
      return `rgba(${c})`;
    }

    return false;
  }

  switch (c.length) {
  case 3: case 6:
    return '#' + c;
  default:
    return false;
  }
}

export {
  isObjectExists,
  readStreamFromS3,
  writeStreamToS3,
  streamToSharp,
  setSharpConfig
};
