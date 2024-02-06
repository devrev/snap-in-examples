/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import { client, betaSDK } from "@devrev/typescript-sdk";

async function handleEvent(
  event: any,
) {
  const devrevPAT = event.context.secrets.service_account_token;
  const baseURL = event.execution_metadata.devrev_endpoint;
  const devrevSDK = client.setup({
    endpoint: baseURL,
    token: devrevPAT,
  })
  const workCreated = event.payload.work_created;
  const bodyComment = event.payload.body;
  const timelinePayload: betaSDK.TimelineEntriesCreateRequest = {
    body: bodyComment,
    body_type: betaSDK.TimelineCommentBodyType.Text,
    object: workCreated,
    type: betaSDK.TimelineEntriesCreateRequestType.TimelineComment,
    visibility: betaSDK.TimelineEntryVisibility.Internal,
  };
  const response = await devrevSDK.timelineEntriesCreate(timelinePayload);
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


