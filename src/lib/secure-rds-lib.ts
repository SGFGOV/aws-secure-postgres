const { SignatureV4 } = require('@aws-sdk/signature-v4')
const { defaultProvider } = require('@aws-sdk/credential-provider-node')
const { Hash } = require('@aws-sdk/hash-node')
const { HttpRequest } = require('@aws-sdk/protocol-http')
const { formatUrl } = require('@aws-sdk/util-format-url')
const axios = require('axios');

export interface ConfigAws 
{
  dbName: string;
    host:string,port:number,aws_region:string,username:string
}

export let awsConfig:ConfigAws;

export function config(awsConfigApplication : ConfigAws): void
{
    awsConfig = {...awsConfigApplication}
}

const getFileFromUrl = async ( url:string ) => {
    
  
    const response = await axios.get(url);
  
    if (response.status != 200) {
      throw new Error(`unexpected response ${response.data}`);
    }
   
    return response.data.toString()
   
  };
  
  /** Fetches Rds Certificates */
  export async function getCertificate(url=`https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem`) {
    const region = awsConfig.aws_region
    const certificateURL = region?`https://truststore.pki.rds.amazonaws.com/${region}/${region}-bundle.pem`
    :url
  
    const certificate = await getFileFromUrl(certificateURL);
    console.log("fetched certificate")
    return certificate
  
  }
  
  
  /** AWS SPECIFIC REQUIRMENTS */
 export const getToken = async () => {
    const a = getIamAuthToken();
    return a
  };

  const getIamAuthToken = async () => {
    // I don't want to use the older v2 SDK (which had the signer for RDS) 
    // The code below is inspired by comments from: https://github.com/aws/aws-sdk-js-v3/issues/1823
    const signer = new SignatureV4({
      service: 'rds-db',
      region: awsConfig.aws_region ?? "ap-south-1",
      credentials: defaultProvider(),
      sha256: Hash.bind(null, 'sha256')
    })
  
    const request = new HttpRequest({
      method: 'GET',
      protocol: 'https',
      hostname: awsConfig.host,
      port: awsConfig.port,
      query: {
        Action: 'connect',
        DBUser: awsConfig.username
      },
      headers: {
        host: `${awsConfig.host}:${awsConfig.port}`,
      },
    })
  
    const presigned = await signer.presign(request, {
      expiresIn: 900
    })
  
    return formatUrl(presigned).replace(`https://`, '')
  }
  
  

