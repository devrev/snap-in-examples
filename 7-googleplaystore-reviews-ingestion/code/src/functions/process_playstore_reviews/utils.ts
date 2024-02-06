import { client, publicSDK } from '@devrev/typescript-sdk';
import { AxiosResponse } from 'axios';

export type HTTPResponse = {
  success: boolean;
  message: string;
  data: any;
};

export const defaultResponse: HTTPResponse = {
  data: {},
  message: '',
  success: false,
};

export class ApiUtils {
  public devrevSdk!: publicSDK.Api<HTTPResponse>;

  // Constructor to initialize SDK instances
  constructor(endpoint: string, token: string) {
    this.devrevSdk = client.setup({
      endpoint: endpoint,
      token: token,
    });
  }

  // Create a timeline entry
  async createTimeLine(payload: publicSDK.TimelineEntriesCreateRequest): Promise<HTTPResponse> {
    try {
      const response: AxiosResponse = await this.devrevSdk.timelineEntriesCreate(payload);
      return { data: response.data, message: 'Timeline created successfully', success: true };
    } catch (error: any) {
      if (error.response) {
        const err = `Failed to create timeline. Err: ${JSON.stringify(error.response.data)}, Status: ${
          error.response.status
        }`;
        return { ...defaultResponse, message: err };
      } else {
        return { ...defaultResponse, message: error.message };
      }
    }
  }

  // Create a ticket
  async createTicket(payload: publicSDK.WorksCreateRequest): Promise<HTTPResponse> {
    try {
      const response: AxiosResponse = await this.devrevSdk.worksCreate(payload);
      return { data: response.data, message: 'Ticket created successfully', success: true };
    } catch (error: any) {
      if (error.response) {
        const err = `Failed to create ticket. Err: ${JSON.stringify(error.response.data)}, Status: ${
          error.response.status
        }`;
        return { ...defaultResponse, message: err };
      } else {
        return { ...defaultResponse, message: error.message };
      }
    }
  }

  // Update a timeline entry
  async updateTimeLine(payload: publicSDK.TimelineEntriesUpdateRequest): Promise<HTTPResponse> {
    try {
      const response: AxiosResponse = await this.devrevSdk.timelineEntriesUpdate(payload);
      return { data: response.data, message: 'Timeline updated successfully', success: true };
    } catch (error: any) {
      if (error.response) {
        const err = `Failed to update timeline. Err: ${JSON.stringify(error.response.data)}, Status: ${
          error.response.status
        }`;
        return { ...defaultResponse, message: err };
      } else {
        return { ...defaultResponse, message: error.message };
      }
    }
  }

  async postTextMessage(snapInId: string, message: string, commentID?: string) {
    if (!commentID) {
      // Create a new comment.
      const createPayload: publicSDK.TimelineEntriesCreateRequest = {
        body: message,
        body_type: publicSDK.TimelineCommentBodyType.Text,
        object: snapInId,
        type: publicSDK.TimelineEntriesCreateRequestType.TimelineComment,
        visibility: publicSDK.TimelineEntryVisibility.Internal,
      };

      const createTimelineResponse: HTTPResponse = await this.createTimeLine(createPayload);
      return createTimelineResponse;
    }
    // Update it instead.
    const updatePayload: publicSDK.TimelineEntriesUpdateRequest = {
      body: message,
      id: commentID,
      type: publicSDK.TimelineEntriesUpdateRequestType.TimelineComment,
    };
    const updateTimelineResponse: HTTPResponse = await this.updateTimeLine(updatePayload);
    return updateTimelineResponse;
  }

  async postTextMessageWithVisibilityTimeout(snapInId: string, message: string, expiresInMins: number) {
    // Create a new comment.
    const createPayload: publicSDK.TimelineEntriesCreateRequest = {
      expires_at: new Date(Date.now() + expiresInMins * 60000).toISOString(),
      body: message,
      body_type: publicSDK.TimelineCommentBodyType.Text,
      object: snapInId,
      type: publicSDK.TimelineEntriesCreateRequestType.TimelineComment,
      visibility: publicSDK.TimelineEntryVisibility.Internal,
    };

    const createTimelineResponse: HTTPResponse = await this.createTimeLine(createPayload);
    return createTimelineResponse;
  }
}
