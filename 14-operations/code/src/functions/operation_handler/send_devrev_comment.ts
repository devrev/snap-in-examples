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

interface SendDevRevCommentInput {
    query: string;
    external_sync_unit_objects: string[];
}

interface ExternalSyncUnitObject {
    external_sync_unit_id: string;
    object_types: string[];
}

export class SendDevRevComment extends OperationBase {
    constructor(e: FunctionInput) {
        super(e);
    }
    async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
        const input_data = input.data as SendDevRevCommentInput;
        const query = input_data.query;
        const external = input_data.external_sync_unit_objects;

        const sync_unit_info = external.map((obj: string) => {
            try {
                const obj_data = JSON.parse(obj);
                return {
                    external_sync_unit_id: obj_data.external_sync_unit_id,
                    object_types: obj_data.object_types,
                };
            } catch (e: any) {
                console.log('Error while parsing external sync unit object:', e.message);
                return {
                    external_sync_unit_id: '',
                    object_types: [],
                };
            }
        }).filter((obj: ExternalSyncUnitObject) => obj.external_sync_unit_id !== '');

        let err: OperationError | undefined = undefined;
        if (!query) {
            err = {
                message: 'Channel ID not found',
                type: Error_Type.InvalidRequest,
            };
        }

        const endpoint = context.devrev_endpoint;
        const token = context.secrets.access_token;
        const ISSUE_ID = "don:core:dvrv-us-1:devo/1k12mI6kaa:issue/1";

        const devrevBetaClient = client.setupBeta({
            endpoint: endpoint,
            token: token,
        });

        let issue;
        try {
            const issueResponse = await devrevBetaClient.worksGet({
                id: ISSUE_ID,
            });

            console.log(JSON.stringify(issueResponse.data));
            issue = issueResponse.data.work;
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
            const comment_data = {
                body: query,
                external_sync_unit_objects: sync_unit_info,
            };

            const comment = JSON.stringify(comment_data);

            const timelineCommentResponse = await devrevBetaClient.timelineEntriesCreate({
                body: comment,
                type: TimelineEntriesCreateRequestType.TimelineComment,
                object: issue.id,
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
