import { betaSDK, client, publicSDK } from '@devrev/typescript-sdk';
import axios from './axios'

import logger from './logger';
import { tryGetAsync } from './tryget';

export type HTTPResponse = {
  success: boolean;
  errMessage: string;
  data: any;
};

export type AiAgentSkillCallOutputCallbackRequest = {
  agent_session: string;
  skill_call_output: {
    id: string;
    name: string;
    output: Record<string, any>;
    error: string;
  }
}

export type SuggestSearchNamespace = "ticket" | "article";

export type SuggestSearchRequest = {
  namespaces: [SuggestSearchNamespace];
  query: string;
}

export type SuggestSearchResponse = {
  results: Array<Record<string, any>>;
}

const SUGGEST_SEARCH_ENDPOINT = "/internal/search.suggest";
const GET_ARTICLE_ENDPOINT = "/internal/articles.get";
const GET_WORK_ENDPOINT = "/internal/works.get";

export class DevrevSDKUtils {
  // Public SDK instance
  public devrevSdk!: betaSDK.Api<HTTPResponse>;
  public endpoint: string;
  public token: string;

  // Constructor to initialize SDK instance
  constructor(endpoint: string, token: string) {
    this.devrevSdk = client.setupBeta({
      endpoint: endpoint,
      token: token,
    });
    this.endpoint = endpoint;
    this.token = token;
  }

  async suggestSearch(req: SuggestSearchRequest): Promise<SuggestSearchResponse> {
    const config = {
      baseURL: this.endpoint,
      headers: {
        'Content-Type': 'application/json',
        authorization: this.token,
      },
    }
    const res = await tryGetAsync(() => axios.post<SuggestSearchResponse>(SUGGEST_SEARCH_ENDPOINT, req, config));

    if (!res.ok) {
      return Promise.reject(`failed to do suggest search with error: ${res.error}`);
    }

    const { data: result, status } = res.value;
    logger.error(`${SUGGEST_SEARCH_ENDPOINT} request succeeded with status ${status}`);

    return result;
  }

  async getArticle(req: betaSDK.ArticlesGetRequest): Promise<betaSDK.ArticlesGetResponse> {
    const config = {
      baseURL: this.endpoint,
      headers: {
        'Content-Type': 'application/json',
        authorization: this.token,
      },
    }
    const res = await tryGetAsync(() => axios.post<betaSDK.ArticlesGetResponse>(GET_ARTICLE_ENDPOINT, req, config));

    if (!res.ok) {
      return Promise.reject(`failed to do get article with error: ${res.error}`);
    }

    const { data: result, status } = res.value;
    logger.info(`Get article request succeeded with status ${status}, data: ${JSON.stringify(result)}`);

    return result;
  }


  async getWork(req: betaSDK.WorksGetRequest): Promise<betaSDK.WorksGetResponse> {
    const config = {
      baseURL: this.endpoint,
      headers: {
        'Content-Type': 'application/json',
        authorization: this.token,
      },
    }
    const res = await tryGetAsync(() => axios.post<betaSDK.WorksGetResponse>(GET_WORK_ENDPOINT, req, config));

    if (!res.ok) {
      return Promise.reject(`failed to do get article with error: ${res.error}`);
    }

    const { data: result, status } = res.value;
    logger.info(`Get article request succeeded with status ${status}, data: ${JSON.stringify(result)}`);

    return result;
  }
}
