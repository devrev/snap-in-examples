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

interface PostCommentOnTicketInput {
  id: string;
  comment: string;
}

export class PostCommentOnTicket extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput, _resources: any): Promise<OperationOutput> {
    const input_data = input.data as PostCommentOnTicketInput;
    const ticket_id = input_data.id;
    const comment = input_data.comment;

    let err: OperationError | undefined = undefined;
    if (!ticket_id) {
      err = {
        message: 'Ticket ID not found',
        type: Error_Type.InvalidRequest,
      };
    }

    const endpoint = context.devrev_endpoint;
    const token = context.secrets.access_token;

    const devrevBetaClient = client.setupBeta({
      endpoint: endpoint,
      token: token,
    });
    let ticket;
    try {
      const ticketResponse = await devrevBetaClient.worksGet({
        id: ticket_id,
      });
      console.log(JSON.stringify(ticketResponse.data));
      ticket = ticketResponse.data.work;
    } catch (e: any) {
      err = {
        message: 'Error while fetching ticket details:' + e.message,
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
      });
    }

    try {
      const timelineCommentResponse = await devrevBetaClient.timelineEntriesCreate({
        body: comment,
        type: TimelineEntriesCreateRequestType.TimelineComment,
        object: ticket.id,
      });
      console.log(JSON.stringify(timelineCommentResponse.data));
      let commentID = timelineCommentResponse.data.timeline_entry.id;
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [{ comment_id: commentID }],
        } as OutputValue,
      });
    } catch (e: any) {
      err = {
        message: 'Error while posting comment:' + e.message,
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
      });
    }
  }
}
