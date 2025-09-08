# Codelab: Custom Webhook Integration

## Overview
This Snap-in demonstrates how to integrate DevRev with external systems by receiving and processing events through a custom webhook. This is a powerful way to bring information from other tools into your DevRev workspace.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.
- An external system capable of sending HTTP POST requests (webhooks).

## Step-by-Step Guide

### 1. Manifest
The `manifest.yaml` file defines a `flow-custom-webhook` event source. This source generates a unique URL to receive data from external systems. The `setup_instructions` guide the user on how to configure the external webhook.

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

### 2. Code
The function at `5-custom-webhook/code/src/functions/on_work_creation/index.ts` is triggered by the custom webhook. It extracts the `work_created` ID and `body` from the payload to create a timeline comment.

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

### 3. Run and Verify
To trigger the Snap-in, send an HTTP POST request to the generated webhook URL with a JSON payload like this:

```json
{
  "work_created": "your_work_id",
  "body": "This is a comment from my external system."
}
```

After sending the webhook, a new comment will appear on the timeline of the specified work item.

## Explanation
This Snap-in uses a `flow-custom-webhook` to create a unique URL. When an external system sends a POST request to this URL, DevRev triggers the `on_work_creation` function. The Rego policy in the manifest extracts the payload and assigns it an event key, which routes the data to the correct function. The function then uses the DevRev API to create a timeline comment.

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
