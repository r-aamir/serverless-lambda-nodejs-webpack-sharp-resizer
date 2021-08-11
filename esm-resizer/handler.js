import { readStreamFromS3, writeStreamToS3, streamToSharp } from './src/resize';

const SRC_BUCKET = 'cdn.esmart.by';
const DST_BUCKET = process.env.BUCKET;
const dstUrl = `http://${process.env.DST_BUCKET}.s3-website.${process.env.REGION}.amazonaws.com/`;

exports.handler = async (event) => {
  // https://github.com/sagidM/s3-resizer/blob/master/index.js
  // RewriteRule ^(.+)/(.+)/(.+)$ gi.php?type=$1&src=$2&file=$3 [QSA]
  const key = event.queryStringParameters.key;
  const sharpConfig = {}; // {fit: "inside", withoutEnlargement: true}
  const types = {p: 1, u: 1, att: 1};
  const [type, dstDir, fileName] = key.split('/');
  const srcPath = `${types[type]}/${fileName}`;
  const dstPath = `${types[type]}/${dstDir}/${fileName}`;
  
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
    } else if (isRGB(mode)) {
    }
  }

//  console.log({key: key, type: type, src: src, file: file, width: width, height: height, mode: mode});

  try {
    // source bucket read stream from S3
    const readStream = readStreamFromS3({ Bucket: SRC_BUCKET, Key: srcPath });

    // sharp resize stream
    const resizeStream = streamToSharp({ width, height, sharpConfig });

    // destination bucket write streams to S3
    const { writeStream, uploadFinished } = writeStreamToS3({ Bucket: DST_BUCKET, Key: dstPath });

    // trigger the stream
    readStream
      .pipe(resizeStream)
      .pipe(writeStream);

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
