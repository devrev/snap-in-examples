/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import axios from 'axios';

type HTTPResponse = {
  success: boolean;
  errMessage: string;
  data: any;
};
async function postCallAPI(
  endpoint: string,
  payload: any,
  authKey: string,
) {
  try {
    const res: HTTPResponse = await axios.post(endpoint, payload, {
      headers: {
        Authorization: authKey,
        'Content-type': 'application/json',
      },
    });
    const data = res.data;
    return { success: true, errMessage: 'Data successfully fetched', data: data };
  } catch (error: any) {
    if (error.response) {
      return { success: false, errMessage: error.response.data, data: '' };
    } else if (error.request) {
      return { success: false, errMessage: error.request.data, data: '' };
    } else {
      return { success: false, errMessage: error, data: '' };
    }
  }
}

async function handleEvent(
  event: any,
) {
  const devrevPAT = event.context.secrets.service_account_token;
  const API_BASE = event.execution_metadata.devrev_endpoint;
  const workCreated = event.payload.work_created;
  const bodyComment = event.payload.body;
  const body = {
    object: workCreated,
    type: 'timeline_comment',
    body: bodyComment,
  }
  const response = await postCallAPI(API_BASE + '/timeline-entries.create', body, devrevPAT);
  if (!response.success) {
    console.log(response.errMessage);
    return response;
  }
  console.log(response.data);
  return response;

}

export const run = async (events: any[]) => {
  for (let event of events) {
    const resp = await handleEvent(event);
  }
};

export default run;


