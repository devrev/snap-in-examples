import { client } from '@devrev/typescript-sdk';
import { TimelineEntriesCreateRequestType } from '@devrev/typescript-sdk/dist/auto-generated/beta/beta-devrev-sdk';
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

import { WebClient } from '@slack/web-api';

interface SendSlackMessageInput {
  channel: string;
  message: string;
}

export class SendSlackMessage extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }
  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const input_data = input.data as SendSlackMessageInput;
    const channel_id = input_data.channel;
    const comment = input_data.message;

    let err: OperationError | undefined = undefined;
    if (!channel_id) {
      err = {
        message: 'Channel ID not found',
        type: Error_Type.InvalidRequest,
      };
    }

    console.log("context:", context);
   
    const slack_token =  resources.keyrings.slack_token.secret;
    let slackClient;
    try {
      console.log('Creating slack client');
      slackClient = new WebClient(slack_token);
      console.log('Slack client created');
    } catch (e: any) {
      console.log('Error while creating slack client:', e.message);
      err = {
        message: 'Error while creating slack client:' + e.message,
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [],
        } as OutputValue,
      });
    }
    console.log('Sending message to slack channel:', channel_id);
    try {
      const result = await slackClient.chat.postMessage({
        channel: channel_id,
        text: comment,
      });
      console.log('Message sent: ', result.ts);
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [{ message_id: result.ts }],
        } as OutputValue,
      });
    } catch (e: any) {
      console.log('Error while sending message:', e.message);
      err = {
        message: 'Error while sending message:' + e.message,
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [],
        } as OutputValue,
      });
    }
  }
}
