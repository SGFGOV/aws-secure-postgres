
'use strict';

import {
  CloudFormationCustomResourceEvent,
  Context,

} from 'aws-lambda';

import * as executor from './executor.mjs';

import axios from 'axios';

export async function handler(
    event: any,
    context: Context,
): Promise<any> {
  try {

    if ((event as CloudFormationCustomResourceEvent)?.RequestType ==  "Delete")
    {
      console.log("deleting function")
      {
        return {
          statusCode:200,
          body:"function delete request"
        }
      }
    }

    let result = undefined;
    console.log(`the event: ${JSON.stringify(event)}`);
    result = await new executor.Executor().execute(event, context);
    console.info(`Success for request : `,JSON.stringify(result));
    return {statusCode: result.status,
          body: result};
  } catch (error) {
    console.error(`Error for request type ${event.RequestType}: `, error);
    return {statusCode: 400,body: JSON.stringify(error)};
    
  }
}

async function sendResponse(
    event: CloudFormationCustomResourceEvent,
    context: Context,
    responseStatus: string,
    responseData: any,
    physicalResourceId?: string,
): Promise<void> {
  const reason =
    responseStatus == 'FAILED' ? 'See the details in CloudWatch Log Stream: ' + context.logStreamName : undefined;

  const responseBody = JSON.stringify({
    StackId: event.StackId,
    RequestId: event.RequestId,
    Status: responseStatus,
    Reason: reason,
    PhysicalResourceId: physicalResourceId || context.logStreamName,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData,
  });

  const responseOptions = {
    headers: {
      'Content-Type': '',
      'Content-Length': responseBody.length,
    },
  };

  console.info('Response body:\n', responseBody);

  try {
    const axiosClient = new axios.Axios();
    await axiosClient.put(event.ResponseURL, responseBody, responseOptions);
    console.info('CloudFormationSendResponse Success');
  } catch (error: any) {
    console.error('CloudFormationSendResponse Error:');

    if (error.response) {
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      console.error(error.request);
    } else {
      console.error('Error', error.message);
    }

    console.error(error.config);

    throw new Error('Could not send CloudFormation response');
  }
}

export default handler;
