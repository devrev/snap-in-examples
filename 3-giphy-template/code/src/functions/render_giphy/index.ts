/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import fetch from 'node-fetch';

async function updateTimelineEntry(input: any, imageTag: string, imagesMeta: any) {
  console.log('Updating timeline entry to render new gif');
  const url = 'https://api.devrev.ai/timeline-entries.update';
  try {
    const body = JSON.stringify({
      'id': input.payload.context.entry_id,
      'type': 'timeline_comment',
      'body': 'Giphy',
      'snap_kit_body': {
        'snap_in_id': input.payload.parent_id,
        'snap_in_action_name': 'giphy',
        'body': {
          'snaps': [{
            'type': 'card',
            'title': {
              'text': imageTag,
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
    });
    console.log('Update request: ', body);
  
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': input.context.secrets['service_account_token'],
        'content-type': 'application/json',
        'accept': 'application/json, text/plain, */*',
      },
      body: body,
    });
  
    if (resp.ok) {
      console.log('Gif updated successfully');
    } else {
      let body = await resp.text();
      console.log('Error while updating timeline with new gif: ', resp.status, body);
    }
  } catch (error) {
    console.log('Failed to update timeline: ', error);
  }
}
  
async function DeleteTimelineEntry(input: any) {
  console.log('Deleting gif timeline entry');
  const url = 'https://api.devrev.ai/internal/timeline-entries.delete';
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': input.context.secrets['service_account_token'],
        'content-type': 'application/json',
        'accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify({
        'id': input.payload.context.entry_id,
      }),
    });
  
    if (resp.ok) {
      console.log('Deleted gif successfully');
    } else {
      let body = await resp.text();
      console.log('Error while deleting gif: ', resp.status, body);
    }
  } catch (error) {
    console.log('Failed to delete timeline entry: ', error);
  }
}
  
async function PostGifToTimeline(input: any, imageTag: string) {
  console.log('Posting gif to timeline');
  const url = 'https://api.devrev.ai/timeline-entries.create';
  // TODO: This seems very unreadable and hacky?
  const curr_high_res = input.payload.body.snaps[0].elements[0].elements[0].block_id;
  try {
    const body = JSON.stringify({
      'object': input.payload.context.parent_core_object_id,
      'type': 'timeline_comment',
      'body': 'Giphy',
      'snap_kit_body': {
        'snap_in_id': input.payload.parent_id,
        'snap_in_action_name': 'giphy',
        'body': {
          'snaps': [{
            'type': 'card',
            'title': {
              'text': imageTag,
              'type': 'plain_text',
            },
            'elements': [
              {
                'elements': [
                  {
                    'alt_text': 'Awesome GIF',
                    'image_url': curr_high_res,
                    'type': 'image',
                  },
                ],
                'type': 'content',
              }],
          }],
        },
      },
    });
    console.log('Post request: ', body);
  
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': input.context.secrets['service_account_token'],
        'content-type': 'application/json',
        'accept': 'application/json, text/plain, */*',
      },
      body: body,
    });
  
    if (resp.ok) {
      console.log('Gif posted successfully');
    } else {
      let body = await resp.text();
      console.log('Error while posting gif to timeline: ', resp.status, body);
    }
  } catch (error) {
    console.log('Failed to post gif to timeline: ', error);
  }
}
  

export const run = async (events: any[]) => {
  console.log('Logging input events in render_giphy');
  for (var event of events) {
    console.log(event);
  }

  const input = events[0];
  const action = input.payload.action.id;
  console.log('Current action: ', action);
  if (action === 'cancel') {
    console.log('Deleting gif');
    await DeleteTimelineEntry(input);
    return;
  }

  const tag: string = input.payload.body.snaps[0].title.text;
  if (action === 'send') {
    console.log('Posting gif');
    await DeleteTimelineEntry(input);
    await PostGifToTimeline(input, tag);
    return;
  }

  console.log('Shuffling gif');
  let respData: any = {};
  try {
    // Fetch the gif metadata.
    const urlWithApiKey = 'http://api.giphy.com/v1/gifs/random?api_key=' + input.input_data.global_values.giphy_api_key;
    const url = urlWithApiKey + '&tag=' + encodeURIComponent(tag);
    const resp = await fetch(url, { method: 'GET' });

    if (resp.ok) {
      console.log('Fetched gif successfully');
      respData = await resp.json();
    } else {
      let body = await resp.text();
      console.log('Error while fetching gif: ', resp.status, body);
      return;
    }
  } catch (error) {
    console.log('Failed to fetch gif: ', error);
    return;
  }

  await updateTimelineEntry(input, tag, respData.data.images);
};

export default run;
