//// DevRev API Endpoints

// Rev-Users
export const RevUsersGetAPIMethodPath = '/rev-users.get';

// Works
export const WorksGetAPIMethodPath = '/works.get';
// Conversations
export const ConversationsGetAPIMethodPath = '/conversations.get';

// Timeline Entries
export const TimelineEntriesDeleteAPIMethodPath = '/timeline-entries.delete';
export const TimelineEntriesCreateAPIMethodPath = '/timeline-entries.create';
export const TimelineLabelDisplayCustomerChat = 'display:customer-chat';

// Surveys
export const SurveysCreateAPIMethodPath = '/surveys.create';
export const SurveysSubmitAPIMethodPath = '/surveys.submit';
export const SurveysListAPIMethodPath = '/surveys.list';
export const SurveysSendAPIMethodPath = '/surveys.send';

// Snap-kit Action
export const SnapKitActionCreateDeferredAPIMethodPath = '/snap-kit-action.create.deferred';

export const EMAIL = 'email';
export const EmailSubject = 'Support experience feedback for ';
export const PLUG = 'plug';
export const PORTAL = 'portal';
export const CHAT = 'chat';
export const DefaultCSATName = 'csat';

// Timeline Visibility
export const PRIVATE = 'private';
export const INTERNAL = 'internal';

export const DefaultSurveyBody = {
  'name': DefaultCSATName,
  'description': 'survey to get rating between 1 to 5',
  'schema': [{
    'name': 'rating',
    'description': 'Numeric rating for the object',
    'devrev_field_type': 'int',
    'is_required': true,
    'is_filterable': true,
    'validation': {
      'gt': 0,
      'lte': 5,
    },
    'default_value': 1,
  }],
};
