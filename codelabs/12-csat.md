# Codelab: CSAT Surveys

## Overview
This Snap-in creates and processes Customer Satisfaction (CSAT) surveys in DevRev. It automatically posts a survey when a conversation is closed and provides a `/survey` slash command to post surveys on demand. This is a great way to gather feedback from your users and measure their satisfaction.

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
This Snap-in can be customized using global inputs such as survey channel, introductory text, response scale, and more.

### 2. Code
The Snap-in has two main functions:
-   `post_survey`: Triggered by conversation closure or a `/survey` command, it creates and posts a Snap Kit survey card.
-   `process_response`: Triggered by a user's rating, it submits the response, deletes the card, and posts a "thank you" message.

### 3. Run
-   **Automation**: Close a conversation.
-   **Slash Command**: In a discussion, type `/survey [chat/email] [survey question]` and press Enter.

### 4. Verify
-   A survey card appears in the timeline.
-   After a response is submitted, the card is replaced with a "thank you" message, and an internal note with the rating is added.

## Manifests
This example includes two manifest files: `manifest_conv.yaml` for conversations and `manifest_tkt.yaml` for tickets.

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
  - name: survey_resp_scale
    description: Response values to be displayed on the survey scale (high to low).
    devrev_field_type: text
    default_value: "Great,Good,Average,Poor,Awful"
    ui:
      display_name: Survey response scale
  - name: survey_text
    description: Text posted on timeline when survey is populated.
    devrev_field_type: text
    default_value: "How satisfied were you with this chat?"
    ui:
      display_name: Survey query
  - name: survey_resp_text
    description: Text posted on timeline when survey response is submitted.
    devrev_field_type: text
    default_value: "Thank you for sharing your valuable feedback with us! Your insights are greatly appreciated."
    ui:
      display_name: Survey response message
  - name: survey_expires_after
    description: "Indicates the time (in minutes) for which the survey remains active (minimum 1 minute)"
    devrev_field_type: int
    default_value: 1440
    ui:
      display_name: Survey expires after

functions:
  - name: post_survey
    description: Create a survey comment on conversation closure.
  - name: process_response
    description: Process survey response for conversation survey response.

commands:
  - name: survey
    namespace: csat_on_conversation
    description: Capture the customer satisfaction level with ongoing interaction.
    surfaces:
      - surface: discussions
        object_types:
          - conversation
    usage_hint: "[chat/email] [survey question]"
    function: post_survey

automations:
  - name: Add survey as a comment on resolved object
    source: devrev-webhook
    event_types:
      - conversation_updated
    function: post_survey

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

service_account:
  display_name: "DevRev Bot"

event-sources:
  - name: devrev-webhook
    description: Event coming from DevRev
    display_name: DevRev
    type: devrev-webhook
    config:
      event_types:
        - work_updated

globals:
  - name: survey_channel
    description: The channel the survey is sent on.
    devrev_field_type: '[]enum'
    devrev_enum: ["Portal", "Email"]
    default_value: ["Portal", "Email"]
    ui:
      display_name: Survey channel
  - name: survey_text_header
    description: Introductory text posted when survey is populated.
    devrev_field_type: text
    default_value: "We would love to hear your feedback."
    ui:
      display_name: Survey introductory text
  - name: survey_resp_scale
    description: Response values to be displayed on the survey scale (high to low).
    devrev_field_type: text
    default_value: "Great,Good,Average,Poor,Awful"
    ui:
      display_name: Survey response scale
  - name: survey_text
    description: Text posted when survey is populated.
    devrev_field_type: text
    default_value: "How satisfied were you with the support experience?"
    ui:
      display_name: Survey query
  - name: survey_resp_text
    description: Text posted when survey response is submitted.
    devrev_field_type: text
    default_value: "Thank you for sharing your valuable feedback with us! Your insights are greatly appreciated."
    ui:
      display_name: Survey response message
  - name: survey_expires_after
    description: "Indicates the time (in minutes) for which the survey remains active (minimum 1 minute)"
    devrev_field_type: int
    default_value: 1440
    ui:
      display_name: Survey expires after

functions:
  - name: post_survey
    description: Create a survey comment on ticket closure.
  - name: process_response
    description: Process survey response on ticket survey response.

commands:
  - name: survey
    namespace: csat_on_ticket
    description: Capture the customer satisfaction level with ongoing interaction.
    surfaces:
      - surface: discussions
        object_types:
          - ticket
    usage_hint: "[chat/email] [survey question]"
    function: post_survey

automations:
  - name: Add survey as a comment on resolved object
    source: devrev-webhook
    event_types:
      - work_updated
    function: post_survey

snap_kit_actions:
  - name: survey
    description: Snap kit action for processing `survey` response
    function: process_response
```
</details>

## Explanation
This Snap-in uses a Snap Kit card to create an interactive survey. The `post_survey` function creates the card, and `process_response` handles user interaction. The survey response is stored in DevRev using the `surveys.submit` API method.
