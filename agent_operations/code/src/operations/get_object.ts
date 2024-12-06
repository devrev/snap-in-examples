import { OperationContext, OperationIfc, OperationOutput, Error_Type, ExecuteOperationInput } from "@devrev/typescript-sdk/dist/snap-ins";
import { DevrevSDKUtils} from "../common/utils/devrev_sdk_utils";
import { tryGetAsync } from "../common/utils/tryget";
import logger from "../common/utils/logger";
import checkPropertyValue from "../common/utils/check_property";
import { WorksGetRequest } from "@devrev/typescript-sdk/dist/auto-generated/public-devrev-sdk";

export class GetObject implements OperationIfc {
  public event: any;

  constructor(event: any) {
    this.event = event;
  }

  async run(metadata: OperationContext, input: ExecuteOperationInput, resources: Record<string, any>): Promise<OperationOutput> {
    const endpoint = metadata.devrev_endpoint;
    const token = metadata.secrets.access_token;
    const data = input.data as Record<string, any>;
    if (data === undefined) {
      logger.error(`received undefined data in SuggestSearch`);
      return {
        error: {
          type: Error_Type.InvalidRequest,
          message: `received undefined data in SuggestSearch`
        },
        output: undefined,
        port_outputs: [],
      };
    }
    const id = data['id'];
    const apiUtils = new DevrevSDKUtils(endpoint, token);
    const req = {
      id: id,
    } as WorksGetRequest;
    const res = await tryGetAsync(() => apiUtils.getWork(req));
    if (!res.ok) {
      logger.error(`failed to do suggest search with error: ${res.error}`);
      return {
        error: {
          type: Error_Type.InvalidRequest,
          message: `failed to do suggest search with error: ${res.error}`
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
            response: res.value,
          },
        ]
      },
      port_outputs: [],
    };
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