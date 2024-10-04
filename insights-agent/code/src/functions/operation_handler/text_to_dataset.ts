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

interface TextToDatasetInput {
  query: string;
}

export class TextToDataset extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const input_data = input.data as TextToDatasetInput;
    const endpoint = context.devrev_endpoint;
    const token = context.secrets.access_token;

    const devrevSDK = client.setupBeta({ endpoint, token });
    const query = input_data.query;

    let err: OperationError | undefined = undefined;
    if (!query) {
      err = {
        message: 'query not found',
        type: Error_Type.InvalidRequest,
      };
    }

    try {
      const coreSearchResp = await postCallAPI(
        `${endpoint}/internal/search.core`,
        { query: `is_system:true ${input_data.query}`, limit: 10, namespaces: ['dataset'] },
        token
      );
      const datasetGetPromises = coreSearchResp.data.results
        .filter((searchResp: any) => searchResp.type === 'dataset')
        .map(async (searchResp: any) => {
          const datasetSummary = searchResp;
          const datasetId = datasetSummary.dataset.id;
          const datasetGetResp = await postCallAPI(`${endpoint}/internal/oasis.dataset.get`, { id: datasetId }, token);
          const datasetInfo = {
            name: datasetGetResp.data.dataset.dataset_id,
            description: datasetGetResp.data.dataset.description,
            columns: datasetGetResp.data.dataset.columns.filter((column: any) => column.description),
          };
          return { name: datasetInfo.name, info: JSON.stringify(datasetInfo) };
        });

      const datasetInfos = await Promise.all(datasetGetPromises);
      const datasetsInformation = Object.fromEntries(datasetInfos.map(({ name, info }) => [name, info]));

      return OperationOutput.fromJSON({
        summary: `Found datasets: ${input_data.query}`,
        output: {
          values: [{ datasets: JSON.stringify(datasetsInformation) }],
        } as OutputValue,
      });
    } catch (err) {
      return OperationOutput.fromJSON({ error: err });
    }
  }
}
