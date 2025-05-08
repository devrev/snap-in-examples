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
  LinksListParams,
  TimelineEntriesListParams,
  LinkEndpointType,
  ListMode,
  TimelineChangeEvent,
  TimelineEntryType,
  WorkType,
  WorksListParams,
  Link,
} from '@devrev/typescript-sdk-internal/dist/auto-generated/internal/private-internal-devrev-sdk';
import { client } from '@devrev/typescript-sdk-internal';

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
    console.log('Input object ID:', inputData.object_id);
    console.log('Starting to get last coding activity for object ID:', inputData.object_id);

    // Initialize the private DevRev SDK
    const devrevSDK = client.setupInternal({
      endpoint: context.devrev_endpoint,
      token: context.secrets.access_token,
    });

    // Check if the object ID is that of an enhancement
    let issueIDs: string[] = [];
    if (inputData.object_id.toLowerCase().includes('enh')) {
      console.log('Object ID is an enhancement');
      const issueRequest: WorksListParams = {
        type: [WorkType.Issue],
        applies_to_part: [inputData.object_id],
      };
      while (true) {
        console.log('Fetching issues for object:', inputData.object_id);
        const issueResponse = await devrevSDK.worksList(issueRequest);
        //console.log('Issue response:', issueResponse);
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
      console.log('Object ID is not an enhancement');
      issueIDs.push(inputData.object_id);
    }

    let latestEpochTime = 0;
    let codeChangeLinks: Link[] = [];

    for (const issueID of issueIDs) {
      try {
        // Step 1: Fetch linked code_change objects using links.list
        const linksListRequest: LinksListParams = {
          object: issueID,
          object_types: [LinkEndpointType.CodeChange],
        };

        while (true) {
          console.log('Fetching links for object:', issueID);
          const linksResponse = await devrevSDK.linksList(linksListRequest);
          console.log('Links response:', linksResponse);
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
            const timelineRequest: TimelineEntriesListParams = {
              object: link.target.id,
              mode: ListMode.Before,
            };

            while (true) {
              const timelineResponse =
                await devrevSDK.timelineEntriesList(timelineRequest);
              console.log('Timeline response:', timelineResponse);
              for (const entry of timelineResponse.data?.timeline_entries ||
                []) {
                if (entry.type == TimelineEntryType.TimelineChangeEvent) {
                  const timelineChangeEvent = entry as TimelineChangeEvent;
                  // Add null checks for nested properties
                  const event = timelineChangeEvent.event;

                  // Safely access the source_time_stamp
                  let sourceTimeStamp: string | undefined;
                  if (event) {
                    try {
                      // Use a safer approach to access the property by traversing the event object
                      const eventObj = event as unknown as Record<string, any>;

                      // Check if it's an annotated event with microflow_action
                      if (eventObj['annotated']?.['microflow_action']?.['event_metadata']) {
                        const metadata = eventObj['annotated']['microflow_action']['event_metadata'];
                        // Find the source_time_stamp in the metadata array
                        const timeStampEntry = metadata.find((item: any) => item.key === 'source_time_stamp');
                        if (timeStampEntry) {
                          sourceTimeStamp = timeStampEntry.value;
                        }
                      }

                      // Fallback to previous methods if needed
                      if (!sourceTimeStamp) {
                        sourceTimeStamp = eventObj['source_time_stamp'] ||
                          eventObj['data']?.['source_time_stamp'] ||
                          eventObj['metadata']?.['keys']?.['source_time_stamp'];
                      }

                      console.log('Source time stamp:', sourceTimeStamp);
                    } catch (error) {
                      console.error('Error accessing source_time_stamp:', error);
                    }
                  }

                  if (sourceTimeStamp) {
                    console.log('Source time stamp:', sourceTimeStamp);
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
            console.error('Error fetching timeline entries:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching links:', error);
      }
    }
    if (codeChangeLinks.length === 0) {
      console.log('No code_change objects linked to this object');
      return OperationOutput.fromJSON({
        summary: `No code_change objects linked to ${inputData.object_id}`,
        output: {
          values: [{ justification: `No code_change objects linked to this object ${inputData.object_id}` }],
        } as OutputValue,
      });
    }

    if (latestEpochTime === 0) {
      console.log('No coding activity found for this object');
      return OperationOutput.fromJSON({
        summary: `No coding activity yet, linked to this object ${inputData.object_id}`,
        output: {
          values: [{ justification: `No coding activity yet, linked to this object ${inputData.object_id}` }],
        } as OutputValue,
      });
    }

    let latestSrcTime = new Date(latestEpochTime).toISOString();
    console.log('Latest coding activity time:', latestSrcTime);
    return OperationOutput.fromJSON({
      summary: `Latest coding activity linked to ${inputData.object_id} happened at ${latestSrcTime}`,
      output: {
        values: [
          {
            last_coding_activity: [latestSrcTime],
            justification: `Latest coding activity linked to ${inputData.object_id} happened at ${latestSrcTime}`,
          },

        ],
      } as OutputValue,
    });
  }
}
