# Codelab: Google Play Store Review Ingestion

## Overview
This Snap-in automates managing Google Play Store reviews by fetching them, using a Large Language Model (LLM) to categorize them, and creating tickets in DevRev. This helps you quickly identify and respond to bugs, feature requests, and other user feedback.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.
- A Fireworks AI API key from the [Fireworks AI website](https://readme.fireworks.ai/docs/quickstart).

## Step-by-Step Guide

### 1. Setup
This section guides you on setting up a new Snap-in project from scratch and explains the structure of this specific example.

#### Initializing a New Project
To create a new Snap-in, you'll use the DevRev CLI.

1.  **Initialize the project:** Run `devrev snap_in_version init <project_name>` to create a new project directory with a template structure. *(Reference: `init` documentation)*
2.  **Validate the manifest:** Before writing code, check the template `manifest.yaml` by running `devrev snap_in_version validate-manifest manifest.yaml`. *(Reference: `validate-manifest` documentation)*
3.  **Prepare test data:** Create a JSON file in `code/src/fixtures/` with a sample event payload for local testing.

#### Example Structure
To use this Snap-in, you need to configure inputs like your Application ID, default part, default owner, Fireworks API Key, and the LLM model to use.

### 2. Code
The `7-googleplaystore-reviews-ingestion/code/src/functions/process_playstore_reviews/index.ts` file contains the logic for fetching and processing the reviews. It uses the `google-play-scraper` library and calls the Fireworks AI LLM to categorize them.

```typescript
// Simplified for brevity
export const run = async (events: any[]) => {
  for (const event of events) {
    // ... (setup code) ...

    // Call google playstore scraper to fetch those number of reviews.
    let getReviewsResponse:any = await gplay.reviews({
      appId: inputs['app_id'],
      sort: gplay.sort.RATING,
      num: numReviews,
      throttle: 10,
    });
    let reviews:gplay.IReviewsItem[] = getReviewsResponse.data;

    // For each review, create a ticket in DevRev.
    for(const review of reviews) {
      // ... (LLM categorization logic) ...

      // Create a ticket with title as review title and description as review text.
      const createTicketResp = await apiUtil.createTicket({
        title: reviewTitle,
        tags: [{id: tags[inferredCategory].id}],
        body: reviewText,
        type: publicSDK.WorkType.Ticket,
        owned_by: [inputs['default_owner_id']],
        applies_to_part: inputs['default_part_id'],
      });
    }
  }
};
```

### 3. Run
In a discussion, type `/playstore_reviews_process [number of reviews]` and press Enter. For example, `/playstore_reviews_process 20`.

### 4. Verify
After running the command, new tickets will be created in DevRev for each review, tagged as "bug", "feature_request", "question", or "feedback" based on the LLM's categorization.

## Manifest
The `manifest.yaml` file defines the slash command, the required inputs, and the tags used for categorization.

```yaml
version: "2"
name: "Google playstore reviews to Tickets"
description: "Creates tickets from Google playstore reviews and categorize them into one-of `bug`, `feedback`, `feature_request` or `question`."

service_account:
  display_name: Google Playstore Reviews Snap-in

keyrings:
  organization:
    - name: fireworks_api_key
      description: API Key for Fireworks, follow https://readme.fireworks.ai/docs/quickstart to get one.
      types:
        - snap_in_secret
      display_name: Fireworks API Key

inputs:
  organization:
    - name: app_id
      description: "The Google Play id of the application (the ?id= parameter on the url)."
      field_type: text
      is_required: true
      default_value: ""
      ui:
        display_name: Application ID
    - name: default_part_id
      description: "Default part under which to create tickets."
      field_type: id
      id_type:
        - product
        - capability
        - feature
        - enhancement
      is_required: true
      default_value: "don:core:dvrv-us-1:devo/xxx:product/xxx"
      ui:
        display_name: Default Part
    - name: default_owner_id
      description: "Default owner of the tickets."
      field_type: id
      id_type:
        - devu
      is_required: true
      default_value: "don:identity:dvrv-us-1:devo/xxx:devu/xxx"
      ui:
        display_name: Default Owner
    - name: llm_model_to_use
      description: "Which LLM model to use for the review categorization. Not all might work perfectly, generally prefer a larger model with >= 7B params"
      field_type: enum
      allowed_values:
        - qwen-72b-chat
        - elyza-japanese-llama-2-7b-fast-instruct
        - firellava-13b
        - japanese-llava-mistral-7b
        - japanese-stablelm-instruct-beta-70b
        - japanese-stablelm-instruct-gamma-7b
        - japanese-stable-vlm
        - llamaguard-7b
        - llama-v2-13b
        - llama-v2-13b-chat
        - llama-v2-13b-code
        - llama-v2-13b-code-instruct
        - llama-v2-34b-code
        - llama-v2-34b-code-instruct
        - llama-v2-70b
        - llama-v2-70b-chat
        - llama-v2-7b
        - llama-v2-7b-chat
        - llava-codellama-34b
        - llava-v15-13b-fireworks
        - mistral-7b
        - mistral-7b-instruct-4k
        - mixtral-8x7b
        - mixtral-8x7b-instruct
        - qwen-14b-chat
        - qwen-1-8b-chat
        - stablecode
        - stablelm-zephyr-3b
        - starcoder-16b-w8a16
        - starcoder-7b-w8a16
        - yi-34b-200k-capybara
        - yi-6b
        - zephyr-7b-beta
      is_required: true
      default_value: "mixtral-8x7b-instruct"
      ui:
        display_name: LLM Model to use.


tags:
  - name: bug
    description: "This is a bug"
  - name: feature_request
    description: "This is a feature request"
  - name: question
    description: "This is a question"
  - name: feedback
    description: "This is a feedback"
  - name: failed_to_infer_category
    description: "Failed to infer category"


commands:
  - name: playstore_reviews_process
    namespace: devrev
    description: Fetches reviews from Google Playstore and creates tickets
    surfaces:
      - surface: discussions
        object_types:
          - snap_in
    usage_hint: "/playstore_reviews_process [number of reviews to fetch and process]"
    function: process_playstore_reviews


functions:
  - name: process_playstore_reviews
    description: Fetches reviews from Google Playstore and creates tickets
```

## Explanation
This Snap-in combines external data (Google Play Store), AI (Fireworks AI LLM), and DevRev automation. The `/playstore_reviews_process` command triggers the `process_playstore_reviews` function, which orchestrates fetching, categorizing, and creating tickets.
