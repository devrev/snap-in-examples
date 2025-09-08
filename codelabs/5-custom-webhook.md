# Codelab: Custom Webhook Integration

## Overview
This Snap-in demonstrates how to integrate DevRev with external systems by receiving and processing events through a custom webhook. This is a powerful way to bring information from other tools into your DevRev workspace.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.
- An external system capable of sending HTTP POST requests (webhooks).

## Step-by-Step Guide

### 1. Setup
This section guides you on setting up a new Snap-in project from scratch and explains the structure of this specific example.

#### Initializing a New Project
To create a new Snap-in, you'll use the DevRev CLI.

1.  **Initialize the project:** Run `devrev snap_in_version init <project_name>` to create a new project directory with a template structure. *(Reference: `init` documentation)*
2.  **Validate the manifest:** Before writing code, check the template `manifest.yaml` by running `devrev snap_in_version validate-manifest manifest.yaml`. *(Reference: `validate-manifest` documentation)*
3.  **Prepare test data:** Create a JSON file in `code/src/fixtures/` with a sample event payload for local testing.

#### Example Structure
To use this Snap-in, you need to configure your external system to send webhooks to the URL provided during installation. The `manifest.yaml` provides these instructions in the `setup_instructions` field.

### 2. Code
The `5-custom-webhook/code/src/functions/on_work_creation/index.ts` file contains the function triggered by the custom webhook. It extracts the `work_created` ID and `body` from the payload to create a new timeline comment.

```typescript
async function handleEvent(
  event: any,
) {
  const devrevPAT = event.context.secrets.service_account_token;
  const API_BASE = event.execution_metadata.devrev_endpoint;
  const workCreated = event.payload.work_created;
  const bodyComment = event.payload.body;
  const body = {
    object: workCreated,
    type: 'timeline_comment',
    body: bodyComment,
  }
  const response = await postCallAPI(API_BASE + '/timeline-entries.create', body, devrevPAT);
  if (!response.success) {
    console.log(response.errMessage);
    return response;
  }
  console.log(response.data);
  return response;
}
```

### 3. Run
To trigger the Snap-in, send an HTTP POST request to the webhook URL with a JSON payload like this:

```json
{
  "work_created": "your_work_id",
  "body": "This is a comment from my external system."
}
```

### 4. Verify
After sending the webhook, a new comment should appear on the timeline of the specified work item.

## Manifest
The `manifest.yaml` file defines the custom webhook event source and the automation that connects it to the `on_work_creation` function.

```yaml
version: "1"

name: "External Event Source"
description: "Sample external event source snap in"

service_account:
  display_name: "External Event Bot"

event-sources:
  - name: external-alerts
    description: Event coming from external source
    display_name: External Event
    type: flow-custom-webhook
    setup_instructions: |
      ## External Event Webhook

      1. Enter the webhook URL as `{{source.trigger_url}}`
      2. Enter the webhook PAYLOAD as
      `{
        'work_created': <WORK_ID>,
        'body': <EVENT_BODY>,
      }`
    config:
      policy: |
        package rego
        output = {"event": event, "event_key": event_key} {
          event := input.request.body
          event_key := "external.alert-event"
        }

functions:
  - name: on_work_creation
    description: Function to send notification to potentially relevant users.

automations:
  - name: Send notification on External Event alerts
    source: external-alerts
    event_types:
      - custom:external.alert-event
    function: on_work_creation
```

## Explanation
This Snap-in uses a `flow-custom-webhook` event source to create a unique webhook URL. When an external system sends a POST request to this URL, DevRev triggers the `on_work_creation` function. A Rego policy in the manifest extracts the payload and assigns it an event key, which routes the data to the correct function.
