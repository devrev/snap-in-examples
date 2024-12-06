import { OperationContext, OperationIfc, OperationOutput, Error_Type, ExecuteOperationInput } from "@devrev/typescript-sdk/dist/snap-ins";
import { DevrevSDKUtils, SuggestSearchRequest, SuggestSearchResponse } from "../common/utils/devrev_sdk_utils";
import { tryGetAsync } from "../common/utils/tryget";
import logger from "../common/utils/logger";
import checkPropertyValue from "../common/utils/check_property";

export class SuggestSearch implements OperationIfc {
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
    const query = data['query'];
    const namespace = data['namespace'];
    const apiUtils = new DevrevSDKUtils(endpoint, token);
    const req = {
      namespaces: [namespace],
      query: query + " CHILD(type:comment)",
    } as SuggestSearchRequest;
    const res = await tryGetAsync(() => apiUtils.suggestSearch(req));
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
    const searchResults = res.value as SuggestSearchResponse;
    logger.info(`searchResults: ${JSON.stringify(searchResults)}`);
    let results: string[] = [];
    for (const result of searchResults.results) {
      // stringify the object
      const object = JSON.stringify(result);
      results.push(object);
    }
    logger.info(`SuggestSearch request succeeded, sample result: ${results[0]}`);
    return {
      error: undefined,
      output: {
        values: [
          {
            response: results,
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