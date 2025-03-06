import { OperationFactory } from '../../operations';
import { ExecuteOperationInput,FunctionInput, OperationMap } from '@devrev/typescript-sdk/dist/snap-ins';

// Operations
import { GetLinkedWorksFromPart } from './get_linked_works_from_part';

/**
 * Map of operations with the slug mentioned in the manifest.
 * The key is the slug of the operation mentioned in the manifest and value is the operation class.
 */
const operationMap: OperationMap = {
  get_linked_works_from_part: GetLinkedWorksFromPart,
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
