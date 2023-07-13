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

