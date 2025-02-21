import { OperationContext, OperationIfc, OperationOutput, Error_Type, ExecuteOperationInput } from "@devrev/typescript-sdk/dist/snap-ins";
import logger from "../common/utils/logger";
import checkPropertyValue from "../common/utils/check_property";
import fetch from 'node-fetch';

async function parsePayload(payload: string) {
  try {
    return JSON.parse(payload);
  } catch (parseError) {
    // Try cleaning the payload if initial parse fails
    const cleanPayload = payload.replace(/^\uFEFF/, '').trim();
    return JSON.parse(cleanPayload);
  }
}

async function makeApiCall(url: string, method: string, payloadObj: any, authorization: string) {
  if (method === 'GET') {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization || '',
      },
    });
    return response.json();
  } else {
    const response = await fetch(url, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization || '',
      },
      body: JSON.stringify(payloadObj),
    });
    return response.json();
  }
}

export class APICall implements OperationIfc {
  public event: any;

  constructor(event: any) {
    this.event = event;
  }

  async run(metadata: OperationContext, input: ExecuteOperationInput, resources: Record<string, any>): Promise<OperationOutput> {
    const data = input.data as Record<string, any>;
    if (data === undefined) {
      logger.error(`received undefined data in APICall`);
      return {
        error: {
          type: Error_Type.InvalidRequest,
          message: `received undefined data in APICall`
        },
        output: undefined,
        port_outputs: [],
      };
    }

    const url = data['url'];
    // Check if method is provided and is one of GET, POST, PUT, DELETE. If not, set it to POST.
    const method = data['method'];
    let authorization = data['authorization'];
    const payload = data['payload'];

    if (!url) {
      return {
        error: {
          type: Error_Type.InvalidRequest,
          message: 'URL is required'
        },
        output: undefined,
        port_outputs: [],
      };
    }

    // Check if authorization is empty and URL contains devrev. If so, use the access token from the metadata.
    if ((!authorization || authorization === '') && url.toLowerCase().includes('devrev')) {
      authorization = metadata.secrets.access_token;
    }

    try {
      // Fix payload handling logic
      let payloadObj = {};
      if (payload && payload !== '') {
        payloadObj = await parsePayload(payload);
      }           
      const responseData = await makeApiCall(url, method, payloadObj, authorization);
      
      return {
        error: undefined,
        output: {
          values: [{ response: responseData }],
        },
        port_outputs: [],
      };
    } catch (error) {
      logger.error(`API call failed with error: ${error}`);
      
      return {
        error: {
          type: Error_Type.InvalidRequest,
          message: error instanceof Error 
            ? error.message 
            : `API call failed with error: ${error}`
        },
        output: undefined,
        port_outputs: [],
      };
    }
  }

  GetContext(): OperationContext {
    logger.info(JSON.stringify(this.event));
    const auth = checkPropertyValue(this.event, 'context.secrets.access_token');
    const devorg = checkPropertyValue(this.event, 'context.dev_oid');
    const devrevEndpoint = checkPropertyValue(this.event, 'execution_metadata.devrev_endpoint');
    const inputPortName = checkPropertyValue(this.event, 'payload.input_port_name');

    return {
      devrev_endpoint: devrevEndpoint.value,
      secrets: {
        access_token: auth.value,
      },
      dev_oid: devorg.value,
      input_port: inputPortName.value,
    }
  }
}