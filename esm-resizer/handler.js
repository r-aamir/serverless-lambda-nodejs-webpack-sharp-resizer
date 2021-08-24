import { isObjectExists, streamFromS3, streamToS3, streamToSharp, setSharpConfig, request } from './src/resize';
import { PassThrough } from 'stream'

const SRC_BUCKET = 'cdn.esmart.by';
const DST_BUCKET = 'gi.esmart.by';
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

  try {
    const exists = await isObjectExists( {Bucket: SRC_BUCKET, Key: srcPath} );

    let buffer = null;
    if (exists) {
      buffer = (await streamFromS3( {Bucket: SRC_BUCKET, Key: srcPath} )).Body;
    } else {
      buffer = (await request('http://tco.artrasoft.com/' + srcPath)).read();
      await streamToS3(SRC_BUCKET, srcPath, buffer);
    }

//    const pass = new PassThrough();
//    const stream = streamToS3(DST_BUCKET, dstPath, pass);
//    streamToSharp(width, height, sharpConfig, buffer).pipe(pass);
//    const data = await stream;

    const image = await streamToSharp(width, height, sharpConfig, buffer);
    await streamToS3(DST_BUCKET, dstPath, image);

    return {
      statusCode: '301',
      headers: {location: dstUrl + dstPath},
      body: ''
    };
//    return {
//      statusCode: '200',
//      headers: {
//          'Content-Type': 'image/png',
//          'ContentLength': image.length
//      },
//      isBase64Encoded: 'true',
//      body: image.toString('base64')
//    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: '500',
      body: err.message
    };
  }
};