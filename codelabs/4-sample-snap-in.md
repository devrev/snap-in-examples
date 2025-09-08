# Codelab: Sample Snap-in

## Overview
This Snap-in provides a hands-on example of how to create automations and custom slash commands. It includes an automation that posts a comment when a new work item is created and a slash command that posts a comment on demand.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.

## Step-by-Step Guide

### 1. Manifest
The `manifest.yaml` file defines an automation triggered by `work_created` events and a `/comment_here` slash command. It also specifies input fields for customizing the automation's comment.

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

### 2. Code
The code for the automation is in `4-sample-snap-in/code/src/functions/function_1/index.ts`. It posts a comment to the new work item, with text constructed from the input fields.

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

### 3. Run and Verify
-   **Automation**: Create a new work item (e.g., an issue or a ticket). A new comment should appear on its timeline.
-   **Slash Command**: In a discussion, type `/comment_here`. A "Hello World" comment should be posted.
-   **Local Test**: Run `npm run start:watch -- --functionName=function_1` to test the automation function.

## Explanation
This Snap-in demonstrates two core features:
1.  **Event-Driven Automation**: `function_1` is triggered by a `work_created` event to automate workflows.
2.  **Custom Slash Commands**: The `/comment_here` command allows users to trigger `function_2` on demand.

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
