# variables
stage=${STAGE}
region=${REGION}
bucket=${BUCKET}
secrets='/deploy/secrets/secrets.json'

# Configure your Serverless installation to talk to your AWS account
sls config credentials \
  --provider aws \
  --key ${SLS_KEY} \
  --secret ${SLS_SECRET} \
  --profile ${SLS_PROFILE}

# cd into functions dir
cd /deploy/functions

# Deploy function
echo "------------------"
echo 'Deploying function...'
echo "------------------"
sls deploy

# find and replace the service endpoint
if [ -z ${stage+dev} ]; then echo "Stage is unset."; else echo "Stage is set to '$stage'."; fi

rm $secrets
rm d.tmp
rm i.tmp

sls info -v | grep ServiceEndpoint > d.tmp
sed -i 's@ServiceEndpoint:\ https:\/\/@@g' d.tmp
sed -i "s@/$stage@@g" d.tmp
domain=$(cat d.tmp)
sed "s@.execute-api.$region.amazonaws.com@@g" d.tmp > i.tmp
id=$(cat i.tmp)

echo "------------------"
echo "Domain:"
echo "  $domain"
echo "------------------"
echo "API ID:"
echo "  $id"

echo "{\"DOMAIN\":\"$domain\"}" > $secrets

cd /deploy/bucket

# Deploy bucket config
echo "------------------"
echo 'Deploying bucket...'
sls deploy

echo "------------------"
echo 'Bucket endpoint:'
echo "  http://$bucket.s3-website.$region.amazonaws.com/"

echo "------------------"
echo "Service deployed. Press CTRL+C to exit."
