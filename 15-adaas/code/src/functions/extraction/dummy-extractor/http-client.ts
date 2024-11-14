import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

import { AirdropEvent } from '@devrev/ts-adaas';

export class DummyHttpClient {
  private apiEndpoint: string;
  private apiToken;
  private defaultHeaders: AxiosRequestConfig['headers'];

  constructor(event: AirdropEvent) {
    this.apiEndpoint = 'https://dummy-api.com'; // Replace with the actual external system API endpoint
    this.apiToken = event.payload.connection_data.key;
    this.defaultHeaders = {
      Authorization: this.apiToken, // Replace with the actual authorization header
    };
  }

  async getUsers(params: URLSearchParams): Promise<AxiosResponse> {
    return axios.get(this.apiEndpoint + '/users', {
      headers: this.defaultHeaders,
      params,
    });
  }
}
