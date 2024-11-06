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
      let datasetIds = [] as string[];

      const coreSearchResp = await postCallAPI(
        `${endpoint}/internal/search.core`,
        { query: `is_system:true ${input_data.query}`, limit: 5, namespaces: ['dataset'] },
        token
      );
      for (const searchResp of coreSearchResp.data.results) {
        if (searchResp.type === 'dataset') {
          const datasetSummary = searchResp as any;
          const datasetId = datasetSummary.dataset.id;
          datasetIds.push(datasetId);
        }
      }

      const batchResp = await postCallAPI(`${endpoint}/internal/batch.apply`, { items: datasetIds.map((id) => ({ batch_type: 'oasis_dataset_get', id: id })) }, token);
      const datasets = batchResp.data.items
        .map((item: any) => item.dataset)
        .filter((dataset: any) => dataset) // This filters out any falsy dataset values (e.g., null or undefined).
        .map((dataset: any) => ({
          id: dataset.dataset_id,
          title: dataset.title,
          description: dataset.description, // Keeps the description field, even if it's null or undefined.
          columns: dataset.columns.filter((column: any) => column.description !== undefined), // Only filters out columns without a description.
        }));

      const filteredDatasets = datasets.filter((dataset: any) => dataset.columns.length > 0);
      const datasetsInformation = Object.fromEntries(filteredDatasets.map((dataset: any) => [dataset.id, dataset]));
      const datasetInfoString = JSON.stringify(datasetsInformation).replace(/"/g, '');

      return OperationOutput.fromJSON({
        summary: `Found datasets: ${input_data.query}`,
        output: {
          values: [{ datasets: datasetInfoString }],
        } as OutputValue,
      });
    } catch (err) {
      return OperationOutput.fromJSON({ error: err });
    }
  }
}
