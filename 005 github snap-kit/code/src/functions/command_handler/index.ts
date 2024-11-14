import { client, publicSDK } from '@devrev/typescript-sdk';
import { Octokit } from '@octokit/core';


interface PRDetails {
  owner: string;
  repo: string;
  pull_number: number;
  title?: string | null;
  body?: string | null;
  state?: string;
  created_at?: string;
  updated_at?: string;
  merged_at?: string | null;
  html_url?: string;
  user?: User;
}

interface User {
  login: string;
  id: number;
  html_url: string;
}

export const getPRDetails = async (pullRequestURL: string, octokit: Octokit): Promise<PRDetails> => {
  try {
    // Parse the PR URL to extract owner, repo, and PR number
    const urlPattern = /https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;
    const match = pullRequestURL.match(urlPattern);

    if (!match) {
      throw new Error('Invalid GitHub PR URL format');
    }

    const [, owner, repo, prNumberStr] = match;
    const pull_number = parseInt(prNumberStr, 10);

    if (isNaN(pull_number)) {
      throw new Error('Invalid PR number in URL');
    }

    // Fetch PR details using octokit
    const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner,
      repo,
      pull_number,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    // Extract relevant information
    const {
      title,
      body,
      state,
      created_at,
      updated_at,
      merged_at,
      html_url,
      user,
    } = response.data;

    return {
      owner,
      repo,
      pull_number,
      title,
      body,
      state,
      created_at,
      updated_at,
      merged_at,
      html_url,
      user,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch PR details: ${error.message}`);
    }
    throw new Error('Failed to fetch PR details: Unknown error');
  }
};

// Function to create a timeline comment with the PR details
const createTimelineComment = async (partId: string, prDetails: PRDetails, devrevSDK: publicSDK.Api<any>): Promise<void> => {
  // Format the body of the timeline comment
  const bodyComment = `**PR Details:**
  - Title: ${prDetails.title}
  - Description: ${prDetails.body}
  - State: ${prDetails.state}
  - Created At: ${prDetails.created_at}
  - Updated At: ${prDetails.updated_at}
  ${prDetails.state === "open" ? "" : `- Merged At: ${prDetails.merged_at}`}
  - Created By: [${prDetails.user?.login}](${prDetails.user?.html_url})
  - [View PR](${prDetails.html_url})`;

  // Create a timeline comment with the PR details
  await devrevSDK.timelineEntriesCreate({
    body: bodyComment,
    object: partId,
    body_type: publicSDK.TimelineCommentBodyType.Text,
    type: publicSDK.TimelineEntriesCreateRequestType.TimelineComment,
    visibility: publicSDK.TimelineEntryVisibility.Internal,
  });
};

// Function to handle the command event
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

  // Retrieve the Part ID from the command event.
  const partId = event.payload['source_id'];

  // Get the command parameters from the event
  const pullRequestURL = event.payload['parameters'];

  // Get the PR details
  const prDetails = await getPRDetails(pullRequestURL, octokit);

  // Create a timeline comment with the PR details  
  await createTimelineComment(partId, prDetails, devrevSDK);
};

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
