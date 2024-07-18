import { OperationBase, OperationContext, FunctionInput, ExecuteOperationInput, OperationOutput, OutputValue, Error as OperationError, Error_Type } from '@devrev/typescript-sdk/dist/snap-ins';
import { WebClient } from '@slack/web-api';

interface SearchSlackInput {
  query: string;
  channel_ids: string[];
}

export class SearchSlack extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  private serializeSlackResults(response: any): any[] {
    const results = [];
    if (response.messages?.matches) {
      for (const match of response.messages.matches) {
        results.push(this.extractMessageData(match));
      }
    }
    if (response.files?.matches) {
      for (const match of response.files.matches) {
        results.push(this.extractFilesData(match));
      }
    }
    return results;
  }

  private extractMessageData(messageJson: any): any {
    const document: any = { type: "message" };
    if (messageJson.text) {
      document.text = messageJson.text;
    }
    if (messageJson.permalink) {
      document.url = messageJson.permalink;
    }
    if (messageJson.channel && messageJson.channel.name) {
      document.title = messageJson.channel.name;
    }
    return document;
  }

  private extractFilesData(fileJson: any): any {
    const document: any = { type: "file" };
    if (fileJson.permalink) {
      document.url = fileJson.permalink;
    }
    if (fileJson.title) {
      document.title = fileJson.title;
      document.text = fileJson.title;
    }
    return document;
  }

  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const inputData = input.data as SearchSlackInput;
    const query = inputData.query;

    let err: OperationError | undefined = undefined;
    if (!query) {
      err = {
        message: 'Query string is empty',
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [],
        } as OutputValue,
      });
    }
    
    const slackToken = resources.keyrings.slack_token.secret;
    // Change the token here.
    let slackClient;
    try {
      slackClient = new WebClient(slackToken);
    } catch (e: any) {
      err = {
        message: 'Error while creating slack client for search:' + e.message,
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [],
        } as OutputValue,
      });
    }


    var channel_names = [];
    for (const channel_id in inputData.channel_ids) {
      try {
        const channelInfo = await slackClient.conversations.info({ channel: channel_id });
        channel_names.push(channelInfo.channel?.name);
      } catch (e: any) {
        err = {
          message: 'Error while fetching channel info:' + e.message,
          type: Error_Type.InvalidRequest,
        };
        console.log(err);
      }
    }

    try {
      // Make in:channel_1 in_channel_2 in_channel_3 query
      const channelString = channel_names.map((name) => `in:${name}`).join(' '); // Apply channel filter
      const result = await slackClient.search.messages({ query: channelString + ' ' + query });
      const serializedResults = this.serializeSlackResults(result);
      // Assuming serializedResults is an array of objects as described
      var formattedMessages = [];

      for (const result of serializedResults) {
        // Template literal to format the string as required
        const formattedMessage = `Message: ${result.text}  URL: ${result.url}`;
        formattedMessages.push(formattedMessage);
      }
      console.log(formattedMessages)
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [{ results: JSON.stringify(formattedMessages)}],
        } as OutputValue,
      });
    } catch (e: any) {
      err = {
        message: 'Error while searching:' + e.message,
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