# Codelab: CSAT Surveys

## Overview
This Snap-in demonstrates how to create and process Customer Satisfaction (CSAT) surveys in DevRev. It automatically posts a survey when a conversation is closed, and it also provides a `/survey` slash command to post a survey on demand. This is a great way to gather feedback from your users and measure their satisfaction.

## Prerequisites
- Node.js and npm installed.

## Step-by-Step Guide

### 1. Setup
This Snap-in can be customized using the following global inputs:
- **Survey channel**: The channel on which to send the survey (e.g., PLuG, Email).
- **Survey introductory text**: The text to display above the survey.
- **Survey response scale**: The options to display on the survey scale (e.g., "Great,Good,Average,Poor,Awful").
- **Survey query**: The question to ask in the survey.
- **Survey response message**: The message to display after the user submits the survey.
- **Survey expires after**: The time in minutes after which the survey expires.

### 2. Code
This Snap-in has two main functions:
-   `post_survey`: This function is triggered when a conversation is closed or when a user runs the `/survey` command. It creates a Snap Kit card with the survey and posts it to the timeline.
-   `process_response`: This function is triggered when a user clicks on a rating in the survey. It submits the response to the DevRev API, deletes the survey card, and posts a "thank you" message.

### 3. Run
-   **Automation**: Close a conversation.
-   **Slash Command**: In a discussion on a conversation, type `/survey [chat/email] [survey question]` and press Enter.

### 4. Verify
-   After closing a conversation or running the `/survey` command, you should see a survey card in the timeline.
-   After submitting a response, the survey card should be replaced with a "thank you" message, and an internal note with your rating should be added to the timeline.

## Manifest
The `manifest_conv.yaml` file defines the automation, the slash command, and the global inputs for the survey.

```yaml
version: "1"

name: "CSAT on Conversation"
description: "Capture the satisfaction level for customer conversations on PLuG to enhance the customer experience."

# ... (service_account, event-sources, globals) ...

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

## Explanation
This Snap-in uses a Snap Kit card to create an interactive survey. The `post_survey` function creates the card, and the `process_response` function handles the user's interaction with the card. The survey response is stored in the DevRev System of Record (SOR) using the `surveys.submit` API method.

## Next Steps
- Customize the survey by changing the global inputs.
- Create a new survey for a different purpose, such as gathering feedback on a new feature.
- Use the `manifest_tkt.yaml` file to enable the survey for tickets as well as conversations.
