/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import { client } from "@devrev/typescript-sdk";

async function handleEvent(
  event: any,
) {
  const devrevPAT = event.context.secrets.service_account_token;
  const API_BASE = event.execution_metadata.devrev_endpoint;
  const snapInID = event.context.snap_in_id
  const devOID: string = event.context.dev_oid;
  const devOIDComponents = devOID.split(":");
  devOIDComponents[1] = "core";
  const agentIDPrefix = devOIDComponents.join(":");
  const agentObjectId = event.input_data.global_values.agent_id;
  const agentID = `${agentIDPrefix}:ai_agent/${agentObjectId}`;
  const devrevSDK = client.setup({
    endpoint: API_BASE,
    token: devrevPAT,
  })
  const agentResponse = event.payload.ai_agent_response;
  if (agentResponse.agent_response === "progress") {
    return {
      "not_executed": `Ignoring progress message: ${JSON.stringify(agentResponse)}`
    };
  }
  const client_metadata = agentResponse.client_metadata
  if (client_metadata.agent_id !== agentID || client_metadata.session_object !== snapInID) {
    return {
      "not_executed": "Event has wrong agentID or is from wrong snap in"
    }
  }
  let comment: string = ""
  if (agentResponse.agent_response === "error") {
    comment = `I think I might be feeling sick, these are my symptoms: ${agentResponse.error.error}`;
  } else {
    comment = agentResponse.message;
  }
  const body = {
    object: snapInID,
    type: 'timeline_comment',
    body:  comment,
  }
  const response = await devrevSDK.timelineEntriesCreate(body as any);
  return response;
}

export const run = async (events: any[]) => {
  console.info('events', JSON.stringify(events), '\n\n\n');
  for (let event of events) {
    const resp = await handleEvent(event);
    console.log(JSON.stringify(resp));
  }
};

export default run;
