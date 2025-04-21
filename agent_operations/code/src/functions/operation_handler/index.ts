import { SuggestSearch } from '../../operations/suggest_search';
import { GetObject } from '../../operations/get_object';
import { APICall } from '../../operations/api_call';
import { GetArticleExtractedContent } from '../../operations/get_article_extracted_content';
import { CreateArticle } from '../../operations/create_article';
import { OperationFactory } from '../../operations';
import { ExecuteOperationInput,FunctionInput, OperationMap } from '@devrev/typescript-sdk/dist/snap-ins';
import { CreateDMWithMessage } from '../../operations/create_dm_with_message';
/**
 * Map of operations with the slug mentioned in the manifest.
 * The key is the slug of the operation mentioned in the manifest and value is the operation class.
 * Add your operations here.
 */
const operationMap: OperationMap = {
  agent_search: SuggestSearch,
  get_object: GetObject,
  api_call: APICall,
  get_article_extracted_content: GetArticleExtractedContent,
  create_article: CreateArticle,
  create_dm_with_message: CreateDMWithMessage,
};

export const run = async (events: FunctionInput[]) => {
  const event = events[0];
  const payload = event.payload as ExecuteOperationInput

  const operationSlug = payload.metadata!.slug;
  const operationNamespace = payload.metadata!.namespace;
  console.log('running operation: ', operationSlug, ' in namespace: ', operationNamespace);
  const operationFactory = new OperationFactory(operationMap);
  const operation = operationFactory.getOperation(operationSlug, event);
  const ctx = operation.GetContext();
  return await operation.run(ctx, payload, {});
};

export default run;
