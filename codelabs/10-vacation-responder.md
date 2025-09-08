# Codelab: Vacation Responder

## Overview
This Snap-in uses user-level settings to create a personalized vacation responder. When an issue is assigned to a user who is "on vacation," the Snap-in automatically posts their custom vacation message to the issue's timeline.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.

## Step-by-Step Guide

### 1. Manifest
The `manifest.yaml` file defines user-level inputs for the vacation status and message. It also includes a JQ filter to target the automation precisely when an issue is assigned to the user.

```yaml
version: "2"
name: "Vacation Responder"
description: "Respond with a custom message when on vacation"

service_account:
  display_name: Vacation Responder Bot

inputs:
  user:
    - name: on_vacation
      field_type: bool
      ui:
        display_name: On Vacation

    - name: vacation_message
      description: Message to send when on vacation
      field_type: text
      ui:
        display_name: Vacation message

event_sources:
  user:
    - name: devrev-user-event-source
      description: Event source per user listening on DevRev events.
      display_name: DevRev user events listener
      type: devrev-webhook
      config:
        event_types:
          - work_updated
          - work_created
      filter:
        jq_query: |
          if .type == "work_created" then
            if (.work_created.work.type == "issue" and .work_created.work.owned_by[0].id == $user.id) then true
            else false
            end
          else
            if (.work_updated.work.type == "issue" and .work_updated.work.owned_by[0].id == $user.id) then true
            else false
            end
          end
functions:
  - name: vacation_responder
    description: Function to respond on vacation

automations:
  - name: vacation_responder_automation
    source: devrev-user-event-source
    event_types:
      - work_created
      - work_updated
    function: vacation_responder
```

### 2. Code
The function at `10-vacation-responder/code/src/functions/vacation_responder/index.ts` is triggered when an issue is assigned. It uses the `snapIns.resources` API to fetch the user's vacation settings and post their message.

```typescript
// Simplified for brevity
async function engine(event: any) {
  // ... (setup code) ...

  if (!validateEvent(event)) return;
  const eventType = event.payload.type;
  const work = event.payload[eventType].work;
  const workOwner = work.owned_by[0].id;
  const snapInID = event.context.snap_in_id;

  try {
    const userResourcesResponse = await betaClient.snapInsResources({
      id: snapInID,
      user: workOwner,
    });
    const userResourcesData = userResourcesResponse.data;
    if (userResourcesData.inputs) {
      const inputs = userResourcesData.inputs;
      const inputsMap = objectToMap(inputs);
      if (inputsMap.get('on_vacation') == true) {
        const vacation_message = inputsMap.get('vacation_message') as string;
        if (vacation_message && vacation_message.length > 0) {
          await apiClient.timelineEntriesCreate({
            body: vacation_message,
            type: TimelineEntriesCreateRequestType.TimelineComment,
            object: work.id,
          });
        }
      }
    }
  } catch (error: any) {
    // ... (error handling) ...
  }
}
```

### 3. Run and Verify
Assign an issue to a user who has enabled their vacation responder. Their custom vacation message will be posted as a comment on the issue's timeline.

## Explanation
This Snap-in demonstrates two key features:
1.  **User-Level Settings**: The `inputs.user` section in the manifest allows each user to have their own settings.
2.  **JQ Filtering**: The `filter.jq_query` precisely controls when the automation is triggered, firing only when an issue is assigned to the installing user.

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
