import { OperationFactory } from '../../operations';
import { ExecuteOperationInput,FunctionInput, OperationMap } from '@devrev/typescript-sdk/dist/snap-ins';

// Operations
import { GetTemperature } from './get_temperature';
import { PostCommentOnTicket } from './post_comment_on_ticket';
import { SendSlackMessage } from './send_slack_message';
import { ExtractContent } from './extract_content';
import { GetSchemaInfo } from './get_schema_info';

/**
 * Map of operations with the slug mentioned in the manifest.
 * The key is the slug of the operation mentioned in the manifest and value is the operation class.
 */
const operationMap: OperationMap = {
  get_temperature: GetTemperature,
  post_comment_on_ticket: PostCommentOnTicket,
  send_slack_message: SendSlackMessage,
  extract_content: ExtractContent,
  get_schema_info: GetSchemaInfo,
};

export const run = async (events: FunctionInput[]) => {
  const event = events[0];
  const payload = event.payload as ExecuteOperationInput
  const operationSlug = payload.metadata!.slug;
  const operationNamespace = payload.metadata!.namespace;
  console.log('running operation: ', operationSlug, ' in namespace: ', operationNamespace);
  const operationFactory = new OperationFactory(operationMap);
  const operation = operationFactory.getOperation(operationSlug, event);
  const ctx = operation.GetContext(event);
  const resources = event.input_data.resources||{};
  return await operation.run(ctx, payload, resources);
};

export default run;
