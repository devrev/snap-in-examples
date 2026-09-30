import {
  doDevRevPostAPICall,
  getAPIBase, getSurveyId,
  getTimelineCommentBody,
  getExpiryTimestamp,
  dispatchIdAndRatingDeliminator,
} from '../common/utils';

import {
  EMAIL, PLUG, PORTAL, DefaultCSATName, INTERNAL, PRIVATE,
  TimelineEntriesCreateAPIMethodPath,
  TimelineEntriesDeleteAPIMethodPath,
  SurveysSubmitAPIMethodPath,
  TimelineLabelDisplayCustomerChat,
} from '../common/constants';



async function ProcessSurveyResponse(event: any) {
  const payload = event.payload;
  const executionMetadata = event.execution_metadata;
  const apiBase = getAPIBase(executionMetadata);
  console.log('Processing survey response', payload);
  const auth = event.context.secrets.service_account_token;
  const actorAuth = event.context.secrets.actor_session_token;
  const actorId = payload.actor_id;
  const dispatchIdAndRating  = splitDispatchIdAndRating(payload.action.value);
  let dispatchId = '';
  let rating = 0;
  let privateToRev = [actorId];
  const surveyRespText = event.input_data.global_values.survey_resp_text;
  let sourceChannel = getSourceChannel(payload);
  // Currently hardcoded with 30minutes
  const commentExpireAt = getExpiryTimestamp(30).toISOString();

  if (dispatchIdAndRating) {
    [dispatchId, rating] = dispatchIdAndRating;

  } else {
    console.log('Invalid dispatch ID and Rating. returning...');
    return;
  }

  let parentObjId = '';
  if (payload.context.hasOwnProperty('parent_core_object_id')) {
    parentObjId = payload.context.parent_core_object_id;
  }
  if (payload.context.hasOwnProperty('object_id')) {
    parentObjId = payload.context.object_id;
  }

  const surveyId = await getSurveyId(apiBase, auth, DefaultCSATName);
  if (surveyId == null) {
    console.log('SurveyId is null cannot proceed with processing. returning...');
    return;
  }
  console.log(`SurveyId: [${surveyId}]`);

  // STEP-1 Submit survey for database storage.
  const postBodyForSurveyResp = getSurveyResponseBody(surveyId, parentObjId, rating, dispatchId, sourceChannel);
  try {
    console.log('Posting survey response chosen by user to database.');
    const resp = await doDevRevPostAPICall(apiBase, SurveysSubmitAPIMethodPath, postBodyForSurveyResp, actorAuth);
    if (resp.ok) {
      console.log('Successfully stored survey response chosen by user to database.');
    } else {
      let body = await resp.text();
      console.error('Error while posting message for survey response: ', resp.status, body);
      if (resp.status == 409) {
        // Delete survey snap-kit body in case of PLuG/Portal.
        if (payload.context.hasOwnProperty('entry_id')) {
          const deleteBody = getDeleteTimelineEntryBody(payload.context.entry_id);
          try {
            console.log('Deleting survey response as successful response is already received.');
            const resp = await doDevRevPostAPICall(apiBase, TimelineEntriesDeleteAPIMethodPath, deleteBody, auth);
            if (resp.ok) {
              console.log('Successfully deleted survey from timeline.');
            } else {
              let body = await resp.text();
              console.error('Error while deleting snap-kit from timeline: ', resp.status, body);
              return;
            }
          } catch (error) {
            console.error('Error: ', error);
            return;
          }

          const dupText = 'Looks like you beat yourself to it. You have already completed this survey.';
          let postBodyRev = getTimelineCommentBody(parentObjId, dupText, PRIVATE, privateToRev, commentExpireAt, TimelineLabelDisplayCustomerChat);
          try {
            console.log('Posting duplicate response message on timeline for Rev Org');
            const resp = await doDevRevPostAPICall(apiBase, TimelineEntriesCreateAPIMethodPath, postBodyRev, auth);
            if (resp.ok) {
              console.log('Successfully added duplicate response message on timeline for Rev Org.');
            } else {
              let body = await resp.text();
              console.error('Error while posting duplicate response message on timeline for Rev Org: ', resp.status, body);
              return;
            }
          } catch (error) {
            console.error('Error: ', error);
            return;
          }
        }
      }
      // Return because of error in processing
      return;
    }
  } catch (error) {
    console.error('Error: ', error);
    return;
  }

  // STEP-2 Delete survey snap-kit body in case of PLuG/Portal.
  if (payload.context.hasOwnProperty('entry_id')) {
    const deleteBody = getDeleteTimelineEntryBody(payload.context.entry_id);
    try {
      console.log('Deleting survey response as successful response is received.');
      const resp = await doDevRevPostAPICall(apiBase, TimelineEntriesDeleteAPIMethodPath, deleteBody, auth);
      if (resp.ok) {
        console.log('Successfully deleted survey from timeline.');
      } else {
        let body = await resp.text();
        console.error('Error while deleting snap-kit from timeline: ', resp.status, body);
        return;
      }
    } catch (error) {
      console.error('Error: ', error);
      return;
    }

    // STEP-3 Add thank you message for rev user on timeline in case of PLuG/Portal.
    let postBodyRev = getTimelineCommentBody(parentObjId, surveyRespText, PRIVATE, privateToRev, commentExpireAt, TimelineLabelDisplayCustomerChat);
    try {
      console.log('Posting thank you message on timeline for Rev Org');
      const resp = await doDevRevPostAPICall(apiBase, TimelineEntriesCreateAPIMethodPath, postBodyRev, auth);
      if (resp.ok) {
        console.log('Successfully added thank you message on timeline for Rev Org.');
      } else {
        let body = await resp.text();
        console.error('Error while posting thank you message on timeline for Rev Org: ', resp.status, body);
        return;
      }
    } catch (error) {
      console.error('Error: ', error);
      return;
    }
  }

  // STEP-4 Add response score provide by user on timeline for Devs.
  console.log(`Annotating Rev-User : [${actorId}] `);
  let bodyMsgDev = `\<${actorId}\> CSAT rating: ${rating}.`;
  let postBodyDev = getTimelineCommentBody(parentObjId, bodyMsgDev, INTERNAL, null, commentExpireAt, null);
  try {
    console.log('Posting survey response chosen by user on timeline for Dev Org');
    const resp = await doDevRevPostAPICall(apiBase, TimelineEntriesCreateAPIMethodPath, postBodyDev, auth);
    if (resp.ok) {
      console.log('Successfully added survey response chosen by user on timeline for Dev Org.');
    } else {
      let body = await resp.text();
      console.error('Error while posting survey response chosen by user on timeline for Dev Org: ', resp.status, body);
      return;
    }
  } catch (error) {
    console.error('Error: ', error);
    return;
  }
}

function getDeleteTimelineEntryBody(entryId: string) {
  return {
    'id': entryId,
  };
}

function getSurveyResponseBody(surveyId: string, objId: string, rating: number, dispatchId: string, sourceChannel: string) {
  console.log(`SurveyId: [${surveyId}], ObjectId: [${objId}], Rating: [${rating}], DispatchId: [${dispatchId}]`);

  let respBody: { [key: string]: any } = {};

  respBody.survey = surveyId;
  respBody.object = objId;
  respBody.response = {
    'rating': rating,
  };
  respBody.response_score = rating;
  respBody.dispatch_id = dispatchId;
  respBody.source_channel = sourceChannel;

  return respBody;
}

function splitDispatchIdAndRating(input: string): [string, number] | null {
  const tokens = input.split(dispatchIdAndRatingDeliminator);
  //case when only rating is present (for backward compatibility)
  if (tokens.length === 1) {
    return ['', parseInt(tokens[0])];
  }
  //case when dispatch id and rating is present
  if (tokens.length === 2) {
    return [tokens[0], parseInt(tokens[1])];
  }
  return null;
}

function getSourceChannel(payload: any) {
  let sourceChannel = EMAIL;
  if (payload.context.hasOwnProperty('parent_core_object_id')) {
    if (payload.context.parent_core_object_id.includes('ticket')) {
      sourceChannel = PORTAL;
    } else {
      sourceChannel = PLUG;
    }
  }
  return sourceChannel;
}

export const run = async (events: any[]) => {
  console.log('Running SnapIn for processing survey response');
  for (let event of events) {
    await ProcessSurveyResponse(event);
  }
};

export default run;