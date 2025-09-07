# Codelab: Vacation Responder

## Overview
This Snap-in demonstrates how to use user-level settings to create a personalized vacation responder. When an issue is assigned to a user who has marked themselves as "on vacation", the Snap-in automatically posts their custom vacation message to the issue's timeline.

## Prerequisites
- Node.js and npm installed.

## Step-by-Step Guide

### 1. Setup
Each user who installs this Snap-in can configure their own vacation settings. In the Snap-in's settings page, each user will see two inputs:
- **On Vacation**: A checkbox to indicate whether they are currently on vacation.
- **Vacation Message**: A text field to enter their custom vacation message.

### 2. Code
The `10-vacation-responder/code/src/functions/vacation_responder/index.ts` file contains the logic for the vacation responder. It's triggered when an issue is assigned to a user, and it uses the `snapIns.resources` API to get the user's vacation settings.

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

### 3. Run
To trigger the Snap-in, assign an issue to a user who has enabled their vacation responder.

### 4. Verify
After assigning the issue, the user's custom vacation message will be posted as a comment on the issue's timeline.

## Manifest
The `manifest.yaml` file defines the user-level inputs and the event source with a JQ filter to target the automation.

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

## Explanation
This Snap-in demonstrates two powerful features:
1.  **User-level settings**: The `inputs.user` section in the manifest allows each user to have their own settings for the Snap-in.
2.  **JQ filtering**: The `filter.jq_query` in the event source allows you to precisely control when the automation is triggered. In this case, it's only triggered when an issue is assigned to the user who has installed the Snap-in.

## Next Steps
- Add more user-level settings, such as a start and end date for the vacation, and modify the function to only post the vacation message if the current date is within the vacation period.
- Create a slash command that allows users to quickly enable or disable their vacation responder.
- Modify the JQ filter to trigger the automation for other types of work items, such as tickets or tasks.
