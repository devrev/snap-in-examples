import { client } from '@devrev/typescript-sdk';
import {
  Error as OperationError,
  Error_Type,
  ExecuteOperationInput,
  FunctionInput,
  OperationBase,
  OperationContext,
  OperationOutput,
  OutputValue,
} from '@devrev/typescript-sdk/dist/snap-ins';
import axios from 'axios';

export async function postCallAPI(endpoint: string, payload: any, authKey: string) {
  try {
    const res = await axios.post(endpoint, payload, {
      headers: {
        Authorization: authKey,
        'Content-type': 'application/json',
      },
    });
    const data = res.data;
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

interface RunSQLInput {
  sql_query: string;
}

export class RunSQL extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const input_data = input.data as RunSQLInput;
    const endpoint = context.devrev_endpoint;
    const token = context.secrets.access_token;
    const query = input_data.sql_query;

    let err: OperationError | undefined = undefined;
    if (!query) {
      err = {
        message: 'query not found',
        type: Error_Type.InvalidRequest,
      };
    }

    try {
      let datasetsInformation = {} as Record<string, any>;

      const oasisResp = await postCallAPI(
        `${endpoint}/internal/oasis.data.query`,
        { sql_query: input_data.sql_query },
        token
      );
      const res = atob(oasisResp.data.data);

      return OperationOutput.fromJSON({
        summary: `Executed SQL: ${input_data.sql_query}`,
        output: {
          values: [{ data: res }],
        } as OutputValue,
      });
    } catch (err) {
      return OperationOutput.fromJSON({ error: err });
    }
  }
}
