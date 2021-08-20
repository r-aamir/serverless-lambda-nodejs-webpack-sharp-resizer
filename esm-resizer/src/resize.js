import awS3 from 'aws-sdk/clients/s3';
import sharp from 'sharp';
import stream from 'stream';

//const http = require("http");
//const https = require("https");
//const oUrl = require("url");
const s3 = new awS3({signatureVersion: 'v4'});

// create the read stream abstraction for getting object data from S3
const readStreamFromS3 = ({ Bucket, Key }) => {
  s3.getObjectMetadata({ Bucket, Key }).promise()
    .then(() => {
      return s3.getObject({ Bucket, Key }).createReadStream();
    })
    .catch(error => {
      if (error.statusCode !== 404) {
        throw error;
      }

      return false;
    });
};

//const request = async (sUrl, sKey, method = "GET", postData = null) => {
//  const url = oUrl.parse(sUrl);
//  const lib = url.protocol === "https:" ? https : http;
//  const params = {
//    method: method,
//    host:   url.host,
//    port:   url.port || url.protocol === "https:" ? 443 : 80,
//    path:   sKey
//  };
//  return new Promise((resolve, reject) => {
//    const req = lib.request(params, res => {
//      if (res.statusCode < 200 || res.statusCode >= 300) {
//        return reject(new Error(`Status Code: ${res.statusCode}`));
//      }
//      const data = [];
//      res.on("data", chunk => {
//        data.push(chunk);
//      });
//      res.on("end", () => resolve(Buffer.concat(data).toString()));
//    });
//    req.on("error", reject);
//    if (postData) {
//      req.write(postData);
//    }
//    req.end();
//  });
//}

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
