# Codelab: Giphy Snap-in Template

## Overview
This Snap-in brings the fun of Giphy to your DevRev discussions. It allows users to search for and post GIFs using a slash command, and it automatically posts a celebratory GIF when an issue is closed.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.
- A Giphy API key. You can get one from the [Giphy Developers](https://developers.giphy.com/) website.

## Step-by-Step Guide

### 1. Manifest
The `manifest.yaml` file defines the `/giphy` slash command, the automation for closed issues, and the required `giphy_api_key` input.

```yaml
version: "2"
name: "Giphy Snapin"
description: "Snap-In to search and post gif on DevRev Timeline"

service_account:
  display_name: Giphy Bot

event_sources:
  organization:
    - name: devrev-webhook
      description: Event coming from DevRev
      display_name: Devrev
      type: devrev-webhook
      config:
        event_types:
          - work_updated

inputs:
  organization:
    - name: giphy_api_key
      description: Giphy API key
      field_type: text

functions:
  - name: search_giphy
    description: Search a gif with given tag on giphy.com
  - name: render_giphy
    description: Render a given gif
  - name: publish_giphy_on_work_closed
    description: Published giphy

commands:
  - name: giphy
    namespace: devrev
    description: Create a new gif
    surfaces:
      - surface: discussions
        object_types:
          - issue
          - ticket
          - conversation
          - part
          - rev_user
          - rev_org
    usage_hint: "[text]"
    function: search_giphy

snap_kit_actions:
  - name: giphy
    description: Snap kit action for showing gif created using `giphy` command
    function: render_giphy

automations:
  - name: Add giphy when issue closed
    source: devrev-webhook
    event_types:
      - work_updated
    function: publish_giphy_on_work_closed
```

### 2. Code
The logic for the slash command is in `3-giphy-template/code/src/functions/search_giphy/index.ts`. It's triggered by `/giphy [search term]`, fetches a random GIF from Giphy, and displays it in an interactive Snap Kit card.

```typescript
export const run = async (events: any[]) => {
  console.log('Logging input events in search giphy');
  for (var event of events) {
    console.log(event);
  }

  const input = events[0];
  try {
    const urlWithApiKey = 'http://api.giphy.com/v1/gifs/random?api_key=' + input.input_data.global_values.giphy_api_key;
    const url = urlWithApiKey + '&tag=' + encodeURIComponent(input.payload.parameters);
    const resp = await fetch(url, { method: 'GET' });

    if (resp.ok) {
      console.log('Fetched gif successfully');
      const respData: any = await resp.json();
      await CreateGiphySnapKit(input, respData.data.images);
    } else {
      let body = await resp.text();
      console.log('Error while fetching gif: ', resp.status, body);
    }
  } catch (error) {
    console.log('Failed to fetch gif: ', error);
  }
};
```

### 3. Run and Verify
-   **Slash Command**: In a discussion, type `/giphy <your search term>`. A card will appear with a random GIF. You can "Send", "Shuffle", or "Cancel".
-   **Automation**: When you close an issue, a GIF with the tag "finished !" is automatically posted to the issue's timeline.
-   **Local Test**: You can test the `search_giphy` function locally, but you'll need to provide the `giphy_api_key` in your test fixture.

## Explanation
This Snap-in uses a slash command (`/giphy`) to call the `search_giphy` function, which fetches data from the external Giphy API and displays it in a Snap Kit card. It also includes an automation that listens for `work_updated` events and uses the `publish_giphy_on_work_closed` function to post a GIF when an issue is closed.

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
