import {
  doDevRevPostAPICall,
  getAPIBase,
  getSnapKitBody,
  getTimelineCommentBody,
  getAPIDomain,
  getExpiryTimestamp,
  getSurveyId,
  getWork,
  getConversation,
  getCommandParameters,
} from '../common/utils';
import {
  EMAIL,
  PLUG,
  PORTAL,
  CHAT,
  INTERNAL,
  PRIVATE,
  TimelineEntriesCreateAPIMethodPath,
  DefaultCSATName,
  TimelineLabelDisplayCustomerChat,
} from '../common/constants';
  
interface Stakeholder {
  id?: string;
  email_id?: string;
}
  
const commentExpireAt2Min = getExpiryTimestamp(2).toISOString();
  
  
export class PostSurvey {
  constructor() {}
  
  async PostSurvey(event: any) {
	  console.log('Creating survey on event payload: ', JSON.stringify(event.payload));
	  console.log('Event Context: ', JSON.stringify(event.context));
	  try {
      const payload = event.payload;
      const executionMetadata = event.execution_metadata;
      const apiBase = getAPIBase(executionMetadata);
      const auth = event.context.secrets.service_account_token;
      const snapInId = event.context.snap_in_id;
      const devOid = event.context.dev_oid;
      let objId = '';
      let objDisplayID = '';
      let objType = '';
  
      let isTicket = false;
      let ticketTitle = '';
      let ticketDescription = '';
  
      console.log('Event Context auth service account token: ', auth);
      // Global configuration values
      let surveyExpiresAfterInMin = parseInt(event.input_data.global_values.survey_expires_after);
      const surveyTextHeader = event.input_data.global_values.survey_text_header;
      let surveyText = event.input_data.global_values.survey_text;
      const surveyRespScale = event.input_data.global_values.survey_resp_scale;
      const surveyChannels = event.input_data.global_values.survey_channel;
      let commandChannel = '';
  
      if (surveyExpiresAfterInMin < 1) {
		  console.log(`Invalid survey expiry time: [${surveyExpiresAfterInMin}min]. Setting to default [1min]`);
		  surveyExpiresAfterInMin = 1;
      }
  
      let surveyStakeholders : Stakeholder[] = [];
  
      // This condition means snap-in is triggered by command.
      if (payload.hasOwnProperty('command_id')) {
		  objId = payload.source_id;
  
		  if (payload.parameters !== '') {
          let commandParams = getCommandParameters(payload.parameters);
          if (commandParams == null) {
			  let bodyMsgDev = `Unexpected request:\nExpected: chat/email survey question\nReceived: ${payload.parameters}.`;
			  let postBodyDev = getTimelineCommentBody(objId, bodyMsgDev, INTERNAL, null, commentExpireAt2Min, null);
			  try {
              console.log('Posting invalid parameters comment on timeline for Dev Org');
              const resp = await doDevRevPostAPICall(apiBase, TimelineEntriesCreateAPIMethodPath, postBodyDev, auth);
              if (resp.ok) {
				  console.log('Successfully added invalid parameters comment on timeline for Dev Org.');
              } else {
				  let body = await resp.text();
				  console.error('Error while posting invalid parameters comment on timeline for Dev Org: ', resp.status, body);
				  return;
              }
              console.log('Invalid parameters comment sent successfully to timeline for Dev Org.');
			  } catch (error) {
              console.error('Error: ', error);
			  }
			  return;
          }
          commandChannel = commandParams[0].toLowerCase();
          surveyText = commandParams[1];
		  }
  
		  if (objId.includes('ticket')) {
          const work = await getWork(apiBase, auth, objId);
          if (work == null) {
			  return;
          }
          console.log(`ticket information for object ID: [${objId}] ,`, JSON.stringify(work));
          objType = work.type;
          objDisplayID = work.display_id;
          surveyStakeholders = this.getStakeholders(work.reported_by);
          isTicket = true;
          ticketTitle = work.title;
          ticketDescription = work.body;
		  } else {
          const conversation = await getConversation(apiBase, auth, objId);
          if (conversation == null) {
			  return;
          }
          console.log(`conversation information for object ID: [${objId}] ,`, JSON.stringify(conversation));
          objType = conversation.type;
          objDisplayID = conversation.display_id;
          surveyStakeholders = this.getStakeholders(conversation.members);
		  }
      } else {
		  let isTypeMatched = false;
		  if (payload.hasOwnProperty('conversation_updated')) {
          objType = 'conversation';
          let conversation = payload.conversation_updated.conversation;
          let old_conversation = payload.conversation_updated.old_conversation;
          if (conversation.state != 'closed' || conversation.status != 'closed') {
			  console.log(`State: [${conversation.state}], Status: [${conversation.status}]. Conversation is not closed. returning...`);
			  return;
          }
          if (conversation.state == 'closed' && conversation.status == 'closed' &&
						  old_conversation.state == 'closed' && old_conversation.status == 'closed') {
			  console.log(`State: [${conversation.state}], Status: [${conversation.status}]. Conversation is already closed. returning...`);
			  return;
          }
          isTypeMatched = true;
          objId = conversation.id;
          objDisplayID = conversation.display_id;
          surveyStakeholders = this.getStakeholders(conversation.members);
		  } else if (payload.hasOwnProperty('work_updated')) {
          let work = payload.work_updated.work;
          let stage = work.stage.name;
          let state = work.state;
          let old_work = payload.work_updated.old_work;
          let old_stage = old_work.stage.name;
          let old_state = old_work.state;
          objType = 'ticket';
  
          let type = work.type.toLowerCase();
          if (type != 'ticket') {
			  console.log(`Work Type is [${type}]. Not a ticket. returning...`);
			  return;
          }
          if (stage != 'resolved' || state != 'closed') {
			  console.log(`Stage: [${stage}], State: [${state}]. Ticket is not resolved. returning...`);
			  return;
          }
          if (stage == 'resolved' && state == 'closed' && old_stage == 'resolved' && old_state == 'closed') {
			  console.log(`Stage: [${stage}], State: [${state}]. Ticket is already resolved. returning...`);
			  return;
          }
          isTypeMatched = true;
          objId = work.id;
          objDisplayID = work.display_id;
          surveyStakeholders = this.getStakeholders(work.reported_by);
          isTicket = true;
          ticketTitle = work.title;
          ticketDescription = work.body;
		  }
  
		  if (!isTypeMatched) {
          console.log('Event type is neither [conversation_updated] nor [work_updated]. returning...');
          return;
		  }
      }
  
      const surveyId = await getSurveyId(apiBase, auth, DefaultCSATName);
      if (surveyId == null) {
		  console.log('SurveyId is null cannot proceed with processing. returning...');
		  return;
      }
  
      console.log(`Posting survey on survey channels ${surveyChannels} with SurveyId [${surveyId}] for an Object [${objId}].`);
      let isSurveySent = false;
      for (let i = 0; i < surveyStakeholders.length; i++) {
		  // To track on which channels survey is actually sent.
		  let surveySentOnChannels : string[] = [];
		  for (let channel = 0; channel < surveyChannels.length; channel++) {
          let surveyChannel = surveyChannels[channel].toLowerCase();
  
          if (payload.hasOwnProperty('command_id')) {
			  // In case of commands send survey only on channel described in command
			  if (
              ((surveyChannel === PLUG || surveyChannel === PORTAL) && commandChannel !== CHAT)
			  ) {
              console.log(`Survey is not sent on command as config channel: [${surveyChannel}] and command channel: [${commandChannel}].`);
              continue;
			  }
          }
  
          switch (surveyChannel) {
			  case PLUG:
			  case PORTAL: {
              console.log(`Posting survey on survey channel [${surveyChannel}].`);
              const expiresAt = getExpiryTimestamp(surveyExpiresAfterInMin);
              const snapKitBody = getSnapKitBody(objId, snapInId, surveyTextHeader,
				  surveyText, surveyRespScale, PRIVATE, [surveyStakeholders[i].id!], expiresAt.toISOString(), TimelineLabelDisplayCustomerChat);
              const resp = await doDevRevPostAPICall(apiBase, TimelineEntriesCreateAPIMethodPath, snapKitBody, auth);
              if (resp.ok) {
				  console.log(`Successfully posted message on [${objId}] for User [${surveyStakeholders[i].id!}]`);
				  surveySentOnChannels.push(surveyChannel);
              } else {
				  let body = await resp.text();
				  console.error(`Error while posting message on [${objId}] for User [${surveyStakeholders[i].id!}] `, resp.status, body);
              }
              break;
			  }
          }
		  }
  
		  if (surveySentOnChannels.length > 0) {
          isSurveySent = true;
		  }
      }
  
      if (isSurveySent) {
		  let bodyMsgDev = `Customer feedback has been requested for this ${objType}.`;
		  const expiresAt = getExpiryTimestamp(surveyExpiresAfterInMin);
		  let postBodyDev = getTimelineCommentBody(objId, bodyMsgDev, INTERNAL, null, expiresAt.toISOString(), TimelineLabelDisplayCustomerChat);
		  try {
          console.log('Posting survey sent message on timeline for Dev Org');
          const resp = await doDevRevPostAPICall(apiBase, TimelineEntriesCreateAPIMethodPath, postBodyDev, auth);
          if (resp.ok) {
			  console.log('Successfully added survey sent message on timeline for Dev Org.');
          } else {
			  let body = await resp.text();
			  console.error('Error while posting survey sent message on timeline for Dev Org: ', resp.status, body);
			  return;
          }
          console.log('Survey sent message successfully to timeline for Dev Org.');
		  } catch (error) {
          console.error('Error: ', error);
		  }
      }
	  } catch (error) {
      console.error('Error: ', error);
	  }
  }
  
  getStakeholders(stakeholdersFromObj: any[]): Stakeholder[] {
	  console.log('stakeholders from object: ', JSON.stringify(stakeholdersFromObj));
	  let stakeholders : Stakeholder[] = [];
	  for (let i = 0; i < stakeholdersFromObj.length; i++) {
      console.log('stakeholders: ', JSON.stringify(stakeholdersFromObj[i]));
      const stakeholder : Stakeholder = {};
      if (stakeholdersFromObj[i].type == 'rev_user') {
		  stakeholder.id = stakeholdersFromObj[i].id;
		  if (stakeholdersFromObj[i].hasOwnProperty('email')) {
          stakeholder.email_id = stakeholdersFromObj[i].email;
		  }
      }
      stakeholders.push(stakeholder);
	  }
	  console.log('stakeholders after filtering: ', JSON.stringify(stakeholders));
	  return stakeholders;
  }
  
  
}
  
export const run = async (events: any[]) => {
  
  console.log('Running SnapIn for survey - post_survey', events);
  
  const postSurvey = new PostSurvey();
  for (let event of events) {
	  await postSurvey.PostSurvey(event);
  }
  
  console.info('events', events);
};
  
export default run;