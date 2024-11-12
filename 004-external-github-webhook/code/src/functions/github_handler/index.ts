import { client, betaSDK, publicSDK } from '@devrev/typescript-sdk';
import { sprintf } from 'sprintf-js';

export enum GITHUB_PR_EVENT_TYPES {
  COMMITTED = 'committed',
  OPENED = 'opened',
  CLOSED = 'closed',
  REOPENED = 'reopened',
  MERGED = 'merged',
  READY_FOR_REVIEW = 'ready_for_review',
  CONVERT_TO_DRAFT = 'convert_to_draft',
  REVIEWED = 'reviewed',
}


export enum WORK_STAGES {
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

// Function to check if current stage is open
function isStageOpen(stage: string) {
  return stage === WORK_STAGES.TRIAGE || stage === WORK_STAGES.PRIORITIZED || stage === WORK_STAGES.BACKLOG;
}

// Get existing works in DevRev for given work ids.
async function getExistingWorks(ids: string[], devrevSDK: betaSDK.Api<unknown>): Promise<Record<string, any>[]> {
  const works: Record<string, any>[] = [];

  for (const id of ids) {
    try {
      const response = await devrevSDK.worksGet({ id });
      works.push(response.data.work);
    } catch (error: any) {
      console.error(`Error while fetching work with id ${id} : ${error.message}`);
    }
  }

  return works;
}

// Helper function to get work item ID from the PR Description
function getWorkItemID(prText: string) {
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
async function handlePROpened(payload: any, devrevSDK: betaSDK.Api<unknown>) {
  // Check the PR Description
  const prTitle = payload.pull_request.title;
  const prDescription = payload.pull_request.body;

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

    // Check if the work item is in the open stage
    if (isStageOpen(work['stage'].name)) {
      // Update the work item stage to in_development
      const workId = work['id'];
      const updateWorkRequest: betaSDK.WorksUpdateRequest = {
        id: workId,
        stage: {
          name: WORK_STAGES.IN_DEVELOPMENT
        },
        stage_validation_options: [betaSDK.StageValidationOptionForUpdate.AllowInvalidTransition],
      };

      // Update the work item stage
      try {
        const response = await devrevSDK.worksUpdate(updateWorkRequest);
        console.log('Work Updated: ', JSON.stringify(response.data.work, null, 2));
      } catch (error: any) {
        console.error(`Error while updating work with id ${workId} : ${error.message}`);
      }
    }
  }
}

// Handles the event from GitHub
async function handleEvent(event: any) {
  // Extract necessary information from the event
  const token = event.context.secrets['service_account_token'];
  const endpoint = event.execution_metadata.devrev_endpoint;

  // Set up the DevRev SDK with the extracted information
  const devrevSDK = client.setupBeta({
    endpoint: endpoint,
    token: token,
  });

  // Check the type of action from the event
  const action = event.payload.action;
  console.log('Action:', action);

  console.log(JSON.stringify(event.payload, null, 2));
  if (action === GITHUB_PR_EVENT_TYPES.OPENED || action === GITHUB_PR_EVENT_TYPES.REOPENED) {
    // Call the async function to handle PR opened event
    await handlePROpened(event.payload, devrevSDK);
  }
}

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
