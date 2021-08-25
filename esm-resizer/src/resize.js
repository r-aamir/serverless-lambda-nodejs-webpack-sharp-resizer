import awS3 from 'aws-sdk/clients/s3';
import sharp from 'sharp';

const s3 = new awS3({signatureVersion: 'v4'});

const isObjectExists = ({ Bucket, Key }) => {
  return s3.headObject({ Bucket, Key })
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

const request = async (url) => {

  const Stream = require('stream').Transform;
  const urlize = require('url').parse;
  const http = require('http');
  const options = urlize(url);

  options.method = 'GET';
  if (!options.port) options.port = 80;

  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        reject(new Error('Status Code: ' + res.statusCode));
      }
      var data = new Stream();
      res.on('data', chunk => {
        data.push(chunk);
      });
      res.on('end', () => {
        data.push(null);
        resolve(data);
      });
    });
    req.on('error', error => reject(error));
    req.end();
  });
};

const fromS3 = ({ Bucket, Key }) => {
  return s3.getObject({ Bucket, Key }).promise();
};

const toS3 = (bucket, key, body) => {
  return s3.upload({
      Body: body,
      Bucket: bucket,
      ContentType: 'image/png',
      Key: key
    }).promise();
};

const toSharp = (w, h, config, buffer) => {
  return sharp(buffer)
    .resize(w, h, config)
    .toFormat('png')
    .toBuffer();
};

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
};

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
};

export {
  isObjectExists,
  fromS3,
  toS3,
  toSharp,
  setSharpConfig,
  request
};