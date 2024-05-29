import { client, publicSDK } from '@devrev/typescript-sdk';
import { Octokit } from '@octokit/core';

type IssueDetails = {
  description: string | undefined;
  issueDisplayName: string | undefined;
  title: string;
};

// Function to get the title and description of the issue
const getIssueDetails = async (workId: string, devrevSDK: publicSDK.Api<any>) => {
  try {
    // Get the issue details using the `worksGet` method
    const workItemResp = await devrevSDK.worksGet({
      id: workId,
    });
    const workItem = workItemResp.data.work;

    // Populate the issue details
    const issueDetails: IssueDetails = {
      description: workItem.body,
      issueDisplayName: workItem.display_id,
      title: workItem.title,
    };
    return issueDetails;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to get issue details');
  }
};

// Function to retrieve Organisation name and repository name from command parameters
const getOrgAndRepoNames = (paramString: string): string[] => {
  const paramList = paramString.split(' ');
  if (paramList.length !== 2) {
    throw new Error('Invalid Parameters');
  }
  const [orgName, repoName] = paramList;
  return [orgName, repoName];
};

// Function to verify if the orgName is valid
const verifyOrgName = async (orgName: string, octokit: Octokit): Promise<void> => {
  try {
    await octokit.request('GET /orgs/{org}', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      org: orgName,
    });
  } catch (error) {
    console.error(error);
    throw new Error('Invalid Organisation Name');
  }
};

// Function to verify if the repoName is valid
const verifyRepoName = async (orgName: string, repoName: string, octokit: Octokit): Promise<void> => {
  try {
    await octokit.request('GET /repos/{owner}/{repo}', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      owner: orgName,
      repo: repoName,
    });
  } catch (error) {
    console.error(error);
    throw new Error('Invalid Repository Name');
  }
};

// Function to create an issue
const createGitHubIssue = async (
  orgName: string,
  repoName: string,
  issueDetails: IssueDetails,
  octokit: Octokit
): Promise<void> => {
  try {
    await octokit.request('POST /repos/{owner}/{repo}/issues', {
      body: issueDetails.description,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      owner: orgName,
      repo: repoName,
      title: `[${issueDetails.issueDisplayName}] ${issueDetails.title}`,
    });
  } catch (error) {
    console.error(error);
    throw new Error('Failed to create issue');
  }
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

  // Retrieve the Issue Details from the command event.
  const workId = event.payload['source_id'];
  const issueDetails = await getIssueDetails(workId, devrevSDK);

  // Get the command parameters from the event
  const commandParams = event.payload['parameters'];
  const [orgName, repoName] = getOrgAndRepoNames(commandParams);

  // Verify if orgName is valid
  await verifyOrgName(orgName, octokit);

  // Verify if repoName is valid
  await verifyRepoName(orgName, repoName, octokit);

  // Create an issue using the issue details
  await createGitHubIssue(orgName, repoName, issueDetails, octokit);
};

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
