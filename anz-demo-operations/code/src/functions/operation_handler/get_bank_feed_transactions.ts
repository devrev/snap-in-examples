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

interface GetBankFeedTransactionsInput {
  bank_feed_id: string;
}

export class GetBankFeedTransactions extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const input_data = input.data as GetBankFeedTransactionsInput;
    let bank_feed_id = input_data.bank_feed_id;
    const endpoint = 'https://devrev-demo.proxy.beeceptor.com/account/feeds';

    if (!bank_feed_id) {
      bank_feed_id = 'westpac';
    }

    bank_feed_id.replace(' ', '-');

    try {
      const apiResp = await getCallAPI(
        `${endpoint}/${bank_feed_id}/transactions`,
      );

      const transactions = JSON.stringify(apiResp.data.transactions);

      return OperationOutput.fromJSON({
        summary: `${apiResp.data.name} transactions - ${transactions}`,
        output: {
          values: [{
            name: apiResp.data.name,
            transactions: transactions,
          }],
        } as OutputValue,
      });
    } catch (err) {
      return OperationOutput.fromJSON({ error: err });
    }
  }
}
