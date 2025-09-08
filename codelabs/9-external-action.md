# Codelab: Create GitHub Issues from DevRev

## Overview
This Snap-in demonstrates a two-way integration between DevRev and GitHub. It provides a `/gh_issue` slash command to create a GitHub issue directly from a DevRev issue, streamlining workflows and reducing context switching.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.
- A GitHub Personal Access Token (PAT) with `repo` scope.

## Step-by-Step Guide

### 1. Setup
This section guides you on setting up a new Snap-in project from scratch and explains the structure of this specific example.

#### Initializing a New Project
To create a new Snap-in, you'll use the DevRev CLI.

1.  **Initialize the project:** Run `devrev snap_in_version init <project_name>` to create a new project directory with a template structure. *(Reference: `init` documentation)*
2.  **Validate the manifest:** Before writing code, check the template `manifest.yaml` by running `devrev snap_in_version validate-manifest manifest.yaml`. *(Reference: `validate-manifest` documentation)*
3.  **Prepare test data:** Create a JSON file in `code/src/fixtures/` with a sample event payload for local testing.

#### Example Structure
To use this Snap-in, you need to provide your GitHub PAT as a secret during installation. The manifest defines a keyring named `github_connection` to store this secret securely.

### 2. Code
The `9-external-action/code/src/functions/command_handler/index.ts` file contains the logic for creating the GitHub issue. It's triggered by the `/gh_issue` command and uses the DevRev SDK to get issue details and the Octokit library to create the issue in GitHub.

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
A new issue will be created in the specified GitHub repository with the same title and description as the DevRev issue.

## Manifest
The `manifest.yaml` file defines the slash command and the keyring for storing the GitHub PAT.

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

## Explanation
This Snap-in shows how to use keyrings to securely store secrets like API tokens. It also demonstrates using the DevRev SDK and an external library (Octokit) to interact with both DevRev and GitHub. The `command_handler` function orchestrates getting issue details from DevRev and creating a corresponding issue in GitHub.
