import { client } from '@devrev/typescript-sdk';
import { LinksCreateRequest, LinkType, LinksCreateResponse, UserSummary, UserType, RevUserSummary, WorksUpdateRequestReportedBy } from '@devrev/typescript-sdk/dist/auto-generated/beta/beta-devrev-sdk';
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
import axios from 'axios';

export async function postCallAPI(endpoint: string, payload: any, authKey: string) {
  try {
    const res = await axios.post(endpoint, payload, {
      headers: {
        Authorization: authKey,
        'Content-type': 'application/json',
      },
    });
    const data = res.data;
    return { success: true, errMessage: 'Data successfully fetched', data: data };
  } catch (error: any) {
    if (error.response) {
      return { success: false, errMessage: error.response.data };
    } else if (error.request) {
      return { success: false, errMessage: error.request.data };
    } else {
      return { success: false, errMessage: error };
    }
  }
}

interface LinkTicketToConversationInput {
  ticket_id: string;
  agent_session_id: string;
}

export class LinkTicketToConversation extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const input_data = input.data as LinkTicketToConversationInput;
    const endpoint = context.devrev_endpoint;
    const token = context.secrets.access_token;

    const devrevSDK = client.setupBeta({ endpoint, token });
    const ticket_id = input_data.ticket_id;
    const agent_session_id = input_data.agent_session_id;

    let err: OperationError | undefined = undefined;
    if (!ticket_id) {
      err = {
        message: 'ticket_id not found',
        type: Error_Type.InvalidRequest,
      };
    }
    if (!agent_session_id) {
      err = {
        message: 'agent_session_id not found',
        type: Error_Type.InvalidRequest,
      };
    }


    try {
      const aiAgentSessionGetResp = await postCallAPI(
        `${endpoint}/internal/ai-agents.sessions.get`,
        { id: `${agent_session_id}`},
        token
      );
      const session_object = aiAgentSessionGetResp.data.session.session_object;
      if (typeof session_object !== 'string') {
        return OperationOutput.fromJSON({
          summary: `Could not link ticket to conversation: ${ticket_id}`,
          output: {
            values: [{ 
              ticket_id: ticket_id,
              session_object: JSON.stringify(session_object),
              message: 'Session object is not a string, ticket created but could not link to conversation',
            }],
          } as OutputValue,
        });
      }
      if (!session_object.includes("conversation")) {
        return OperationOutput.fromJSON({
          summary: `Could not link ticket to conversation: ${ticket_id}`,
          output: {
            values: [{ 
              ticket_id: ticket_id,
              session_object: JSON.stringify(session_object),
              message: 'Session object is not a conversation, ticket created but could not link to conversation',
            }],
          } as OutputValue,
        });
      }

      const conversationResp = await postCallAPI(
        `${endpoint}/internal/conversations.get`,
        { id: `${session_object}`},
        token
      );
      if (!conversationResp.success) {
        return OperationOutput.fromJSON({
          summary: `Could not link ticket to conversation: ${ticket_id}`,
          output: {
            values: [{ 
              ticket_id: ticket_id,
              session_object: JSON.stringify(session_object),
              message: 'Ticket created but could not link to conversation',
            }],
          } as OutputValue,
        });
      }
      console.log(conversationResp.data);
      const members = conversationResp.data.conversation.members;
      console.log(members);
      let reported_by: string | undefined;
      for (const member of members) {
        if (member.id.includes("revu")) {
          reported_by = member.id;
          break;
        }
      }
      let rev_org: string | undefined;
      if (conversationResp.data.conversation.rev_orgs.length > 0) {
        rev_org = conversationResp.data.conversation.rev_orgs[0].id;
      }

      const linksCreateReq: LinksCreateRequest = {
        link_type: LinkType.IsRelatedTo,
        source: session_object,
        target: ticket_id,
      };

      const createLinkResp = await devrevSDK.linksCreate(linksCreateReq);
      if (!(createLinkResp.status >= 200 && createLinkResp.status < 300)) {
        return OperationOutput.fromJSON({
          summary: `Could not link ticket to conversation: ${ticket_id}`,
          output: {
            values: [{ 
              ticket_id: ticket_id,
              session_object: JSON.stringify(session_object),
              message: 'Ticket created but could not link to conversation',
            }],
          } as OutputValue,
        });
      }

      if (rev_org && reported_by) {
        const updateTicketResp = await devrevSDK.worksUpdate({
          id: ticket_id,
          rev_org,
          reported_by: {
            set: [reported_by],
          }
        });
        if (!(updateTicketResp.status >= 200 && updateTicketResp.status < 300)) {
          return OperationOutput.fromJSON({
            summary: `Could not link ticket to conversation: ${ticket_id}`,
            output: {
              values: [{ 
                ticket_id: ticket_id,
                session_object: JSON.stringify(session_object),
                message: 'Ticket created and linked to conversation but could not update ticket with customer details',
              }],
            } as OutputValue,
          });
        }
      }

      return OperationOutput.fromJSON({
        summary: `Linked ticket to conversation: ${ticket_id}`,
        output: {
          values: [{ 
            ticket_id: ticket_id,
            session_object: JSON.stringify(session_object),
            message: 'Ticket created and linked to conversation, and updated ticket with customer details',
          }],
        } as OutputValue,
      });
    } catch (err) {
      return OperationOutput.fromJSON({
        summary: `Could not link ticket to conversation: ${ticket_id}`,
        output: {
          values: [{ 
            ticket_id: ticket_id,
            session_object: "Not found",
            message: 'Ticket created but could not be linked to conversation',
          }],
        } as OutputValue,
      });
    }
  }
}
