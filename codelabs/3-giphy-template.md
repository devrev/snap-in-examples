# Codelab: Giphy Snap-in Template

## Overview
This Snap-in brings the fun of Giphy to your DevRev discussions. It allows users to search for and post GIFs using a slash command, and it automatically posts a celebratory GIF when an issue is closed.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.
- A Giphy API key from the [Giphy Developers](https://developers.giphy.com/) website.

## Step-by-Step Guide

### 1. Setup
This section guides you on setting up a new Snap-in project from scratch and explains the structure of this specific example.

#### Initializing a New Project
To create a new Snap-in, you'll use the DevRev CLI.

1.  **Initialize the project:** Run `devrev snap_in_version init <project_name>` to create a new project directory with a template structure. *(Reference: `init` documentation)*
2.  **Validate the manifest:** Before writing code, check the template `manifest.yaml` by running `devrev snap_in_version validate-manifest manifest.yaml`. *(Reference: `validate-manifest` documentation)*
3.  **Prepare test data:** Create a JSON file in `code/src/fixtures/` with a sample event payload for local testing.

#### Example Structure
This Snap-in has two main features: a `/giphy` slash command and an automation that posts a GIF when an issue is closed. You need to provide your Giphy API key as an input during installation.

### 2. Code
The core logic for the slash command is in `3-giphy-template/code/src/functions/search_giphy/index.ts`. It's triggered by `/giphy [search term]` and fetches a random GIF from Giphy.

```typescript
/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import fetch from 'node-fetch';


async function CreateGiphySnapKit(input: any, imagesMeta: any) {
  console.log('Creating snap kit to render fetched gif');
  const url = 'https://api.devrev.ai/timeline-entries.create';
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': input.context.secrets['service_account_token'],
        'content-type': 'application/json',
        'accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify({
        'object': input.payload.source_id,
        'body': 'Giphy',
        'type': 'timeline_comment',
        'snap_kit_body': {
          'snap_in_id': input.context.snap_in_id,
          'snap_in_action_name': 'giphy',
          'body': {
            'snaps': [{
              'type': 'card',
              'title': {
                'text': input.payload.parameters,
                'type': 'plain_text',
              },
              'elements': [
                {
                  'elements': [
                    {
                      'alt_text': 'Awesome GIF',
                      'image_url': imagesMeta.fixed_width_downsampled.url,
                      'block_id': imagesMeta.downsized.url,
                      'type': 'image',
                    },
                  ],
                  'type': 'content',
                },
                {
                  'direction': 'row',
                  'justify': 'center',
                  'type': 'actions',
                  'elements': [
                    {
                      'action_id': 'send',
                      'action_type': 'remote',
                      'style': 'primary',
                      'type': 'button',
                      'value': 'send',
                      'text': {
                        'text': 'Send',
                        'type': 'plain_text',
                      },
                    },
                    {
                      'action_id': 'shuffle',
                      'action_type': 'remote',
                      'style': 'primary',
                      'type': 'button',
                      'value': 'shuffle',
                      'text': {
                        'text': 'Shuffle',
                        'type': 'plain_text',
                      },
                    },
                    {
                      'action_id': 'cancel',
                      'action_type': 'remote',
                      'style': 'danger',
                      'type': 'button',
                      'value': 'cancel',
                      'text': {
                        'text': 'Cancel',
                        'type': 'plain_text',
                      },
                    },
                  ],
                },
              ],
            }],
          },
        },
      }),
    });

    if (resp.ok) {
      console.log('Giphy snap kit created successfully');
    } else {
      let body = await resp.text();
      console.log('Error while posting to timeline: ', resp.status, body);
    }
  } catch (error) {
    console.log('Failed to post to timeline: ', error);
  }
}

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

export default run;
```

### 3. Run
-   **Slash Command**: In a discussion, type `/giphy <your search term>` and press Enter.
-   **Automation**: When you close an issue, a celebratory GIF will be posted to the timeline.

### 4. Verify
-   **Slash Command**: A Snap Kit card with a GIF appears. You can then choose to "Send", "Shuffle" for a new GIF, or "Cancel".
-   **Automation**: A new timeline entry with a GIF appears after an issue is closed.

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
This Snap-in demonstrates interactive slash commands and automations. The `/giphy` command uses the `search_giphy` function to fetch data from an external API (Giphy) and display it in a Snap Kit card. The automation listens for `work_updated` events and uses the `publish_giphy_on_work_closed` function to post a GIF to the timeline when an issue is closed.
