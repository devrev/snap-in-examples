# Codelab: Custom Webhook Integration

## Overview
This Snap-in demonstrates how to integrate DevRev with external systems by receiving and processing events through a custom webhook. This is a powerful way to bring information from other tools into your DevRev workspace.

## Prerequisites
- Node.js and npm installed.
- An external system capable of sending HTTP POST requests (webhooks).

## Step-by-Step Guide

### 1. Setup
To use this Snap-in, you need to configure your external system to send webhooks to the URL provided during the Snap-in installation. The webhook payload must be a JSON object with the following keys:
- `work_created`: The ID of the work item to which you want to post a comment.
- `body`: The text of the comment you want to post.

The `manifest.yaml` provides these instructions in the `setup_instructions` field.

### 2. Code
The `5-custom-webhook/code/src/functions/on_work_creation/index.ts` file contains the function that is triggered by the custom webhook. It extracts the `work_created` ID and the `body` from the webhook payload and uses them to create a new timeline comment.

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
This Snap-in uses a `flow-custom-webhook` event source to create a unique webhook URL for your Snap-in. When the external system sends a POST request to this URL, DevRev triggers the `on_work_creation` function. The function then uses the DevRev API to create a timeline comment. The Rego policy in the `config` section of the event source is used to extract the event payload and assign it an event key.

## Next Steps
- Modify the function to perform a different action, such as creating a new work item or updating an existing one.
- Customize the Rego policy to handle different payload formats from your external system.
- Add more functions to handle different types of events from the same webhook.
