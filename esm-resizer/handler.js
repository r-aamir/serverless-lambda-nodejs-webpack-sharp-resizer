import { isObjectExists, readStreamFromS3, writeStreamToS3, streamToSharp, setSharpConfig } from './src/resize';
import * as request from 'request';

const SRC_BUCKET = 'cdn.esmart.by';
const DST_BUCKET = process.env.BUCKET;
const dstUrl = `http://${DST_BUCKET}.s3-website.${process.env.REGION}.amazonaws.com/`;

export const resize = async (event) => {

  const key = event.queryStringParameters.key,
        [type, dstDir, fileName] = key.split('/'),
        types = ['p', 'u', 'att'];

  if (!type || !types.includes(type)) {
    throw new Error(`Allowed categories: ${types.join(",")}`);
  }

  const srcPath = `${type}/${fileName}`;
  const dstPath = `${type}/${dstDir}/${fileName}`;
  const sharpConfig = {fit: 'inside', withoutEnlargement: true};

  let [width, height, mode] = dstDir.split('x');
  width = parseInt(width) || null;
  height = parseInt(height) || null;
  setSharpConfig(mode, sharpConfig);
console.log('key',key);
console.log('type',type);
console.log('dstDir',dstDir);
console.log('fileName',fileName);
console.log('srcPath',srcPath);
console.log('dstPath',dstPath);
console.log('width',width);
console.log('height',height);
console.log('mode',mode);
console.log('sharpConfig',sharpConfig);
  try {

    const exists = await isObjectExists({Bucket: SRC_BUCKET, Key: srcPath});
console.log('exists',exists);
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
