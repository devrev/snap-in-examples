import { client, publicSDK } from '@devrev/typescript-sdk';
import { Octokit } from '@octokit/core';

interface RepoDetails {
  name: string;
  full_name: string;
  owner: Owner;
  html_url: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  homepage: string | null;
  language: string | null;
  default_branch: string;
}

interface Owner {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
}

function extractOwnerAndRepo(url: string): { ownerString: string; repo: string } | null {
  // Remove angle brackets if present
  url = url.replace(/^<|>$/g, '');

  // Regular expression to match GitHub URLs
  const githubRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/;
  
  // Try to match the URL
  const match = url.match(githubRegex);
  
  if (match && match.length === 3) {
    return {
      ownerString: match[1],
      repo: match[2]
    };
  }
  
  // Return null if the URL doesn't match the expected format
  return null;
}


export const getRepoDetails = async (repositoryURL: string, octokit: Octokit): Promise<RepoDetails> => {
  try {
    // Extract owner and repo from the repository URL
    const { ownerString, repo } = extractOwnerAndRepo(repositoryURL) || {};

    if (!ownerString || !repo) {
      const errMsg = 'Invalid repository URL'+repositoryURL;
      throw new Error(errMsg);
    }

    // Fetch Repo details using octokit
    const response = await octokit.request('GET /repos/{ownerString}/{repo}', {
      ownerString,
      repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    // Extract relevant information
    const repoDetails: RepoDetails = {
      name: response.data.name,
      full_name: response.data.full_name,
      owner: response.data.owner,
      html_url: response.data.html_url,
      description: response.data.description,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      homepage: response.data.homepage,
      language: response.data.language,
      default_branch: response.data.default_branch
    }
    return repoDetails;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch Repo details: ${error.message}`);
    }
    throw new Error('Failed to fetch Repo details: Unknown error');
  }
};


// Function to create a timeline comment with the Repo details
const createTimelineComment = async (partId: string, prDetails: RepoDetails, devrevSDK: publicSDK.Api<any>): Promise<void> => {
  // Format the body of the timeline comment
  const bodyComment = `**Repo Details:**
  - Name: ${prDetails.name}
  - Full Name: ${prDetails.full_name}
  - Owner: ${prDetails.owner.login}
  - Description: ${prDetails.description}
  - Created At: ${prDetails.created_at}
  - Updated At: ${prDetails.updated_at}
  - [View Repo](${prDetails.html_url})`;

  // Create a timeline comment with the Repo details
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
  const repositoryURL: string = event.payload['parameters'];

  // Get the Repo details
  const prDetails = await getRepoDetails(repositoryURL, octokit);

  // Create a timeline comment with the Repo details  
  await createTimelineComment(partId, prDetails, devrevSDK);
};

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;