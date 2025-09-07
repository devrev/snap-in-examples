# Codelab: Create GitHub Issues from DevRev

## Overview
This Snap-in demonstrates how to create a two-way integration between DevRev and GitHub. It provides a `/gh_issue` slash command that allows you to create a GitHub issue directly from a DevRev issue, streamlining your workflow and reducing context switching.

## Prerequisites
- Node.js and npm installed.
- A GitHub Personal Access Token (PAT) with the `repo` scope. You can create one [here](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

## Step-by-Step Guide

### 1. Setup
To use this Snap-in, you need to provide your GitHub PAT as a secret during the Snap-in installation. The manifest defines a keyring named `github_connection` to store this secret securely.

### 2. Code
The `9-external-action/code/src/functions/command_handler/index.ts` file contains the logic for creating the GitHub issue. It's triggered by the `/gh_issue` command and uses the DevRev SDK to get the issue details and the Octokit library to create the issue in GitHub.

```typescript
// Simplified for brevity
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

  // ... (verify org and repo) ...

  // Create an issue using the issue details
  await createGitHubIssue(orgName, repoName, issueDetails, octokit);
};
```

### 3. Run
In a discussion on a DevRev issue, type `/gh_issue <your_org_name> <your_repo_name>` and press Enter.

### 4. Verify
After running the command, a new issue will be created in the specified GitHub repository. The GitHub issue will have the same title and description as the DevRev issue.

## Manifest
The `manifest.yaml` file defines the slash command and the keyring for storing the GitHub PAT.

```yaml
version: "2"
name: "GitHub Issue Creator"
description: "Create a GitHub issue from work in DevRev."

# This is the name displayed in DevRev where the Snap-In takes actions using the token of this service account.
service_account:
  display_name: GitHub Issue Creator

keyrings:
  organization:
    - name: github_connection
      display_name: Github Connection
      description: Github PAT
      types:
        - snap_in_secret

functions:
  - name: command_handler
    description: function to create a GitHub issue

commands:
  - name: gh_issue
    namespace: devrev
    description: Command to create a GitHub issue.
    surfaces:
      - surface: discussions
        object_types:
          - issue
    usage_hint: "[OrgName] [RepoName]"
    function: command_handler
```

## Explanation
This Snap-in demonstrates how to use keyrings to securely store secrets like API tokens. It also shows how to use the DevRev SDK and an external library (Octokit) to interact with both DevRev and GitHub. The `command_handler` function orchestrates the process of getting the issue details from DevRev and creating a new issue in GitHub.

## Next Steps
- Modify the `command_handler` function to add a comment to the DevRev issue with a link to the newly created GitHub issue.
- Create a new automation that automatically creates a GitHub issue when a DevRev issue is created with a specific tag.
- Add support for other version control systems, such as GitLab or Bitbucket.
