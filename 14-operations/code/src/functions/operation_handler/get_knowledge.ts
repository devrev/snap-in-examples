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
import { postCallAPI } from './text_to_dataset';

interface GetKnowledgeInput {
  query: string;
}

export class GetKnowledge extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const input_data = input.data as GetKnowledgeInput;
    const endpoint = context.devrev_endpoint;
    const token = context.secrets.access_token;

    const query = input_data.query;

    let err: OperationError | undefined = undefined;
    if (!query) {
      err = {
        message: 'query not found',
        type: Error_Type.InvalidRequest,
      };
    }

    try {
      const replyResp = await postCallAPI(
        `${endpoint}/internal/recommendations.get-reply`,
        { query: input_data.query, surface: 'plug' },
        token
      );

      return OperationOutput.fromJSON({
        summary: `Found knowledge: ${replyResp.data.reply}`,
        output: {
          values: [{ knowledge: JSON.stringify(replyResp.data.reply)}],
        } as OutputValue,
      });
    } catch (err) {
      return OperationOutput.fromJSON({ error: err });
    }
  }
}
