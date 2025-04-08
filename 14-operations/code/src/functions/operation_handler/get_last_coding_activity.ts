import {
  OperationContext,
  ExecuteOperationInput,
  OperationOutput,
  OutputValue,
  FunctionInput,
  OperationBase,
} from '@devrev/typescript-sdk/dist/snap-ins';
import {
  Api,
  LinksListRequest,
  TimelineEntriesListRequest,
  LinkEndpointType,
  ListMode,
  TimelineChangeEvent,
  TimelineEntryType,
  WorkType,
} from '@devrev/typescript-sdk-internal/dist/auto-generated/internal/private-internal-devrev-sdk';
import { internalSDK } from '@devrev/typescript-sdk-internal';

export interface GetInput {
  object_id: string;
}

export class GetLastCodingActivity extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(
    context: OperationContext,
    input: ExecuteOperationInput,
    _resources: any,
  ): Promise<OperationOutput> {
    const inputData = input.data as GetInput;

    // Validate input
    if (!inputData.object_id || inputData.object_id === '') {
      return OperationOutput.fromJSON({
        error: {
          message: 'No ID provided',
          type: 'InvalidRequest',
        },
      });
    }

    // Initialize the private DevRev SDK
    const devrevSDK = new internalSDK.Api({
      headers: {
        Authorization: context.secrets.access_token,
      },
      baseURL: context.devrev_endpoint,
    }) as Api<unknown>;
    
    // Check if the object ID is that of an enhancement
    let issueIDs: string[] = [];
    if (inputData.object_id.toLowerCase().includes('enh')) {
      const issueRequest = {
        type: [WorkType.Issue],
        applies_to_part: [inputData.object_id],
        cursor: '',
      };
      while (true) {
        const issueResponse = await devrevSDK.worksList(issueRequest);
        if (issueResponse.data?.works) {
          for (const work of issueResponse.data.works) {
            issueIDs.push(work.id);
          }
        }
        if (!issueResponse.data?.next_cursor) {
          break;
        }
        issueRequest.cursor = issueResponse.data.next_cursor;
      }
    } else {
      issueIDs.push(inputData.object_id);
    }

    let latestEpochTime = 0;
    let codeChangeLinks: internalSDK.Link[] = [];

    for (const issueID of issueIDs) {
      try {
        // Step 1: Fetch linked code_change objects using links.list
        const linksListRequest: LinksListRequest = {
          object: issueID,
          object_types: [LinkEndpointType.CodeChange], // Filter for code_change objects
        };

        while (true) {
          const linksResponse = await devrevSDK.linksList(linksListRequest);
          const entries = linksResponse.data?.links || [];
          codeChangeLinks = [...codeChangeLinks, ...entries];
          const next_cursor = linksResponse.data?.next_cursor;
          if (next_cursor) {
            linksListRequest.cursor = next_cursor;
          } else {
            break;
          }
        }
        
        
        //For each code_change object, traverse the timeline to get the latest coding activity
        for (const link of codeChangeLinks) {
          try {
            const timelineRequest: TimelineEntriesListRequest = {
              object: link.target.id,
              mode: ListMode.Before,
            };

            while (true) {
              const timelineResponse =
                await devrevSDK.timelineEntriesList(timelineRequest);
              for (const entry of timelineResponse.data?.timeline_entries ||
                []) {
                if (entry.type == TimelineEntryType.TimelineChangeEvent) {
                  const timelineChangeEvent = entry as TimelineChangeEvent;
                  // Add null checks for nested properties
                  const eventMetadata = timelineChangeEvent.event?.annotated?.microflow_action?.event_metadata;
                  
                  // Safely access the source_time_stamp
                  let sourceTimeStamp: string | undefined;
                  if (eventMetadata?.keys) {
                    try {
                      // Use a safer approach to access the property
                      const keysObj = eventMetadata.keys as unknown as Record<string, string>;
                      sourceTimeStamp = keysObj['source_time_stamp'];
                    } catch (error) {
                      console.error('Error accessing source_time_stamp:', error);
                    }
                  }
                  
                  if (sourceTimeStamp) {
                    const epochTime = new Date(sourceTimeStamp).getTime();
                    if (epochTime && epochTime > latestEpochTime) {
                      latestEpochTime = epochTime;
                    }
                  }
                }
              }

              const next_cursor = timelineResponse.data?.next_cursor;
              if (next_cursor) {
                timelineRequest.cursor = next_cursor;
              } else {
                break;
              }
            }
          } catch (error) {
            return OperationOutput.fromJSON({
              error: {
                message: `No valid timeline entries with source_time_stamp found for linked code changes of object ${inputData.object_id}`,
                type: 'InvalidRequest',
              },
            });
          }
        }
      } catch (error) {
        return OperationOutput.fromJSON({
          error: {
            message: 'No object ID provided',
            type: 'InvalidRequest', // Ensure this is a string
          },
        });
      }
    }

    if (codeChangeLinks.length === 0) { 
      return OperationOutput.fromJSON({
        summary: `No code_change objects linked to ${inputData.object_id}`,
        output: {
          values: [{}],
        } as OutputValue,
      });
    }

    if (latestEpochTime === 0) {
      return OperationOutput.fromJSON({
        summary: `No coding activity yet, linked to this object ${inputData.object_id}`,
        output: {
          values: [{}],
        } as OutputValue,
      });
    }

    let latestSrcTime = new Date(latestEpochTime).toISOString();
    return OperationOutput.fromJSON({
      summary: `Latest coding activity linked to ${inputData.object_id} happened at ${latestSrcTime}`,
      output: {
        values: [
          {
            last_coding_activity: [latestSrcTime],
          },
        ],
      } as OutputValue,
    });
  }
}
