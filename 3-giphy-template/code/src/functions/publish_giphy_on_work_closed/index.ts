/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import fetch from 'node-fetch';


async function CreateGiphySnapKit2(token: string, source_id: string, snap_in_id: string, imagesMeta: any) {
  console.log('Creating snap kit to render fetched gif');
  const url = 'https://api.devrev.ai/timeline-entries.create';
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': token,
        'content-type': 'application/json',
        'accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify({
        'object': source_id,
        'body': 'Giphy',
        'type': 'timeline_comment',
        'snap_kit_body': {
          'snap_in_id': snap_in_id,
          'snap_in_action_name': 'giphy',
          'body': {
            'snaps': [{
              'type': 'card',
              'title': {
                'text': "Hip hip hurray !",
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
  console.log('Logging input events in publish giphy');
  for (var event of events) {
    console.log(event);
  }
  let eventPayload = event.payload
  if (eventPayload.type == "work_updated") {
    let workItemType = eventPayload.work_updated.work.type
		let currentState = eventPayload.work_updated.work.state
		let oldState = eventPayload.work_updated.old_work.state
		let isEligible = (workItemType == "issue" && currentState == "closed" && oldState != "closed");
    if (!isEligible){
      return 
    }
  }
  let work_id = eventPayload.work_updated.work.id;
  let snap_in_id = event.context.snap_in_id;
  const input = events[0];
  try {
    const urlWithApiKey = 'http://api.giphy.com/v1/gifs/random?api_key=' + input.input_data.global_values.giphy_api_key;
    const url = urlWithApiKey + '&tag=' + encodeURIComponent("finished !");
    const resp = await fetch(url, { method: 'GET' });

    if (resp.ok) {
      console.log('Fetched gif successfully');
      const respData: any = await resp.json();
      await CreateGiphySnapKit2(input.context.secrets['service_account_token'], work_id, snap_in_id, respData.data.images);
    } else {
      let body = await resp.text();
      console.log('Error while fetching gif: ', resp.status, body);
    }
  } catch (error) {
    console.log('Failed to fetch gif: ', error);
  }
};

export default run;

