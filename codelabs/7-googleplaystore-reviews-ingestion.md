# Codelab: Google Play Store Review Ingestion

## Overview
This Snap-in automates the process of managing Google Play Store reviews by fetching them, using a Large Language Model (LLM) to categorize them, and creating tickets in DevRev. This helps you to quickly identify and respond to bugs, feature requests, and other feedback from your users.

## Prerequisites
- Node.js and npm installed.
- A Fireworks AI API key. You can get one from the [Fireworks AI website](https://readme.fireworks.ai/docs/quickstart).

## Step-by-Step Guide

### 1. Setup
To use this Snap-in, you need to configure the following inputs during installation:
- **Application ID**: The Google Play ID of your application.
- **Default Part**: The part under which to create tickets.
- **Default Owner**: The default owner of the tickets.
- **Fireworks API Key**: Your Fireworks AI API key.
- **LLM Model to use**: The LLM model to use for review categorization.

### 2. Code
The `7-googleplaystore-reviews-ingestion/code/src/functions/process_playstore_reviews/index.ts` file contains the logic for fetching and processing the reviews. It uses the `google-play-scraper` library to get the reviews and then calls the Fireworks AI LLM to categorize them.

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
In a discussion, type `/playstore_reviews_process [number of reviews]` and press Enter. For example, to fetch the last 20 reviews, you would type `/playstore_reviews_process 20`.

### 4. Verify
After running the command, new tickets will be created in DevRev for each review. The tickets will be tagged as "bug", "feature_request", "question", or "feedback" based on the LLM's categorization.

## Manifest
The `manifest.yaml` file defines the slash command, the required inputs, and the tags used for categorization.

```yaml
version: "2"
name: "Google playstore reviews to Tickets"
description: "Creates tickets from Google playstore reviews and categorize them into one-of `bug`, `feedback`, `feature_request` or `question`."

# ... (service_account, keyrings, inputs) ...

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
This Snap-in demonstrates how to combine external data sources (Google Play Store), AI (Fireworks AI LLM), and DevRev automation to create a powerful workflow. The `/playstore_reviews_process` command triggers the `process_playstore_reviews` function, which orchestrates the process of fetching, categorizing, and creating tickets.

## Next Steps
- Use a different LLM for categorization by changing the `llm_model_to_use` input.
- Add more tags to the manifest and modify the LLM prompt to support more categories.
- Create an automation that runs the `/playstore_reviews_process` command on a schedule, so you don't have to do it manually.
