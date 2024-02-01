import { client, publicSDK } from '@devrev/typescript-sdk';
import { AxiosResponse } from 'axios';
import * as gplay from "google-play-scraper";
import { StringOutputParser, JsonOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";

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
      console.log('Ticket Payload: ', JSON.stringify(payload, null, 2));
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

class LLMUtils {
  public provider!: ChatFireworks;

  // Constructor to initialize SDK instances
  constructor(fireworksApiKey: string, modelName: string, maxTokens: number) {
    this.provider = new ChatFireworks(
      {
        fireworksApiKey:fireworksApiKey,
        modelName: modelName,
        maxTokens:maxTokens,
      })
  }

  // Chat completion.
  async chatCompletion(sysPrompt: string, humanPrompt: string, argsValues: object): Promise<object> {
    const chatPrompt = ChatPromptTemplate.fromMessages(
      [
          SystemMessagePromptTemplate.fromTemplate(sysPrompt),
          HumanMessagePromptTemplate.fromTemplate(humanPrompt),
      ]
    )
    const outputParser = new JsonOutputParser();
    const chain = chatPrompt.pipe(this.provider).pipe((o) => {console.log(`Model OUTPUT: ${o}`); return o;}).pipe(outputParser);
    const response = await chain.invoke(argsValues);
    return response;
  }
}


export const run = async (events: any[]) => {
  for (const event of events) {
    const endpoint: string = event.execution_metadata.devrev_endpoint;
    const token: string = event.context.secrets.service_account_token;
    const fireWorksApiKey: string = event.input_data.keyrings.fireworks_api_key;
    const apiUtil: ApiUtils = new ApiUtils(endpoint, token);
    // Get the number of reviews to fetch from command args.
    const snapInId = event.context.snap_in_id;
    const devrevPAT = event.context.secrets.service_account_token;
    const baseURL = event.execution_metadata.devrev_endpoint;
    const inputs = event.input_data.global_values;
    let parameters:string = event.payload.parameters.trim();
    const tags = event.input_data.resources.tags;
    const llmUtil: LLMUtils = new LLMUtils(fireWorksApiKey, `accounts/fireworks/models/${inputs['llm_model_to_use']}`, 200);
    let numReviews = 10;
    let commentID : string | undefined;
    if (parameters === 'help') {
      // Send a help message in CLI help format.
      // the message contents could be something like: This snap-in fetches reviews from Google Playstore and creates tickets in DevRev. The number of reviews to fetch can be specified as a command argument. The command argument should be a number between 1 and 100. If no command argument is specified, it defaults to 10. For example, if you want to fetch 20 reviews, you can type "/playstore_reviews_process 20".
      const helpMessage = `playstore_reviews_process - Fetch reviews from Google Playstore and creates tickets in DevRev.\n\nUsage: /playstore_reviews_process <number_of_reviews_to_fetch>\n\n\`number_of_reviews_to_fetch\`: Number of reviews to fetch from Google Playstore. Should be a number between 1 and 100. If not specified, it defaults to 10.`;
      let postResp  = await apiUtil.postTextMessageWithVisibilityTimeout(snapInId, helpMessage, 1);
      if (!postResp.success) {
        console.error(`Error while creating timeline entry: ${postResp.message}`);
        continue;
      }
      continue
    }
    let postResp: HTTPResponse = await apiUtil.postTextMessageWithVisibilityTimeout(snapInId, 'Fetching reviews from Playstore', 1);
    if (!postResp.success) {
      console.error(`Error while creating timeline entry: ${postResp.message}`);
      continue;
    }
    if (!parameters) {
      // Default to 10 reviews.
      parameters = '10';
    }
    try {
      numReviews = parseInt(parameters);

      if (!Number.isInteger(numReviews)) {
        throw new Error('Not a valid number');
      }
    } catch (err) {
      postResp  = await apiUtil.postTextMessage(snapInId, 'Please enter a valid number', commentID);
      if (!postResp.success) {
        console.error(`Error while creating timeline entry: ${postResp.message}`);
        continue;
      }
      commentID = postResp.data.timeline_entry.id;
    }
    // Make sure number of reviews is <= 100.
    if (numReviews > 100) {
      postResp  = await apiUtil.postTextMessage(snapInId, 'Please enter a number less than 100', commentID);
      if (!postResp.success) {
        console.error(`Error while creating timeline entry: ${postResp.message}`);
        continue;
      }
      commentID = postResp.data.timeline_entry.id;
    }
    // Call google playstore scraper to fetch those number of reviews.
    let getReviewsResponse:any = await gplay.reviews({
      appId: inputs['app_id'],
      sort: gplay.sort.RATING,
      num: numReviews,
      throttle: 10,
    });
    // Post an update about the number of reviews fetched.
    postResp  = await apiUtil.postTextMessageWithVisibilityTimeout(snapInId, `Fetched ${numReviews} reviews, creating tickets now.`, 1);
    if (!postResp.success) {
      console.error(`Error while creating timeline entry: ${postResp.message}`);
      continue;
    }
    commentID = postResp.data.timeline_entry.id;
    console.log(`"getReviewsResponse" = ${getReviewsResponse}\n\n${JSON.stringify(getReviewsResponse)}`);
    let reviews:gplay.IReviewsItem[] = getReviewsResponse.data;
    console.log(`reviews = ${reviews}`);
    // For each review, create a ticket in DevRev.
    for(const review of reviews) {
      // Post a progress message saying creating ticket for review with review URL posted.
      postResp  = await apiUtil.postTextMessageWithVisibilityTimeout(snapInId, `Creating ticket for review: ${review.url}`, 1);
      if (!postResp.success) {
        console.error(`Error while creating timeline entry: ${postResp.message}`);
        continue;
      }
      const reviewText = `Ticket created from Playstore review ${review.url}\n\n${review.text}`;
      const reviewTitle = review.title || `Ticket created from Playstore review ${review.url}`;
      const reviewID = review.id;
      const systemPrompt = `You are an expert at labeling a given Google Playstore Review as bug, feature_request, question or feedback. You are given a review provided by a user for the app ${inputs['app_id']}. You have to label the review as bug, feature_request, question or feedback. The output should be a JSON with fields "category" and "reason". The "category" field should be one of "bug", "feature_request", "question" or "feedback". The "reason" field should be a string explaining the reason for the category. \n\nReview: {review}\n\nOutput:`;
      const humanPrompt = ``;

      let llmResponse = {};
      try {
        llmResponse = await llmUtil.chatCompletion(systemPrompt, humanPrompt, {review: (reviewTitle ? reviewTitle + '\n' + reviewText: reviewText)})
      } catch (err) {
        console.error(`Error while calling LLM: ${err}`);
      }
      let tagsToApply = [];
      let inferredCategory = 'failed_to_infer_category';
      if ('category' in llmResponse) {
        inferredCategory = llmResponse['category'] as string;
        if (!(inferredCategory in tags)) {
          inferredCategory = 'failed_to_infer_category';
        }
      }
      // Create a ticket with title as review title and description as review text.
      const createTicketResp = await apiUtil.createTicket({
        title: reviewTitle,
        tags: [{id: tags[inferredCategory].id}],
        body: reviewText,
        type: publicSDK.WorkType.Ticket,
        owned_by: [inputs['default_owner_id']],
        applies_to_part: inputs['default_part_id'],
      });
      if (!createTicketResp.success) {
        console.error(`Error while creating ticket: ${createTicketResp.message}`);
        continue;
      }
      // Post a message with ticket ID.
      const ticketID = createTicketResp.data.work.id;
      const ticketCreatedMessage = inferredCategory != 'failed_to_infer_category' ? `Created ticket: <${ticketID}> and it is categorized as ${inferredCategory}` : `Created ticket: <${ticketID}> and it failed to be categorized`;
      const postTicketResp: HTTPResponse  = await apiUtil.postTextMessageWithVisibilityTimeout(snapInId, ticketCreatedMessage, 1);
      if (!postTicketResp.success) {
        console.error(`Error while creating timeline entry: ${postTicketResp.message}`);
        continue;
      }
    }
    // Call an LLM to categorize the review as Bug, Feature request, or Question.
  }
};

export default run;
