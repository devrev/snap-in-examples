import fetch from 'node-fetch';
import {
  PRIVATE,
  SurveysCreateAPIMethodPath,
  SurveysListAPIMethodPath,
  DefaultSurveyBody,
  ConversationsGetAPIMethodPath,
  WorksGetAPIMethodPath,
} from './constants';

export const SurveysEmailCsatResponsePath = '/survey-response';
const SnapKitActionID = 'rating';

const SnapInActionName = 'survey';
export const dispatchIdAndRatingDeliminator = '::';

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
  dispatchId: string, label: string) {

  let buttonsText = getButtonsText(surveyRespScale);
  const buttons = generateButtonJson(buttonsText, dispatchId);

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

function generateButtonJson(buttonsText: string[], dispatchId: string): snapKitButtonJson[] {
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
      value: `${dispatchId}${dispatchIdAndRatingDeliminator}` + (maxScale - i).toString(),
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

export function getEmailBody(subject: string, sender: string, recipients: string[], htmlBodyStr: string) {
  return  {
    'email': {
      'subject': subject,
      'body': htmlBodyStr,
      'recipients': recipients,
      'sender': sender,
    },
  };
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

// TODO: isTicket, ticketTitle, ticketDescription are the fields which are added for the tiket only. Ideally this is not scalable. But as
// currently there is no support for HTML given snap-kit this is stop gap solution.
export function getHtmlSurveyString(apiDomain:string, dispatchId: string, emailId: string, surveyTextHeader: string,
  surveyText: string, surveyRespScale: string, isTicket: boolean,
  ticketDisplayId: string, ticketTitle: string, ticketDescription: string): string {

  let buttonsText = getButtonsText(surveyRespScale);

  const apiPrefix = 'https://support.';
  const hoverText = 'Select this rating';

  const rating1 = `${apiPrefix}${apiDomain}${SurveysEmailCsatResponsePath}?uuid=${dispatchId}&id=${SnapKitActionID}&value=${dispatchId}${dispatchIdAndRatingDeliminator}1`;
  const rating2 = `${apiPrefix}${apiDomain}${SurveysEmailCsatResponsePath}?uuid=${dispatchId}&id=${SnapKitActionID}&value=${dispatchId}${dispatchIdAndRatingDeliminator}2`;
  const rating3 = `${apiPrefix}${apiDomain}${SurveysEmailCsatResponsePath}?uuid=${dispatchId}&id=${SnapKitActionID}&value=${dispatchId}${dispatchIdAndRatingDeliminator}3`;
  const rating4 = `${apiPrefix}${apiDomain}${SurveysEmailCsatResponsePath}?uuid=${dispatchId}&id=${SnapKitActionID}&value=${dispatchId}${dispatchIdAndRatingDeliminator}4`;
  const rating5 = `${apiPrefix}${apiDomain}${SurveysEmailCsatResponsePath}?uuid=${dispatchId}&id=${SnapKitActionID}&value=${dispatchId}${dispatchIdAndRatingDeliminator}5`;

  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <html lang="en">
    
    <head data-id="__react-email-head"></head>
    
    <body data-id="__react-email-body" style="table-layout:fixed;font-family:helvetica;background-color:#eeeeee;border:1px solid #EEEFF1">
    <table align="center" width="100%" data-id="__react-email-container" role="presentation" cellSpacing="0" cellPadding="0" border="0" style="max-width:40rem;margin-left:auto;margin-right:auto">
        <tbody>
        <tr style="width:100%">
            <td>
                <table align="center" width="100%" data-id="react-email-section" style="background-color:#343DEA;border-radius:12px 12px 0px 0px;max-width:40rem;padding:1.5rem;height:8rem" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                    <tbody>
                    <tr>
                        <td></td>
                        <td data-id="__react-email-column" style="width:75%">
                            <p data-id="react-email-text" style="font-size:2.25rem;line-height:2.5rem;margin:16px 0;color:rgb(255,255,255);letter-spacing:-0.025em">Your Feedback Matters!</p>
                        </td>
                        <td data-id="__react-email-column"><img data-id="react-email-img" alt="image" src="https://s3.us-west-1.amazonaws.com/dev.devrev.ai/Assets/NotificationsEmail/surve_header2.png" style="display:block;outline:none;border:none;text-decoration:none;height:4rem;float:right" /></td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>
        </tbody>
    </table>
    <table align="center" width="100%" data-id="react-email-section" style="color:#202020;border-top:1px solid #EEEFF1;background-color:#F9FAFA;max-width:40rem;padding:2rem;font-size:0.875rem;line-height:1.25rem;border-width:1px;border-color:rgb(238,239,241)" border="0" cellPadding="0" cellSpacing="0" role="presentation">
        <tbody>
        <tr>
            <td>
                <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">Hi,</p>
                <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">${surveyTextHeader}</p>
                <div style="${!isTicket && 'display:none'};padding:1rem;background-color:rgb(255,255,255);border-width:1px;border-color:rgb(238,239,241);border-style:solid;border-radius:0.75rem;gap:0.25rem">
                  <div style="display:flex;align-items:center;">
                    <div style="color:rgb(183,143,31);border-width:1px;border-color:#E3B9451A;background-color:#E3B9451A;padding:0.25rem;border-radius:0.375rem;font-size:0.75rem;line-height:1rem;margin-right:0.5rem">${ticketDisplayId}</div>
                    <div style="font-size:0.875rem;line-height:1.25rem;color:rgb(84,86,99)">${ticketTitle}</div>
                  </div>
                  <div style="font-size:0.875rem;line-height:1.25rem;color:rgb(113,115,132)">${ticketDescription}</div>
                </div>
            </td>
        </tr>
        </tbody>
    </table>
    <table align="center" width="100%" data-id="react-email-section" style="color:#202020;border-bottom:1px solid #EEEFF1;background-color:#FFF;max-width:40rem;padding:2rem;padding-top:1rem;font-size:0.875rem;line-height:1.25rem;border-width:1px;border-color:rgb(238,239,241)" border="0" cellPadding="0" cellSpacing="0" role="presentation">
        <tbody>
        <tr>
            <td>
                <p class="" data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">${surveyText}</p>
                <table align="center" width="100%" data-id="react-email-section" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="display:block">
                    <tbody>
                    <tr>
                        <td>
                            <table align="center" width="100%" data-id="react-email-section" style="border-radius:8px;border:1px solid #E4E5E7;background-color:#F4F4F6;margin-top:0.5rem;margin-bottom:0.5rem" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                                <tbody>
                                <tr>
                                    <td><a title="${hoverText}" href="${rating5}" data-id="react-email-button" target="_blank" style="line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:0px 0px;width:10rem;padding-left:1rem;padding-top:0.375rem;padding-bottom:0.375rem;color:rgb(66,67,77)"><span></span><span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:0">${buttonsText[0]}</span><span></span></a></td>
                                </tr>
                                </tbody>
                            </table>
                            <table align="center" width="100%" data-id="react-email-section" style="border-radius:8px;border:1px solid #E4E5E7;background-color:#F4F4F6;margin-top:0.5rem;margin-bottom:0.5rem" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                                <tbody>
                                <tr>
                                    <td><a title="${hoverText}" href="${rating4}" data-id="react-email-button" target="_blank" style="line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:0px 0px;width:10rem;padding-left:1rem;padding-top:0.375rem;padding-bottom:0.375rem;color:rgb(66,67,77)"><span></span><span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:0">${buttonsText[1]}</span><span></span></a></td>
                                </tr>
                                </tbody>
                            </table>
                            <table align="center" width="100%" data-id="react-email-section" style="border-radius:8px;border:1px solid #E4E5E7;background-color:#F4F4F6;margin-top:0.5rem;margin-bottom:0.5rem" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                                <tbody>
                                <tr>
                                    <td><a title="${hoverText}" href="${rating3}" data-id="react-email-button" target="_blank" style="line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:0px 0px;width:10rem;padding-left:1rem;padding-top:0.375rem;padding-bottom:0.375rem;color:rgb(66,67,77)"><span></span><span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:0">${buttonsText[2]}</span><span></span></a></td>
                                </tr>
                                </tbody>
                            </table>
                            <table align="center" width="100%" data-id="react-email-section" style="border-radius:8px;border:1px solid #E4E5E7;background-color:#F4F4F6;margin-top:0.5rem;margin-bottom:0.5rem" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                                <tbody>
                                <tr>
                                    <td><a title="${hoverText}" href="${rating2}" data-id="react-email-button" target="_blank" style="line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:0px 0px;width:10rem;padding-left:1rem;padding-top:0.375rem;padding-bottom:0.375rem;color:rgb(66,67,77)"><span></span><span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:0">${buttonsText[3]}</span><span></span></a></td>
                                </tr>
                                </tbody>
                            </table>
                            <table align="center" width="100%" data-id="react-email-section" style="border-radius:8px;border:1px solid #E4E5E7;background-color:#F4F4F6;margin-top:0.5rem;margin-bottom:0.5rem" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                                <tbody>
                                <tr>
                                    <td><a title="${hoverText}" href="${rating1}" data-id="react-email-button" target="_blank" style="line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:0px 0px;width:10rem;padding-left:1rem;padding-top:0.375rem;padding-bottom:0.375rem;color:rgb(66,67,77)"><span></span><span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:0">${buttonsText[4]}</span><span></span></a></td>
                                </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>
        </tbody>
    </table>
    <table align="center" width="100%" data-id="react-email-section" style="background-color:#F9FAFA;color:rgba(0, 0, 0, 0.50);border-radius:0px 0px 12px 12px;max-width:40rem;padding:2rem;border-width:1px;border-color:rgb(238,239,241)" border="0" cellPadding="0" cellSpacing="0" role="presentation">
        <tbody>
        <tr>
            <td>
                <table align="center" width="100%" data-id="react-email-section" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="align-self:stretch;font-size:0.75rem;line-height:1rem">
                    <tbody>
                    <tr>
                        <td>
                            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">Your response will be recorded. We&#x27;ll use it only for the purpose of improving our services!</p>
                            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">This email was sent to ${emailId}. If you&#x27;re not them, please ignore it.</p>
                        </td>
                    </tr>
                    </tbody>
                </table>
                <table align="center" width="100%" data-id="react-email-section" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="padding:1.5rem">
                    <tbody>
                    <tr>
                        <td></td>
                    </tr>
                    </tbody>
                </table>
            </td>
        </tr>
        </tbody>
    </table>
    </body>
    
    </html>
    `;
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