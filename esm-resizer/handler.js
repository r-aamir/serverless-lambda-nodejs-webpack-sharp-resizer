import { isObjectExists, readStreamFromS3, writeStreamToS3, streamToSharp, isRGB } from './src/resize';
import * as request from 'request';

const SRC_BUCKET = 'cdn.esmart.by';
const DST_BUCKET = 'gi.esmart.by';
const dstUrl = `http://${DST_BUCKET}.s3-website.${process.env.REGION}.amazonaws.com/`;

export const resize = async (event) => {

  // https://github.com/sagidM/s3-resizer/blob/master/index.js
  // RewriteRule ^(.+)/(.+)/(.+)$ gi.php?type=$1&src=$2&file=$3 [QSA]
  const key = event.queryStringParameters.key,
        [type, dstDir, fileName] = key.split("/"),
        types = ["p", "u", "att"],
        sharpConfig = {withoutEnlargement: true}; // {fit: "inside", }

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

  try {

    const exists = await isObjectExists({Bucket: SRC_BUCKET, Key: srcPath});
    const resizeStream = streamToSharp({ width, height, sharpConfig });
    const { writeStream, uploadFinished } = writeStreamToS3({ Bucket: DST_BUCKET, Key: dstPath });
    let readStream = null;

    if (exists) {
        readStream = readStreamFromS3({ Bucket: SRC_BUCKET, Key: srcPath });
    } else {
        const { writeSrcStream, uploadSrcFinished } = writeStreamToS3({ Bucket: SRC_BUCKET, Key: srcPath });
        readStream = request.get('http://tco.artrasoft.com/' + srcPath);
        readStream.pipe(writeSrcStream);
        const uploadedSrcData = await uploadSrcFinished;
    }

    readStream.pipe(resizeStream).pipe(writeStream);
    const uploadedData = await uploadFinished;
    
    return {
      statusCode: '301',
      headers: {location: dstUrl + dstPath},
      body: ''
    };
  } catch (err) {
    throw err;
  }
};
