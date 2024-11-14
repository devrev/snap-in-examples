import { client, publicSDK } from '@devrev/typescript-sdk';
import { Octokit } from '@octokit/core';
import { merge_pr, close_pr, PRDetails, getPRDetails, createBodySnapshots } from '../command_handler';

// Function to get the PR URL
function extractPRUrl(body: any): string | null {
  const richText = body.snaps[0].elements[0].elements[0].text;
  const urlRegex = /\[View PR\]\((https:\/\/github\.com\/.*?\/pull\/\d+)\)/;
  const match = richText.match(urlRegex);
  
  return match ? match[1] : null;
}

// Merge PR function
const mergePR = async (event: any, octokit: Octokit,devrevSDK: publicSDK.Api<any>) => {
  const commentBody = event.payload.body;
  const prURL = extractPRUrl(commentBody);
  let prDetails = await getPRDetails(prURL, octokit);

  // Merge the PR
  await octokit.request('PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge', {
    owner: prDetails.owner,
    repo: prDetails.repo,
    pull_number: prDetails.pull_number,
    merge_method: 'merge',
  });

  prDetails.state = 'merged';
  prDetails.merged_at = new Date().toISOString();
  const snapKitBody: any = {
    body: createBodySnapshots(prDetails),
  };

  // Update the timeline entry
  const timeline_update_data: publicSDK.TimelineEntriesUpdateRequest = {
    body_type: publicSDK.TimelineCommentBodyType.SnapKit,
    id: event.payload.context.entry_id,
    snap_kit_body: snapKitBody,
    type: publicSDK.TimelineEntriesUpdateRequestType.TimelineComment,
  };
  await devrevSDK.timelineEntriesUpdate(timeline_update_data);
};

// Close PR function
const closePR = async (event: any, octokit: Octokit,devrevSDK: publicSDK.Api<any>) => {
  const commentBody = event.payload.body;
  const prURL = extractPRUrl(commentBody);
  let prDetails = await getPRDetails(prURL, octokit);

  // Close the PR
  await octokit.request('PATCH /repos/{owner}/{repo}/pulls/{pull_number}', {
    owner: prDetails.owner,
    repo: prDetails.repo,
    pull_number: prDetails.pull_number,
    state: 'closed',
  });

  // Update the SnapKit comment in DevRev
  prDetails.state = 'closed';
  prDetails.merged_at = new Date().toISOString();
  const snapKitBody: any = {
    body: createBodySnapshots(prDetails),
  };

  // Update the timeline entry
  const timeline_update_data: publicSDK.TimelineEntriesUpdateRequest = {
    body_type: publicSDK.TimelineCommentBodyType.SnapKit,
    id: event.payload.context.entry_id,
    snap_kit_body: snapKitBody,
    type: publicSDK.TimelineEntriesUpdateRequestType.TimelineComment,
  };
  await devrevSDK.timelineEntriesUpdate(timeline_update_data);
};

const handleEvent = async (event: any) => {
  // Get the github token from the environment variables and initialise the Octokit client.
  const githubPAT = event.input_data.keyrings['github_connection'];
  const octokit = new Octokit({
    auth: githubPAT,
  });

  // Get the devrev token and initialise the DevRev SDK.
  const devrevToken = event.context.secrets['service_account_token'];
  const endpoint = event.execution_metadata.devrev_endpoint;
  const devrevSDK = client.setup({
    endpoint: endpoint,
    token: devrevToken,
  });

  // Print the event
  console.log(JSON.stringify(event, null, 2));

  // Action ID
  const actionId = event.payload.action['id'];

  switch (actionId) {
    case merge_pr:
      await mergePR(event, octokit, devrevSDK);
      break;
    case close_pr:
      await closePR(event, octokit, devrevSDK);
      break;
    default:
      console.log('No action found');
  }
}

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
