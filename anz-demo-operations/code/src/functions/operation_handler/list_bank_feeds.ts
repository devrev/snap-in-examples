import {
  ExecuteOperationInput,
  FunctionInput,
  OperationBase,
  OperationContext,
  OperationOutput,
  OutputValue,
} from '@devrev/typescript-sdk/dist/snap-ins';
import axios from 'axios';
import { type } from 'os';

export async function getCallAPI(endpoint: string) {
  try {
    const res = await axios.get(endpoint, {
      headers: {
        'Content-type': 'application/json',
      },
    });
    const data = res.data;
    console.log(data);
    return { success: true, errMessage: 'Data successfully fetched', data: data };
  } catch (error: any) {
    if (error.response) {
      return { success: false, errMessage: error.response.data };
    } else if (error.request) {
      return { success: false, errMessage: error.request.data };
    } else {
      return { success: false, errMessage: error };
    }
  }
}

interface ListBankFeedsInput {
  active: boolean;
}

export class ListBankFeeds extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const input_data = input.data as ListBankFeedsInput;
    let active = input_data.active;
    if (!active) {
      active = true;
    }
    const endpoint = 'https://devrev-demo.proxy.beeceptor.com/account/feeds/list';

    try {
      const apiResp = await getCallAPI(
        `${endpoint}`,
      );
      let feeds = apiResp.data;
      if (typeof apiResp.data !== 'string') {
        feeds = JSON.stringify(apiResp.data);
      }

      return OperationOutput.fromJSON({
        summary: `List of bank feeds - ${feeds}`,
        output: {
          values: [{
            feeds: feeds,
          }],
        } as OutputValue,
      });
    } catch (err) {
      return OperationOutput.fromJSON({ error: err });
    }
  }
}
