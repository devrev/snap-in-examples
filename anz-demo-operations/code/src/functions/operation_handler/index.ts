import { OperationFactory } from '../../operations';
import { ExecuteOperationInput,FunctionInput, OperationMap } from '@devrev/typescript-sdk/dist/snap-ins';

// Operations
import { GetTemperature } from './get_temperature';
import { GetBankFeed } from './get_bank_feed';
import { GetBankFeedTransactions } from './get_bank_feed_transactions';
import { ListBankFeeds } from './list_bank_feeds';
import { RefreshBankFeed } from './refresh_bank_feed';
import { ListBankDisruptions } from './list_bank_disruptions';
import { GetCurrentTime } from './get_current_time';
import { LinkTicketToConversation } from './link_ticket_to_conversation';
import { link } from 'fs';

/**
 * Map of operations with the slug mentioned in the manifest.
 * The key is the slug of the operation mentioned in the manifest and value is the operation class.
 */
const operationMap: OperationMap = {
  get_temperature: GetTemperature,
  get_bank_feed: GetBankFeed,
  get_bank_feed_transactions: GetBankFeedTransactions,
  list_bank_feeds: ListBankFeeds,
  refresh_bank_feed: RefreshBankFeed,
  list_bank_disruptions: ListBankDisruptions,
  get_current_time: GetCurrentTime,
  link_ticket_to_conversation: LinkTicketToConversation,
};

export const run = async (events: FunctionInput[]) => {
  const event = events[0];
  const payload = event.payload as ExecuteOperationInput
  console.log("Event: ", event);
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
