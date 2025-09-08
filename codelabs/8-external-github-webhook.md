# Codelab: GitHub Webhook Integration

## Overview
This Snap-in integrates DevRev with GitHub using webhooks. It listens for `push` events from a repository and posts the commit messages to a specified part's discussion in DevRev, keeping your team informed of code changes.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.
- A GitHub repository where you can configure webhooks.

## Step-by-Step Guide

### 1. Manifest
The `manifest.yaml` defines a `flow-custom-webhook` to receive events from GitHub. It includes a Rego policy to validate the `X-Hub-Signature-256` header, ensuring the webhook's authenticity.

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

### 2. Code
The function at `8-external-github-webhook/code/src/functions/github_handler/index.ts` is triggered by the webhook. It extracts commit messages from the payload and posts them as a single comment to the specified part.

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

### 3. Run and Verify
Push commits to your GitHub repository. A new comment containing the commit messages will appear in the discussion of the specified DevRev part.

## Explanation
This Snap-in uses a `flow-custom-webhook` to receive events from GitHub. The Rego policy in the manifest validates the webhook signature. If valid, the `github_handler` function is triggered, which posts the commit messages to DevRev.

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
