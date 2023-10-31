/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import { client } from "@devrev/typescript-sdk";

async function handleEvent(
  event: any,
) {
  const devrevPAT = event.context.secrets.service_account_token;
  const API_BASE = event.execution_metadata.devrev_endpoint;
  const devrevSDK = client.setup({
    endpoint: API_BASE,
    token: devrevPAT,
  })
  const workCreated = event.payload.work_created;
  const bodyComment = event.payload.body;
  const body = {
    object: workCreated,
    type: 'timeline_comment',
    body: bodyComment,
  }
  const response = await devrevSDK.timelineEntriesCreate(body as any);
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


