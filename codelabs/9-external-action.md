# Codelab: Create GitHub Issues from DevRev

## Overview
This Snap-in demonstrates a two-way integration between DevRev and GitHub. It provides a `/gh_issue` slash command to create a GitHub issue directly from a DevRev issue, streamlining workflows and reducing context switching.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.
- A GitHub Personal Access Token (PAT) with `repo` scope.

## Step-by-Step Guide

### 1. Manifest
The `manifest.yaml` file defines the `/gh_issue` slash command and a `keyring` to securely store the GitHub PAT.

```yaml
version: "2"
name: "GitHub Issue Creator"
description: "Create a GitHub issue from work in DevRev."

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

### 2. Code
The function at `9-external-action/code/src/functions/command_handler/index.ts` creates the GitHub issue. It's triggered by the `/gh_issue` command and uses the DevRev SDK to get issue details and the Octokit library to create the issue in GitHub.

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

### 3. Run and Verify
In a discussion on a DevRev issue, type `/gh_issue <your_org_name> <your_repo_name>`. A new issue will be created in the specified GitHub repository with the same title and description as the DevRev issue.

## Explanation
This Snap-in shows how to use keyrings to securely store secrets like API tokens. It also demonstrates using the DevRev SDK and an external library (Octokit) to interact with both DevRev and GitHub. The `command_handler` function orchestrates getting issue details from DevRev and creating a corresponding issue in GitHub.

## Getting Started from Scratch
To build this Snap-in from scratch, follow these steps:

1.  **Initialize Project**:
    - **TODO**: Use the `devrev snaps init` command to scaffold a new Snap-in project structure. This will create the basic directory layout and configuration files.

2.  **Update Manifest**:
    - **TODO**: Modify the generated `manifest.yaml` to define your Snap-in's name, functions, and event subscriptions, similar to the example provided in this guide.

3.  **Implement Function**:
    - **TODO**: Write your function's logic in the corresponding `index.ts` file within the `code/src/functions/` directory.

4.  **Test Locally**:
    - **TODO**: Create a test fixture (e.g., `event.json`) with a sample event payload. Use the `npm run start:watch` command to run your function and verify its behavior.
