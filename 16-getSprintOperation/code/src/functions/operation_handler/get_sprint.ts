import { client } from '@devrev/typescript-sdk';
import { VistaGroupItemState, VistaGroupItemGroupObjectType, WorkType } from '@devrev/typescript-sdk/dist/auto-generated/internal/private-internal-devrev-sdk';
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

interface GetSprintInput {
  id: string;
  status: string;
}

export class GetSprint extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput, _resources: any): Promise<OperationOutput> {
    const input_data = input.data as GetSprintInput;
    const issue_id = input_data.id;
    const status = input_data.status;

    let err: OperationError | undefined = undefined;
    if (!issue_id) {
      err = {
        message: 'Issue ID not found',
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
      });
    }
    if (!status) {
      err = {
        message: 'Status not found',
        type: Error_Type.InvalidRequest,
      };
    }

    const endpoint = context.devrev_endpoint;
    const token = context.secrets.access_token;

    const devrevInternalClient = client.setupInternal({
      endpoint: endpoint,
      token: token,
    });

    let issue;
    try {
      const issueResponse = await devrevInternalClient.worksGet({
        id: issue_id,
      });
      issue = issueResponse.data.work;
    }
    catch (e: any) {
      err = {
        message: 'Error while fetching issue details:' + e.message,
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
      });
    }

    // use the internal api vistas.groups.list to get the sprint id related to the part of the issue
    try {
      if (!issue.applies_to_part?.id) {
        return OperationOutput.fromJSON({
          error: {
            message: 'Issue does not have an associated part',
            type: Error_Type.InvalidRequest,
          },
        });
      }

      let sprintResponse;
      try {
        if(status === 'Active') {
            sprintResponse = await devrevInternalClient.vistasGroupsList({
            ancestor_part: [issue.applies_to_part.id],
            group_object_type: [VistaGroupItemGroupObjectType.Work],
            state: [VistaGroupItemState.Active],
        });
      } 
      else if(status === 'Planned') {
        sprintResponse = await devrevInternalClient.vistasGroupsList({
          ancestor_part: [issue.applies_to_part.id],
          group_object_type: [VistaGroupItemGroupObjectType.Work],
          state: [VistaGroupItemState.Planned],
        });
      }
      else {
        return OperationOutput.fromJSON({
          error: {
            message: 'Invalid status',
            type: Error_Type.InvalidRequest,
          },
        });
      }
    }
      catch (e: any) {
        return OperationOutput.fromJSON({
          error: {
            message: 'Error while getting sprint information:' + e.message,
            type: Error_Type.InvalidRequest,
          },
        });
      }
      // now we need to assign the sprint id to the issue
      try {
        if(sprintResponse.data?.vista_group?.[0]?.id) {
          const issueResponse = await devrevInternalClient.worksUpdate({
            id: issue_id,
            type: WorkType.Issue,
            sprint: sprintResponse.data?.vista_group?.[0]?.id || '',
          });
        }
      }
      catch (e: any) {      
        return OperationOutput.fromJSON({
          error: {
            message: 'Error while updating issue:' + e.message,
            type: Error_Type.InvalidRequest,
          },
        });
      }

      return OperationOutput.fromJSON({
        output: {
          values: [{ 
            sprint_id: sprintResponse.data?.vista_group?.[0]?.id || '',
            sprint_name: sprintResponse.data?.vista_group?.[0]?.name || 'No Sprint'
          }],
        } as OutputValue,
      });
    }
    catch (e: any) {
      return OperationOutput.fromJSON({
        error: {
          message: 'Error somewhere in the operation which is not captured in catch block:' + e.message,
          type: Error_Type.InvalidRequest,
        },
      });
    }
  }
}