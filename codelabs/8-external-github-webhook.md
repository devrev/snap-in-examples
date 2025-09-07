# Codelab: GitHub Webhook Integration

## Overview
This Snap-in demonstrates how to integrate DevRev with GitHub using webhooks. It listens for `push` events from a GitHub repository and posts the commit messages to the discussion of a specified part in DevRev. This helps to keep your team informed about the latest code changes.

## Prerequisites
- Node.js and npm installed.
- A GitHub repository where you can configure webhooks.

## Step-by-Step Guide

### 1. Setup
To use this Snap-in, you need to create a webhook in your GitHub repository and configure it to send `push` events to the URL provided during the Snap-in installation. You will also need to provide the webhook secret to the Snap-in for signature validation.

The `manifest.yaml` provides the webhook URL and a randomly generated secret in the `setup_instructions`.

### 2. Code
The `8-external-github-webhook/code/src/functions/github_handler/index.ts` file contains the function that is triggered by the GitHub webhook. It extracts the commit messages from the webhook payload and posts them as a single comment to the specified part.

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
After pushing the commits, a new comment will appear in the discussion of the part you specified in the Snap-in's inputs. The comment will contain the messages of all the commits in the push.

## Manifest
The `manifest.yaml` file defines the custom webhook event source, including a Rego policy for validating the webhook signature.

```yaml
version: "2"

name: GitHub Commit Tracker
description: Reflects commits that happen on GitHub in DevRev by posting to timeline of a product part.

# ... (service_account, inputs) ...

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
This Snap-in uses a `flow-custom-webhook` to receive events from GitHub. The Rego policy in the manifest validates the `X-Hub-Signature-256` header to ensure that the webhook is coming from GitHub and not a malicious third party. If the signature is valid, the `github_handler` function is triggered, which then posts the commit messages to DevRev.

## Next Steps
- Modify the `github_handler` function to handle other GitHub events, such as `issues` or `pull_request`.
- Create new functions to perform different actions based on the GitHub event type.
- Enhance the comment to include more information about the commits, such as the author and a link to the commit in GitHub.
