 # serverless-lambda-nodejs-webpack-sharp-resizer
 
## Getting Started

Resized Images on AWS Lambda with Node.js

Downloads Images from Web and Saves on the source S3 Bucket
Resize Images from a source S3 Bucket to a destination S3 Bucket

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* Node.js 12
  ```sh
  yum install nodejs12
  
* Installing the Serverless Framework
  ```sh
  npm install -g serverless

### Installation

1. Install Serverless Plugins listed in `serverless.yml`
   ```sh
   sls plugin install -n <NAME>
  
2. Install NPM packages listed in `package.json` dependencies
   ```sh
   cd PATH_TO_PROJECT
   npm install
  
3. Configure a AWS named profile `serverless_admin`

   https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html
  
4. Make sure your AWS Region in `.env`
   ```
   REGION=ap-south-1

<!-- USAGE EXAMPLES -->
## Usage

* Deploy
  ```sh
  npm run deploy

* Update Lambda Function
  ```sh
  npm run defunc

