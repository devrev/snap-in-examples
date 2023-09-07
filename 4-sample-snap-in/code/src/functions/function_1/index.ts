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
  const workCreated = event.payload.work_created.work;
  const bodyComment = 'Hello World is printed on the work ' + workCreated.display_id + ' from the automation.';
  const body = {
    object: workCreated.id,
    type: 'timeline_comment',
    body:  bodyComment,
  }
  const response = await devrevSDK.timelineEntriesCreate(body as any);
  return response;

}

export const run = async (events: any[]) => {
  console.info('events', JSON.stringify(events), '\n\n\n');
  for (let event of events) {
    const resp = await handleEvent(event);
    console.log(JSON.stringify(resp.data));
  }
};

export default run;
