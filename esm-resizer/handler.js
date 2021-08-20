import { readStreamFromS3, writeStreamToS3, streamToSharp, isRGB } from './src/resize';

const SRC_BUCKET = 'cdn.esmart.by';
const DST_BUCKET = process.env.BUCKET;
const dstUrl = `http://${DST_BUCKET}.s3-website.${process.env.REGION}.amazonaws.com/`;

export const resize = async (event) => {

  // https://github.com/sagidM/s3-resizer/blob/master/index.js
  // RewriteRule ^(.+)/(.+)/(.+)$ gi.php?type=$1&src=$2&file=$3 [QSA]
  const key = event.queryStringParameters.key,
        [type, dstDir, fileName] = key.split("/"),
        types = ["p", "u", "att"],
        sharpConfig = {}; // {fit: "inside", withoutEnlargement: true}

  if (!type || !types.includes(type)) {
    throw new Error(`Allowed categories: ${types.join(",")}`);
  }
  
  const srcPath = `${type}/${fileName}`;
  const dstPath = `${type}/${dstDir}/${fileName}`;

  let [width, height, mode] = dstDir.split('x');

  width = parseInt(width) || null;
  height = parseInt(height) || null;

  if (mode === 'l') {
      // ScaleAspectFill, scaled to fill. some portion of image may be clipped
  } else {
    if (!height) {
      // calc scale and height
    } else if (!width) {
      // calc scale and width
    } else {
      // calc scale = min(height / originalHeight, width / originalWidth);
    }

    if (mode === 'l' || mode === 'r') { // r: ScaleAspectFit, scale to minimum
    } else if (mode === 't') { // Transparent
    } else if (isRGB({ value: mode })) {
    }
  }

//  console.log({key: key, type: type, src: src, file: file, width: width, height: height, mode: mode});

  try {
    // source bucket read stream from S3
    var readStream = readStreamFromS3({ Bucket: SRC_BUCKET, Key: srcPath });

    // sharp resize stream
    const resizeStream = streamToSharp({ width, height, sharpConfig });

    // destination bucket write streams to S3
    const { writeStream, uploadFinished } = writeStreamToS3({ Bucket: DST_BUCKET, Key: dstPath });

    if (readStream === false) {
      const request = require('request');
      const { writeSrcStream, uploadSrcFinished } = writeStreamToS3({ Bucket: SRC_BUCKET, Key: srcPath });
      request('http://tco.artrasoft.com/' + srcPath)
        .pipe(writeSrcStream)
        .pipe(resizeStream)
        .pipe(writeStream);
      const uploadedSrcData = await uploadSrcFinished;
    } else {
      readStream
        .pipe(resizeStream)
        .pipe(writeStream);
    }

    // wait for the stream to finish
    const uploadedData = await uploadFinished;

    // log data to Dashbird
    // console.log('Data: ', {...uploadedData, BucketEndpoint: URL, ImageURL: url});

    // return a 301 redirect to the newly created resource in S3
    return {
      statusCode: '301',
      headers: {location: dstUrl + dstPath},
      body: ''
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: '500',
      body: err.message
    };
  }
};
