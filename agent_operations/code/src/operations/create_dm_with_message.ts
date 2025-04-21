import { OperationContext, OperationIfc, OperationOutput, Error_Type, ExecuteOperationInput } from "@devrev/typescript-sdk/dist/snap-ins";
import { DevrevSDKUtils} from "../common/utils/devrev_sdk_utils";
import { tryGetAsync } from "../common/utils/tryget";
import logger from "../common/utils/logger";
import checkPropertyValue from "../common/utils/check_property";
import { WorksGetRequest } from "@devrev/typescript-sdk/dist/auto-generated/public-devrev-sdk";

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

async function makeApiCall(url: string, method: string, payloadObj: any, authorization: string): Promise<ApiResponse> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': authorization || '',
    };

    const requestOptions: RequestInit = {
      method: method || 'POST',
      headers,
      ...(method !== 'GET' && { body: JSON.stringify(payloadObj) }),
    };

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`API call failed with status ${response.status}: ${errorText}`);
      return {
        success: false,
        error: `API request failed with status ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    logger.error(`Error making API call to ${url}: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      error: `Failed to make API call: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export class CreateDMWithMessage implements OperationIfc {
  public event: any;

  constructor(event: any) {
    this.event = event;
  }

  async run(metadata: OperationContext, input: ExecuteOperationInput, resources: Record<string, any>): Promise<OperationOutput> {
    try {
      const endpoint = metadata.devrev_endpoint;
      const token = metadata.secrets.access_token;
      const data = input.data as Record<string, any>;
      
      if (data === undefined) {
        logger.error(`received undefined data in CreateDMWithMessage`);
        return {
          error: {
            type: Error_Type.InvalidRequest,
            message: `received undefined data in CreateDMWithMessage`
          },
          output: undefined,
          port_outputs: [],
        };
      }

      const user_oid = data['user_oid'];
      const agent_id = data['agent_id'];
      const message = data['message'];
      const user_auth = data['user_auth'];

      // Validate required fields
      if (!user_oid || !agent_id || !message) {
        return {
          error: {
            type: Error_Type.InvalidRequest,
            message: 'Missing required fields: user_oid, agent_id, or message'
          },
          output: undefined,
          port_outputs: [],
        };
      }

      // Create chat
      const createChatResponse = await makeApiCall(
        `${endpoint}/internal/chats.create`,
        'POST',
        {
          "is_default": false,
          "type": "dm",
          "users": [user_oid, agent_id]
        },
        token
      );

      if (!createChatResponse.success) {
        return {
          error: {
            type: Error_Type.InvalidRequest,
            message: `Failed to create chat: ${createChatResponse.error} with token: ${token}`
          },
          output: undefined,
          port_outputs: [],
        };
      }

      const chat_id = createChatResponse.data?.chat?.id;
      if (!chat_id) {
        return {
          error: {
            type: Error_Type.InvalidRequest,
            message: 'Failed to get chat ID from response'
          },
          output: undefined,
          port_outputs: [],
        };
      }

      // Create message
      const createMessageResponse = await makeApiCall(
        `${endpoint}/internal/timeline-entries.create`,
        'POST',
        {
          "object": chat_id,
          "body": message,
          "type": "timeline_comment"
        },
        token
      );

      if (!createMessageResponse.success) {
        return {
          error: {
            type: Error_Type.InvalidRequest,
            message: `Failed to create message: ${createMessageResponse.error} with token: ${token}`
          },
          output: undefined,
          port_outputs: [],
        };
      }

      return {
        error: undefined,
        output: {
          values: [
            {
              response: createMessageResponse.data?.value,
            },
          ]
        },
        port_outputs: [],
      };
    } catch (error) {
      logger.error(`Unexpected error in CreateDMWithMessage: ${error instanceof Error ? error.message : String(error)}`);
      return {
        error: {
          type: Error_Type.InvalidRequest,
          message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`
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
    // const devrevEndpoint = "http://localhost:8080";
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