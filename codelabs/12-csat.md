# Codelab: CSAT Surveys

## Overview
This Snap-in creates and processes Customer Satisfaction (CSAT) surveys in DevRev. It automatically posts a survey when a conversation is closed and provides a `/survey` slash command to post surveys on demand, helping you gather user feedback and measure satisfaction.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.

## Step-by-Step Guide

### 1. Manifests
This example includes two manifest files:
-   **`manifest_conv.yaml`**: For CSAT surveys on conversations.
-   **`manifest_tkt.yaml`**: For CSAT surveys on tickets.

Both define the automation, slash command, and global inputs for the survey.

<details>
<summary>manifest_conv.yaml</summary>

```yaml
version: "1"
name: "CSAT on Conversation"
description: "Capture the satisfaction level for customer conversations on PLuG to enhance the customer experience."
service_account:
  display_name: "DevRev Bot"
event-sources:
  - name: devrev-webhook
    description: Event coming from DevRev
    display_name: DevRev
    type: devrev-webhook
    config:
      event_types:
        - conversation_updated
globals:
  - name: survey_channel
    description: The channel the survey is sent on.
    devrev_field_type: '[]enum'
    devrev_enum: ["PLuG", "Email"]
    default_value: ["PLuG", "Email"]
    ui:
      display_name: Survey channel
  - name: survey_text_header
    description: Introductory text posted on timeline when survey is populated.
    devrev_field_type: text
    default_value: "We would love to hear your feedback."
    ui:
      display_name: Survey introductory text
# ... additional globals ...
functions:
  - name: post_survey
    description: Create a survey comment on conversation closure.
  - name: process_response
    description: Process survey response for conversation survey response.
commands:
  - name: survey
    namespace: csat_on_conversation
# ... more command details ...
automations:
  - name: Add survey as a comment on resolved object
    source: devrev-webhook
# ... more automation details ...
snap_kit_actions:
  - name: survey
    description: Snap kit action for processing `survey` response
    function: process_response
```

</details>

<details>
<summary>manifest_tkt.yaml</summary>

```yaml
version: "1"
name: "CSAT on Ticket"
description: "Capture the satisfaction level for customer tickets on support portal to enhance the customer experience."
# ... (similar structure to conversation manifest) ...
```

</details>

### 2. Code
The Snap-in has two main functions:
-   `post_survey`: Triggered when a conversation is closed or by the `/survey` command. It creates and posts a Snap Kit card with the survey.
-   `process_response`: Triggered when a user clicks a rating. It submits the response, deletes the card, and posts a "thank you" message.

### 3. Run and Verify
-   **Automation**: Close a conversation to see a survey card appear.
-   **Slash Command**: In a discussion, type `/survey [chat/email] [question]` to post a survey.
-   After submitting a response, the card is replaced with a "thank you" message, and an internal note with the rating is added.

## Explanation
This Snap-in uses a Snap Kit card for an interactive survey. `post_survey` creates the card, and `process_response` handles the user's interaction. The response is stored using the `surveys.submit` API method.

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
