import { isObjectExists, fromS3, toS3, toSharp, setSharpConfig, request } from './src/resize';
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
      buffer = (await fromS3( {Bucket: SRC_BUCKET, Key: srcPath} )).Body;
    } else {
      buffer = (await request('http://tco.artrasoft.com/' + srcPath)).read();
      await toS3(SRC_BUCKET, srcPath, buffer);
    }

    buffer = await toSharp(width, height, sharpConfig, buffer);
    await toS3(DST_BUCKET, dstPath, buffer);

    return {
      headers: { "Content-Type": "image/png" },
      statusCode: 200,
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: '500',
      body: err.message
    };
  }
};