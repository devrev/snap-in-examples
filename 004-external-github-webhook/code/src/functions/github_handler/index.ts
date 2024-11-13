import { betaSDK, client, publicSDK } from '@devrev/typescript-sdk';
import axios from 'axios';
import { sprintf } from 'sprintf-js';

export enum GithubPrEventTypes {
  COMMITTED = 'committed',
  OPENED = 'opened',
  CLOSED = 'closed',
  REOPENED = 'reopened',
  MERGED = 'merged',
  READY_FOR_REVIEW = 'ready_for_review',
  CONVERT_TO_DRAFT = 'convert_to_draft',
  REVIEWED = 'reviewed',
}

export enum WorkStages {
  // Open
  TRIAGE = 'triage',
  PRIORITIZED = 'prioritized',
  BACKLOG = 'backlog',

  // In Progress
  IN_DEVELOPMENT = 'in_development',
  IN_REVIEW = 'in_review',
  IN_TESTING = 'in_testing',
  IN_DEPLOYMENT = 'in_deployment',

  // Completed
  COMPLETED = 'completed',
  WONT_FIX = 'wont_fix',
  DUPLICATE = 'duplicate',
  RESOLVED = 'resolved',
}

export interface HTTPResponse {
  success: boolean;
  message: string;
  data: any;
  headers?: any;
}

// Function to check if current stage is open
export function isStageOpen(stage: string): boolean {
  return stage === WorkStages.TRIAGE || stage === WorkStages.PRIORITIZED || stage === WorkStages.BACKLOG;
}

export const defaultResponse: HTTPResponse = {
  data: {},
  message: '',
  success: false,
};

export async function postCall(
  endpoint: string,
  authKey: string,
  payload: Record<string, any>,
  extraHeaders: Record<string, string> = {}
): Promise<HTTPResponse> {
  try {
    const response: any = await axios.post(endpoint, payload, {
      headers: {
        Authorization: authKey,
        'Content-type': 'application/json',
        ...extraHeaders,
      },
    });

    return { ...defaultResponse, data: response.data, headers: response?.headers, success: true };
  } catch (error: any) {
    if (error.response) {
      return { ...defaultResponse, message: JSON.stringify(error.response.data) };
    } else {
      return { ...defaultResponse, message: error.message };
    }
  }
}

async function getUserPreference(
  snapInId: string,
  userId: string,
  devrevEndpoint: string,
  devrevToken: string
): Promise<Record<string, any>> {
  const endpoint = devrevEndpoint + '/internal/snap-ins.resources';
  const response = await postCall(endpoint, devrevToken, {
    id: snapInId,
    user: userId,
  });

  if (!response.success) {
    throw new Error(
      `Error while fetching user preference for user with id ${userId} : ${JSON.stringify(response.message)}`
    );
  }

  return response.data.inputs;
}

// Function to check if we should update the stage
export async function shouldUpdateStage(
  work: Record<string, unknown>,
  snapInID: string,
  devrevEndpoint: string,
  devrevToken: string
): Promise<boolean> {
  // Check if the work item is in the open stage
  if (!isStageOpen((work['stage'] as Record<string, unknown>)['name'] as string)) {
    return false;
  }

  // Check the preferences for the owner of the work item
  const ownedBy = work['owned_by'] as Array<Record<string, unknown>>;
  if (!ownedBy || ownedBy.length === 0) {
    return false;
  }

  // Get the first owner's ID
  const ownerId = ownedBy[0]['id'] as string;
  const preferences = await getUserPreference(snapInID, ownerId, devrevEndpoint, devrevToken);

  // Check if the owner has the preference to auto-update the stage
  return preferences['update_issue_on_pr'] as boolean;
}

// Get existing works in DevRev for given work ids.
export async function getExistingWorks(
  ids: string[],
  devrevSDK: betaSDK.Api<unknown>
): Promise<Record<string, unknown>[]> {
  const works: Record<string, unknown>[] = [];

  for (const id of ids) {
    try {
      const response: any = await devrevSDK.worksGet({ id });
      works.push(response.data.work);
    } catch (error) {
      console.error(`Error while fetching work with id ${id} : ${(error as Error).message}`);
    }
  }

  return works;
}

// Helper function to get work item ID from the PR Description
export function getWorkItemID(prText: string): Set<string> {
  // Capitalize the PR Text
  const capitalizedText = prText.toUpperCase();

  // Regex Patterns
  const displayIdPattern = '(ISS|TKT)-\\d+';
  const objectIdPattern = '(ISSUE|TICKET):\\d+';
  const workIdPattern = sprintf('%1s|%2s', displayIdPattern, objectIdPattern);

  const objectIdRegex = new RegExp(objectIdPattern, 'gi');
  const workIdRegex = new RegExp(workIdPattern, 'gi');
  const matchedIds = new Set<string>();

  // Match the Work Item ID
  let match;
  while ((match = workIdRegex.exec(capitalizedText))) {
    // Converting matched work/display IDs (Ex: issue:29 , TkT-10) to standard display IDs ISS-29, TKT-10.
    let id: string = match[0].toUpperCase();
    if (id.match(objectIdRegex)) {
      id = (id.startsWith('I') ? 'ISS-' : 'TKT-') + id.split(':')[1];
    }
    matchedIds.add(id);
  }

  // Return the Work Item ID
  return matchedIds;
}

// Handles the PR opened event
export async function handlePROpened(
  payload: Record<string, unknown>,
  devrevSDK: betaSDK.Api<unknown>,
  token: string,
  endpoint: string,
  snapInID: string
): Promise<void> {
  // Check the PR Description
  const prTitle = (payload['pull_request'] as Record<string, unknown>)?.['title'] as string;
  const prDescription = (payload['pull_request'] as Record<string, unknown>)?.['body'] as string;
  const htmlURL = (payload['pull_request'] as Record<string, unknown>)?.['html_url'] as string;

  // Combine the PR Title and Description
  const prText = prTitle + ' ' + prDescription;

  // Extract issue/ticket information from the PR Description
  const workItemIDs = getWorkItemID(prText);

  // Get the work item from IDs
  const works = await getExistingWorks(Array.from(workItemIDs), devrevSDK);

  // For each work item, if current stage is open, update the stage to in_development.
  for (const work of works) {
    // Log the work item
    console.log('Work: ', JSON.stringify(work, null, 2));
    if (work['type'] !== publicSDK.WorkType.Issue) {
      continue;
    }

    // Check if we should update the stage
    if (!(await shouldUpdateStage(work, snapInID, endpoint, token))) {
      continue;
    }

    // Update the work item stage to in_development
    const workId = work['id'] as string;
    const updateWorkRequest: betaSDK.WorksUpdateRequest = {
      custom_fields: {
        tnt__github_pr_url: htmlURL,
      },
      custom_schema_spec: {
        tenant_fragment: true,
        validate_required_fields: false,
      },
      id: workId,
      stage: {
        name: WorkStages.IN_DEVELOPMENT,
      },
      stage_validation_options: [betaSDK.StageValidationOptionForUpdate.AllowInvalidTransition],
    };

    // Update the work item stage
    try {
      const response = await devrevSDK.worksUpdate(updateWorkRequest);
      console.log('Work Updated: ', JSON.stringify(response.data.work, null, 2));
    } catch (error) {
      console.error(`Error while updating work with id ${workId} : ${(error as Error).message}`);
    }
  }
}

// Handles the event from GitHub
export async function handleEvent(event: Record<string, unknown>): Promise<void> {
  // Extract necessary information from the event
  const token = (event['context'] as Record<string, unknown>)['secrets'] as Record<string, string>;
  const endpoint = (event['execution_metadata'] as Record<string, string>)['devrev_endpoint'];
  const snapInID = (event['context'] as Record<string, unknown>)['snap_in_id'] as string;

  // Set up the DevRev SDK with the extracted information
  const devrevSDK = client.setupBeta({
    endpoint: endpoint,
    token: token['service_account_token'],
  });

  // Check the type of action from the event
  const action = (event['payload'] as Record<string, unknown>)['action'] as string;
  console.log('Action:', action);

  console.log(JSON.stringify(event, null, 2));
  if (action === GithubPrEventTypes.OPENED || action === GithubPrEventTypes.REOPENED) {
    // Call the async function to handle PR opened event
    await handlePROpened(
      event['payload'] as Record<string, unknown>,
      devrevSDK,
      token['service_account_token'],
      endpoint,
      snapInID
    );
  }
}

export const run = async (events: Record<string, unknown>[]): Promise<void> => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
