import { client } from '@devrev/typescript-sdk';
import {
  WorksListRequest,
} from '@devrev/typescript-sdk/dist/auto-generated/beta/beta-devrev-sdk';
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

interface GetLinkedWorksFromPartInput {
  part_id: string;
}

interface GetLinkedWorksFromPartOutput {
  linked_works_dump: string;
}

export class GetLinkedWorksFromPart extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput): Promise<OperationOutput> {
    const input_data = input.data as GetLinkedWorksFromPartInput;
    const part_id = input_data.part_id;

    if (!part_id) {
      const err: OperationError = {
        message: 'part ID is missing in the request input',
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({ error: err });
    }

    const endpoint = context.devrev_endpoint;
    const token = context.secrets.access_token;

    const devrevBetaClient = client.setupBeta({
      endpoint: endpoint,
      token: token,
    });

    const MAX_RETRIES = 3; // Maximum number of retries
    const RETRY_DELAY = 2000; // Delay between retries in milliseconds

    // Recursive function to fetch ListWorks Pages
    const fetchListWorks = async (partId: string): Promise<string> => {
      let output = '';
      let cursor: string | null = null;

      do {
        const req: WorksListRequest = {
          cursor: cursor || undefined,
          applies_to_part: [partId],
        };

        const res = await devrevBetaClient.worksListPost(req);

        const works = res.data.works;
        cursor = res.data.next_cursor ?? null;

        output += JSON.stringify(works, null, 2) + '\n';
      } while (cursor);

      return output;
    };

    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      try {
        const output = await fetchListWorks(part_id);

        const MAX_CHAR_LIMIT = 50000;
        const lines = output.trim().split('\n');
        let truncatedOutput = '';
        let currentLength = 0;

        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i];
          const lineLength = line.length + 1;

          if (currentLength + lineLength <= MAX_CHAR_LIMIT) {
            truncatedOutput = line + '\n' + truncatedOutput;
            currentLength += lineLength;
          } else {
            break;
          }
        }

        const outputValue: GetLinkedWorksFromPartOutput = {
          linked_works_dump: output.trim(),
        };

        return OperationOutput.fromJSON({
          output: {
            values: [outputValue],
          } as OutputValue,
          summary: 'work items fetched successfully',
        });
      } catch (error: any) {
        attempt++;

        if (error.response) {
          if (error.response.status >= 500) {
            console.error(`retrying due to server error: ${error.response.status}`);
          } else if (error.response.status >= 400 && error.response.status < 500) {
            const err: OperationError = {
              message: `client error: ${error.response.status} - ${error.response.statusText}`,
              type: Error_Type.InvalidRequest,
            };
            return OperationOutput.fromJSON({ error: err });
          }
        } else if (error.request) {
          console.warn('no response received from the server, retrying...');
        } else {
          const err: OperationError = {
            message: `unexpected error: ${error.message}`,
            type: Error_Type.Unknown,
          };
          return OperationOutput.fromJSON({ error: err });
        }

        if (attempt >= MAX_RETRIES) {
          const err: OperationError = {
            message: 'operation failed after maximum retry attempts.',
            type: Error_Type.Unknown,
          };
          return OperationOutput.fromJSON({ error: err });
        }

        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }

    // Fallback return in case of unexpected behavior
    const err: OperationError = {
      message: 'an unexpected error occurred, and no valid result was produced.',
      type: Error_Type.Unknown,
    };
    return OperationOutput.fromJSON({ error: err });
  }
}