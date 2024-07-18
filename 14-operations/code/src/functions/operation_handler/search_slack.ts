import { OperationBase, OperationContext, FunctionInput, ExecuteOperationInput, OperationOutput, OutputValue, Error as OperationError, Error_Type } from '@devrev/typescript-sdk/dist/snap-ins';
import { WebClient } from '@slack/web-api';

interface SearchSlackInput {
  query: string;
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

    try {
      const result = await slackClient.search.all({ query: query });
      const serializedResults = this.serializeSlackResults(result);
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [{ results: serializedResults }],
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