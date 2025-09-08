# Codelab: GitHub Webhook Integration

## Overview
This Snap-in integrates DevRev with GitHub using webhooks. It listens for `push` events from a repository and posts the commit messages to a specified part's discussion in DevRev, keeping your team informed of code changes.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.
- A GitHub repository where you can configure webhooks.

## Step-by-Step Guide

### 1. Setup
This section guides you on setting up a new Snap-in project from scratch and explains the structure of this specific example.

#### Initializing a New Project
To create a new Snap-in, you'll use the DevRev CLI.

1.  **Initialize the project:** Run `devrev snap_in_version init <project_name>` to create a new project directory with a template structure. *(Reference: `init` documentation)*
2.  **Validate the manifest:** Before writing code, check the template `manifest.yaml` by running `devrev snap_in_version validate-manifest manifest.yaml`. *(Reference: `validate-manifest` documentation)*
3.  **Prepare test data:** Create a JSON file in `code/src/fixtures/` with a sample event payload for local testing.

#### Example Structure
To use this Snap-in, create a webhook in your GitHub repository for `push` events, using the URL and secret provided during installation.

### 2. Code
The `8-external-github-webhook/code/src/functions/github_handler/index.ts` file contains the function triggered by the GitHub webhook. It extracts commit messages from the payload and posts them to the specified part.

```typescript
// Handles the event from GitHub
async function handleEvent(event: any) {
  // Extract necessary information from the event
  const token = event.context.secrets['service_account_token'];
  const endpoint = event.execution_metadata.devrev_endpoint;

  // Set up the DevRev SDK with the extracted information
  const devrevSDK = client.setup({
    endpoint: endpoint,
    token: token,
  });

  // Extract the part ID and commits from the event
  const partID = event.input_data.global_values['part_id'];
  const commits = event.payload['commits'];

  // Iterate through commits and append the commit message to the body of the comment
  let bodyComment = 'Commits from GitHub:\n';
  for (const commit of commits) {
    bodyComment += commit.message + '\n';
  }

  // Prepare the body for creating a timeline comment
  const body: betaSDK.TimelineEntriesCreateRequest = {
    body: bodyComment,
    object: partID,
    type: betaSDK.TimelineEntriesCreateRequestType.TimelineComment,
  };

  // Create a timeline comment using the DevRev SDK
  const response = await devrevSDK.timelineEntriesCreate(body);

  // Return the response from the DevRev API
  return response;
}
```

### 3. Run
To trigger the Snap-in, push one or more commits to your GitHub repository.

### 4. Verify
After pushing commits, a new comment appears in the specified part's discussion, containing the commit messages.

## Manifest
The `manifest.yaml` file defines the custom webhook event source, including a Rego policy for validating the webhook signature.

```yaml
version: "2"

name: GitHub Commit Tracker
description: Reflects commits that happen on GitHub in DevRev by posting to timeline of a product part.

service_account:
  display_name: "GitHub-Commit Bot"

inputs:
  organization:
    - name: part_id
      field_type: id
      default_value: don:core:dvrv-us-1:devo/XXXXXXX:product/1
      is_required: true
      id_type:
        - product
      description: The default part on which to post commits.
      ui:
        display_name: The part on which to post commits.

event_sources:
  organization:
    - name: github-app-source
      type: flow-custom-webhook
      description: Event coming from Github app.
      config:
        policy: |
          package rego
          signature := crypto.hmac.sha256(base64.decode(input.request.body_raw), input.parameters.secret)
          expected_header := sprintf("sha256=%v", [signature])
          signature_header_name:= "X-Hub-Signature-256"
          status_code = 200 {
            input.request.headers[signature_header_name] == expected_header
          } else = 401 {
            true
          }
          output = {"event": body, "event_key": event_key} {
            status_code == 200
            body := input.request.body
            event_key := "github-event"
          } else = {"response": response} {
            response := {"status_code": status_code}
          }
        parameters:
          secret: 6aVqEymevGZvkiUk30oWccVLEKNOqkcP
      setup_instructions: "Please copy the source URL from here: \n\nURL: `{{ source.trigger_url  }}` \n\nSecret: `{{source.config.parameters.secret}}`."

functions:
  - name: github_handler
    description: Function to reflect Github activities on DevRev.

automations:
  - name: github-commit-tracker
    source: github-app-source
    event_types:
      - custom:github-event
    function: github_handler
```

## Explanation
This Snap-in uses a `flow-custom-webhook` to receive events from GitHub. The Rego policy in the manifest validates the `X-Hub-Signature-256` header to ensure the webhook's authenticity. If the signature is valid, the `github_handler` function is triggered, which then posts the commit messages to DevRev.
