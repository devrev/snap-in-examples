# Codelab: Giphy Snap-in Template

## Overview
This Snap-in brings the fun of Giphy to your DevRev discussions. It allows users to search for and post GIFs using a slash command, and it automatically posts a celebratory GIF when an issue is closed.

## Prerequisites
- Node.js and npm installed.
- A Giphy API key. You can get one from the [Giphy Developers](https://developers.giphy.com/) website.

## Step-by-Step Guide

### 1. Setup
This Snap-in has two main features:
1.  A `/giphy` slash command that lets you search for GIFs in discussions.
2.  An automation that posts a GIF when an issue is closed.

To use this Snap-in, you need to provide your Giphy API key as an input during the Snap-in installation.

### 2. Code
The core logic for the slash command is in `3-giphy-template/code/src/functions/search_giphy/index.ts`. This function is triggered when a user types `/giphy [search term]`. It fetches a random GIF from Giphy based on the search term and displays it in an interactive Snap Kit card.

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

### 3. Run
-   **Slash Command**: In a discussion, type `/giphy <your search term>` and press Enter. A card will appear with a random GIF. You can then choose to "Send", "Shuffle" for a new GIF, or "Cancel".
-   **Automation**: When you close an issue, a GIF with the tag "finished !" will be automatically posted to the issue's timeline.

### 4. Verify
-   **Slash Command**: After using the `/giphy` command, you should see a Snap Kit card with a GIF.
-   **Automation**: After closing an issue, you should see a new timeline entry with a GIF.

## Manifest
The `manifest.yaml` file defines the slash command, the automation, and the required Giphy API key input.

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

## Explanation
This Snap-in demonstrates how to create interactive slash commands and automations. The `/giphy` command uses the `search_giphy` function to fetch data from an external API (Giphy) and display it in a Snap Kit card. The automation listens for `work_updated` events and uses the `publish_giphy_on_work_closed` function to post a GIF to the timeline when an issue is closed.

## Next Steps
-   Modify the `publish_giphy_on_work_closed` function to post different GIFs based on the type of work item being closed.
-   Create a new slash command to get the trending GIFs from Giphy.
-   Add error handling to provide better feedback to the user if the Giphy API call fails.
