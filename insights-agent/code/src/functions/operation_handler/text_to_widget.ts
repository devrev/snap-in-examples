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

interface TextToWidgetInput {
  query: string;
}

export class TextToWidget extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const input_data = input.data as TextToWidgetInput;
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
      let widgetIds = [] as string[];

      const coreSearchResp = await postCallAPI(
        `${endpoint}/internal/search.core`,
        { query: `is_system:true ${input_data.query}`, limit: 3, namespaces: ['widget'] },
        token
      );
      for (const searchResp of coreSearchResp.data.results) {
        if (searchResp.type === 'widget') {
          const widgetSummary = searchResp as any;
          const widgetId = widgetSummary.widget.id;
          widgetIds.push(widgetId);
        }
      }

      const batchResp = await postCallAPI(`${endpoint}/internal/batch.apply`, { items: widgetIds.map((id) => ({ batch_type: 'widgets_get', id: id })) }, token);
      const widgets = batchResp.data.items.map((item: any) => item.widget).map((widget: any) => ({ id: widget.id, title: widget.title, description: widget.description, data_sources: widget.data_sources, sub_widgets: widget.sub_widgets }));

      return OperationOutput.fromJSON({
        summary: `Found widget ids: ${input_data.query}`,
        output: {
          values: [{ widgets: JSON.stringify(widgets) }],
        } as OutputValue,
      });
    } catch (err) {
      return OperationOutput.fromJSON({ error: err });
    }
  }
}
