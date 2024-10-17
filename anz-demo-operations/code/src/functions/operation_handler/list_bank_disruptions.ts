import {
  ExecuteOperationInput,
  FunctionInput,
  OperationBase,
  OperationContext,
  OperationOutput,
  OutputValue,
} from '@devrev/typescript-sdk/dist/snap-ins';
import axios from 'axios';

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

interface ListBankDisruptionsInput {
  active: boolean;
}

export class ListBankDisruptions extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const input_data = input.data as ListBankDisruptionsInput;
    let active = input_data.active;
    if (!active) {
      active = true;
    }
    const endpoint = 'https://devrev-demo.proxy.beeceptor.com/feeds';

    try {
      const apiResp = await getCallAPI(
        `${endpoint}/status`,
      );

      const feeds = JSON.stringify(apiResp.data.feeds);

      return OperationOutput.fromJSON({
        summary: `List of bank disruptions - ${feeds}`,
        output: {
          values: [{
            bank_statuses: feeds,
          }],
        } as OutputValue,
      });
    } catch (err) {
      return OperationOutput.fromJSON({ error: err });
    }
  }
}
