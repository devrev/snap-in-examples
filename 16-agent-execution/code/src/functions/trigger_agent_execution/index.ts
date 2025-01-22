/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import { client } from "@devrev/typescript-sdk";
import { postCall, getCall, generateQueryString } from "functions/common/api-utils";

async function handleEvent(
  event: any,
) {
  const devrevPAT = event.context.secrets.service_account_token;
  const API_BASE = event.execution_metadata.devrev_endpoint;
  const eventPayload = event.payload;
  const typeOfTimelineEntry = eventPayload.timeline_entry_created.entry.type;
  const commentBody = eventPayload.timeline_entry_created.entry.body;
  const objectID = eventPayload.timeline_entry_created.entry.object;
  const timelineEntryOwner = eventPayload.timeline_entry_created.entry.created_by.id;
  const userName = eventPayload.timeline_entry_created.entry.created_by.full_name;
  const snapInID = event.context.snap_in_id
  const devOID: string = event.context.dev_oid;
  const devOIDComponents = devOID.split(":");
  devOIDComponents[1] = "core";
  const agentIDPrefix = devOIDComponents.join(":");

  if (eventPayload.timeline_entry_created.entry.created_by.type !== 'dev_user' || objectID !== snapInID || typeOfTimelineEntry !== "timeline_comment") {
    return {
      "not_executed": "Invalid event"
    };
  }
  const devrevSDK = client.setup({
    endpoint: API_BASE,
    token: devrevPAT,
  })
  const eventSourceID: string = event.input_data.event_sources["devrev-event-source"]
  if (!(eventSourceID.includes("event_source/"))) {
    return {
      "not_executed": `Event Source ID invalid`
    };
  }
  const agentObjectId = event.input_data.global_values.agent_id;
  const agentID = `${agentIDPrefix}:ai_agent/${agentObjectId}`;
  let url = `${API_BASE}/internal/ai-agents.get?${generateQueryString({"id": agentID})}`
  const agent = await getCall(url, devrevPAT)
  if (agent === undefined || agent === null) {
    return {
      "not_executed": "Agent ID is not valid"
    };
  }

  const payload = {
    agent: agentID,
    event: {
      input_message: {
        message: commentBody,
      }
    },
    session_object: snapInID,
    context: {
      initial: `This message was from user ${userName}. You can mention this user in a message by doing something like this: Hey <${timelineEntryOwner}>!`
    },
    client_metadata: {
      agent_id: agentID,
      session_object: snapInID,
      user_name: userName,
      user_id: timelineEntryOwner,
    },
    event_source_target: {
      event_source: eventSourceID,
    }
  }
  url = `${API_BASE}/internal/ai-agents.events.execute-async`
  const response = await postCall(url, payload, devrevPAT);
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
