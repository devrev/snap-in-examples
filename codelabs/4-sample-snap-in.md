# Codelab: Sample Snap-in

## Overview
This Snap-in provides a hands-on example of how to create automations and custom slash commands. It includes an automation that posts a comment when a new work item is created and a slash command that posts a comment on demand.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.

## Step-by-Step Guide

### 1. Setup
This section guides you on setting up a new Snap-in project from scratch and explains the structure of this specific example.

#### Initializing a New Project
To create a new Snap-in, you'll use the DevRev CLI.

1.  **Initialize the project:** Run `devrev snap_in_version init <project_name>` to create a new project directory with a template structure. *(Reference: `init` documentation)*
2.  **Validate the manifest:** Before writing code, check the template `manifest.yaml` by running `devrev snap_in_version validate-manifest manifest.yaml`. *(Reference: `validate-manifest` documentation)*
3.  **Prepare test data:** Create a JSON file in `code/src/fixtures/` with a sample event payload for local testing.

#### Example Structure
This Snap-in has two main features: an automation triggered on new work item creation, and a `/comment_here` slash command. The automation's comment can be customized using input fields in the `manifest.yaml`.

### 2. Code
The code for the automation is in `4-sample-snap-in/code/src/functions/function_1/index.ts`. It's triggered by a `work_created` event and posts a comment constructed from the input fields.

```typescript
import { client } from "@devrev/typescript-sdk";

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

export const run = async (events: any[]) => {
  console.info('events', JSON.stringify(events), '\n\n\n');
  for (let event of events) {
    const resp = await handleEvent(event);
    console.log(JSON.stringify(resp.data));
  }
};

export default run;
```

### 3. Run
-   **Automation**: Create a new work item (e.g., an issue or a ticket).
-   **Slash Command**: In a discussion on a work item, type `/comment_here` and press Enter.

### 4. Verify
-   **Automation**: A new comment appears on the new work item's timeline.
-   **Slash Command**: A "Hello World" comment appears on the work item's timeline.

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
1.  **Event-driven automation**: The `function_1` is triggered by a `work_created` event.
2.  **Custom slash commands**: The `/comment_here` command allows users to trigger `function_2` on demand.
