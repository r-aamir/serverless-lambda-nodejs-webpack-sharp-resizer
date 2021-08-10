import { readStreamFromS3, writeStreamToS3, streamToSharp } from './src/resize';

const BUCKET = process.env.BUCKET;
const URL = 'https://resizer.bocaapp.com';

export const resize = async (event) => {
  const key = event.queryStringParameters.key;
  const match = key.match(/(\d+)x(\d+)\/(.*)/);
  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  const originalKey = match[3];
  const newKey = '' + width + 'x' + height + '/' + originalKey;
  const imageLocation = `${URL}/${newKey}`;

  try {
    const readStream = readStreamFromS3({ Bucket: BUCKET, Key: originalKey });
    const resizeStream = streamToSharp({ width, height });
    const {
      writeStream,
      uploadFinished
    } = writeStreamToS3({ Bucket: BUCKET, Key: newKey });

    readStream
      .pipe(resizeStream)
      .pipe(writeStream);

    const uploadedData = await uploadFinished;

    console.log('Data: ', {
      ...uploadedData,
      BucketEndpoint: URL,
      ImageURL: imageLocation
    });

    return {
      statusCode: '301',
      headers: { 'location': imageLocation },
      body: ''
    }
  } catch (err) {
    return {
      statusCode: '500',
      body: err.message
    }
  }
};