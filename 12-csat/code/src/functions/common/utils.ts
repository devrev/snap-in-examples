import fetch from 'node-fetch';
import {
  PRIVATE,
  SurveysCreateAPIMethodPath,
  SurveysListAPIMethodPath,
  DefaultSurveyBody,
  ConversationsGetAPIMethodPath,
  WorksGetAPIMethodPath,
} from './constants';

const SnapKitActionID = 'rating';

const SnapInActionName = 'survey';

export async function doDevRevPostAPICall(apiBase: string, method: string, data: object, auth: string) {
  const url = apiBase + method;
  return fetch(url, {
    method: 'POST',
    headers: {
      'authorization': auth,
      'content-type': 'application/json',
      'accept': 'application/json, text/plain, */*',
    },
    body: JSON.stringify(data),
  });
}

export async function doDevRevGetAPICall(apiBase: string, method: string, auth: string, params: any) {
  const url: string = apiBase + method + '?' + new URLSearchParams(params);
  const headers = {
    Authorization: auth,
    Accept: 'application/json, text/plain, */*',
  };
  return fetch(url, {
    method: 'GET',
    headers: headers,
  });
}

interface snapKitButtonJson {
  action_id: string;
  action_type: string;
  style: string;
  text: {
    text: string;
    type: string;
  };
  type: string;
  value: string;
}

export function getSnapKitBody(objId: string, snap_in_id: string, survey_text_header: string, survey_text: string,
  surveyRespScale: string, visibility: string, members: string[], expires_at :string,
  label: string) {

  let buttonsText = getButtonsText(surveyRespScale);
  const buttons = generateButtonJson(buttonsText);

  let snapKitBody: { [key: string]: any } = {};

  snapKitBody.object = objId;
  snapKitBody.body = '';
  snapKitBody.body_type = 'snap_kit';
  snapKitBody.type = 'timeline_comment';
  snapKitBody.visibility = visibility;
  snapKitBody.snap_kit_body = {
    'snap_in_id': snap_in_id,
    'snap_in_action_name': SnapInActionName,
    'body': {
      'snaps': [
        {
          'elements': [
            {
              'elements': [
                {
                  'text': survey_text_header,
                  'type': 'plain_text',
                },
              ],
              'type': 'content',
            },
          ],
          'type': 'card',
        },
        {
          'elements': [
            {
              'elements': [
                {
                  'text': survey_text,
                  'type': 'plain_text',
                },
              ],
              'type': 'content',
            },
            {
              'block_id': '',
              'elements': buttons,
              'type': 'actions',
            },
          ],
          'type': 'card',
        },
      ],
    },
  };

  if (visibility == PRIVATE) {
    snapKitBody.private_to = members;
  }

  // Addition of comment expiry.
  snapKitBody.expires_at = expires_at;
  // Addition of customer-chart as a label to show snap-kit in customer-chat section.
  snapKitBody.labels = [label];

  return snapKitBody;
}

function parseCommaSeparatedString(input: string): string[] {
  // Remove leading and trailing white spaces
  const trimmedInput = input.trim();

  // Split the string by commas
  const stringArray = trimmedInput.split(',');

  // Trim each element and remove any empty strings
  return stringArray.map((str) => str.trim()).filter((str) => str !== '');
}

function getButtonsText(surveyRespScale: string) {
  let buttonsText = parseCommaSeparatedString(surveyRespScale);
  if (buttonsText.length != 5) {
    buttonsText = ['Great', 'Good', 'Average', 'Poor', 'Awful'];
    console.log('Buttons text length is not 5 falling back on default buttons', buttonsText);
  }
  return buttonsText;
}

function generateButtonJson(buttonsText: string[]): snapKitButtonJson[] {
  const result: snapKitButtonJson[] = [];
  const maxScale = 5;

  for (let i = 0; i < 5; i++) {
    result.push({
      action_id: SnapKitActionID,
      action_type: 'remote',
      style: 'secondary',
      text: {
        text: buttonsText[i],
        type: 'plain_text',
      },
      type: 'button',
      value: (maxScale - i).toString(),
    });
  }

  return result;
}


export function getAPIBase(executionMetadata: any) {
  return executionMetadata.devrev_endpoint;
}

export function getAPIDomain(url : string) {
  const pattern = 'http(s?)://api.(.*)';
  const matches = url.match(pattern);

  if (matches && matches.length >= 2) {
    return matches[2];
  }
  return '';
}

export function getCommandParameters(params : string) {
  const pattern = '^(email|chat) (.*)';
  const matches = params.match(pattern);
  if (matches && matches.length === 3) {
    return [matches[1], matches[2]];
  }
  return null;
}

export function getTimelineCommentBody(objId: string, bodyText :string, visibility: string, stakeholders: string[] | null,
  expiresAt: string | null, label: string | null) {

  let timelineBody: { [key: string]: any } = {};

  timelineBody.object = objId;
  timelineBody.body = bodyText;
  timelineBody.body_type = 'text';
  timelineBody.type = 'timeline_comment';
  timelineBody.visibility = visibility;
  if (stakeholders) {
    timelineBody.private_to = stakeholders;
  }
  if (expiresAt) {
    timelineBody.expires_at = expiresAt;
  }
  if (label) {
    timelineBody.labels = [label];
  }

  return timelineBody;
}

export function getSnapKitActionCreateBody(baseObj: string, snapIn: string, channel: string, dispatchedTo: string ) {
  return  {
    'base_object': baseObj,
    'snap_in': snapIn,
    'snap_kit_body': {},
    'snap_in_action_name': SnapInActionName,
    'channel': channel,
    'dispatched_to': dispatchedTo,
  };
}

export function getExpiryTimestamp(timeInMin : number) {
  const currentDateObj = new Date();
  const numberOfMlSeconds = currentDateObj.getTime();
  const addMlSeconds = timeInMin * 60 * 1000;
  return new Date(numberOfMlSeconds + addMlSeconds);
}

export async function getSurveyId(apiBase: string, auth: string, name: string) {
  try {
    console.log(`Listing surveys with name: [${name}]`);

    const filter = {
      'name': [name],
    };
    let resp = await doDevRevPostAPICall(apiBase, SurveysListAPIMethodPath, filter, auth);

    if (resp.ok) {
      console.log(`Successfully got list of surveys. Status ${resp.status}`);
      let respJsonBody = await resp.json();
      console.log('List of surveys.', respJsonBody);

      if (respJsonBody.surveys.length > 0) {
        return respJsonBody.surveys[0].id;
      }

      try {
        console.log('Creating default survey.');
        const resp = await doDevRevPostAPICall(apiBase, SurveysCreateAPIMethodPath, DefaultSurveyBody, auth);
        if (resp.ok) {
          console.log('Successfully created survey.');
          let respJsonBody = await resp.json();
          console.log('Created survey ', respJsonBody);
          return respJsonBody.survey.id;
        } else {
          let body = await resp.text();
          console.error('Error while creating default survey: ', resp.status, body);
          return null;
        }
      } catch (error) {
        console.error('Error: ', error);
      }
    } else {
      let body = await resp.text();
      console.error('Error while listing surveys: ', resp.status, body);
    }
  } catch (error) {
    console.error('Error: ', error);
  }
  return null;
}

export async function getWork(apiBase: string, auth: string, objId: string) {
  try {
    console.log(`Getting work information for ID: [${objId}].`);
    const resp = await doDevRevGetAPICall(apiBase, WorksGetAPIMethodPath, auth, { 'id' : objId });
    if (resp.ok) {
      console.log('Successfully got work information.');
      let respJsonBody = await resp.json();
      return respJsonBody.work;
    } else {
      let body = await resp.text();
      console.error('Error while getting work: ', resp.status, body);
      return null;
    }
  } catch (error) {
    console.error('Error: ', error);
    return null;
  }
}

export async function getConversation(apiBase: string, auth: string, objId: string) {
  try {
    console.log(`Getting work information for ID: [${objId}].`);
    const resp = await doDevRevGetAPICall(apiBase, ConversationsGetAPIMethodPath, auth, { 'id' : objId });
    if (resp.ok) {
      console.log('Successfully got conversation information.');
      let respJsonBody = await resp.json();
      return respJsonBody.conversation;
    } else {
      let body = await resp.text();
      console.error('Error while getting conversation: ', resp.status, body);
      return null;
    }
  } catch (error) {
    console.error('Error: ', error);
    return null;
  }
}