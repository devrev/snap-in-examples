import { client } from '@devrev/typescript-sdk';
import {
  ExecuteOperationInput,
  FunctionInput,
  OperationBase,
  OperationContext,
  OperationOutput,
  OutputValue,
} from '@devrev/typescript-sdk/dist/snap-ins';
import { postCallAPI } from './text_to_dataset';

export class AgentCallback extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(metadata: OperationContext, input: ExecuteOperationInput, _: any): Promise<OperationOutput> {
    const data = input.data as Record<string, any>;
    const endpoint = metadata.devrev_endpoint;
    const token = metadata.secrets.access_token;

    const agent_session_id = data['agent_session_id'];
    const skill_call_id = data['skill_call_id'];
    const skill_name = data['skill_name'];
    const outputJSON = data['output'];
    const error = data['error'] || "";
    const output = JSON.parse(outputJSON);

    const req = {
      agent_session: agent_session_id,
      skill_call_output: {
        id: skill_call_id,
        name: skill_name,
        output: output,
        error: error,
      },
    } as Record<string, any>;

    try {
      const resp = await postCallAPI(`${endpoint}/internal/ai-agents.callback`, req, token);
      return OperationOutput.fromJSON({
        error: undefined,
        summary: `Executed Data: ${data}`,
        output: {
          values: [
            {
              agent_session_id: agent_session_id,
              skill_call_id: skill_call_id,
              skill_name: skill_name,
              output: output,
              callback_request_success: true,
            },
          ],
        } as OutputValue,
      });
    } catch (err) {
      return OperationOutput.fromJSON({ error: err });
    }
  }
}
