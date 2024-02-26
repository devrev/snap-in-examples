/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import { client } from '@devrev/typescript-sdk';
import {
  // TimelineCommentBodyType,
  TimelineEntriesCreateRequestType,
} from '@devrev/typescript-sdk/dist/auto-generated/beta/beta-devrev-sdk';
import { AxiosError } from 'axios';
/*
  Update the part of the work-item with the one chosen by the user.
*/

function objectToMap(obj: { [key: string]: any }): Map<string, any> {
  const map = new Map<string, any>();
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      map.set(key, obj[key]);
    }
  }
  return map;
}

function validateEvent(event: any): boolean {
  if (event.payload.type === 'work_created') {
    return true;
  } else if (event.payload.type === 'work_updated') {
    if (event.payload.work_updated.work.owned_by[0].id !== event.payload.work_updated.old_work.owned_by[0].id) {
      return true;
    }
  }
  return false;
}

async function engine(event: any) {
  const devrevPAT = event.context.secrets.service_account_token;
  const API_BASE = event.execution_metadata.devrev_endpoint;
  const betaClient = client.setupBeta({
    endpoint: API_BASE,
    token: devrevPAT,
  });

  if (!validateEvent(event)) return;
  const eventType = event.payload.type;
  const work = event.payload[eventType].work;
  const workOwner = work.owned_by[0].id;
  const snapInID = event.context.snap_in_id;
  // get the creator's snap-in resources
  try {
    const userResourcesResponse = await betaClient.snapInsResources({
      id: snapInID,
      user: workOwner,
    });
    const userResourcesData = userResourcesResponse.data;
    if (userResourcesData.inputs) {
      const inputs = userResourcesData.inputs;
      const inputsMap = objectToMap(inputs);
      if (inputsMap.get('on_vacation') == true) {
        const vacation_message = inputsMap.get('vacation_message') as string;
        if (vacation_message && vacation_message.length > 0) {
          await betaClient.timelineEntriesCreate({
            body: vacation_message,
            type: TimelineEntriesCreateRequestType.TimelineComment,
            object: work.id,
          });
          console.log('Vacation message added to work item.');
        }
      } else {
        console.log("User isn't on vacation.", inputs);
      }
    }
  } catch (error: any) {
    // check if the error is an AxiosError
    if (error.isAxiosError) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        console.log("User hasn't set up their snap-in resources yet.");
      } else {
        console.error('Error fetching user resources:', axiosError);
      }
    }
    return;
  }
}

export const run = async (events: any[]) => {
  for (const event of events) {
    console.info('Event: ', event);
    await engine(event);
  }
};

export default run;
