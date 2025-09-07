# Codelab: Sample Snap-in

## Overview
This Snap-in provides a hands-on example of how to create automations and custom slash commands. It includes an automation that posts a comment when a new work item is created and a slash command that posts a comment on demand.

## Prerequisites
- Node.js and npm installed.

## Step-by-Step Guide

### 1. Setup
This Snap-in has two main features:
1.  An automation that is triggered when a new work item is created.
2.  A `/comment_here` slash command that can be used in discussions.

The automation's comment can be customized using the input fields defined in the `manifest.yaml` file.

### 2. Code
The code for the automation is in `4-sample-snap-in/code/src/functions/function_1/index.ts`. It is triggered by a `work_created` event and posts a comment to the new work item. The comment text is constructed using the values of the input fields.

```typescript
async function handleEvent(
  event: any,
) {
  const devrevPAT = event.context.secrets.service_account_token;
  const API_BASE = event.execution_metadata.devrev_endpoint;
  const devrevSDK = client.setup({
    endpoint: API_BASE,
    token: devrevPAT,
  })
  const workCreated = event.payload.work_created.work;
  const messageInput = event.input_data.global_values.input_field_1;
  let bodyComment = 'Hello World is printed on the work ' + workCreated.display_id + ' from the automation, with message: ' + messageInput;
  const extraComment = event.input_data.global_values.input_field_2;
  const extraNames = event.input_data.global_values.input_field_array;
  if (extraComment) {
    for (let name of extraNames) {
      bodyComment = bodyComment + ' ' + name;
    }
  }
  const body = {
    object: workCreated.id,
    type: 'timeline_comment',
    body:  bodyComment,
  }
  const response = await devrevSDK.timelineEntriesCreate(body as any);
  return response;
}
```

### 3. Run
-   **Automation**: Create a new work item (e.g., an issue or a ticket).
-   **Slash Command**: In a discussion on a work item, type `/comment_here` and press Enter.

### 4. Verify
-   **Automation**: After creating a new work item, you should see a new comment on its timeline.
-   **Slash Command**: After using the `/comment_here` command, you should see a "Hello World" comment on the work item's timeline.

## Manifest
The `manifest.yaml` file defines the automation, the slash command, and the input fields for customizing the automation's comment.

```yaml
version: '2'

name: Sample Snap-Ins for DevRev Hackathon
description: Snap In to add Comments for demonstration purpose.

service_account:
  display_name: "DevRev Bot"

event_sources:
  organization:
    - name: devrev-webhook
      display_name: DevRev
      type: devrev-webhook
      config:
        event_types:
          - work_created

inputs:
  organization:
    - name: input_field_1
      description: Input field to add comment to the work item.
      field_type: text
      default_value: "Message from the input field."
      ui:
        display_name: Input Field 1

    - name: input_field_2
      description: Add extra comment.
      field_type: bool
      default_value: true
      ui:
        display_name: Should extra comment be added?

    - name: input_field_array
      description: List of names to add as comment.
      base_type: text
      field_type: array
      default_value: ["name1", "name2"]
      ui:
        display_name: List of extra names

functions:
  - name: function_1
    description: Function to create a timeline entry comment on a DevRev work item created.
  - name: function_2
    description: Function to create a timeline entry comment on a DevRev work item on which comment is added.

automations:
  - name: convergence_automation_devrev
    source: devrev-webhook
    event_types:
      - work_created
    function: function_1

commands:
  - name: comment_here
    namespace: devrev
    description: Command to trigger function to add comment to this work item.
    surfaces:
      - surface: discussions
        object_types:
          - issue
          - ticket
    usage_hint: "Command to add comment to this work item."
    function: function_2
```

## Explanation
This Snap-in demonstrates two common use cases:
1.  **Event-driven automation**: The `function_1` is triggered by a `work_created` event, which is a common pattern for automating workflows.
2.  **Custom slash commands**: The `/comment_here` command provides a way for users to trigger actions on demand.

## Next Steps
-   Modify the comment text in `function_1` and `function_2`.
-   Create a new slash command that takes arguments.
-   Create a new automation that is triggered by a different event, such as `work_updated`.
