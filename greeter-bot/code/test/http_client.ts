import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface SetupOptions {
  endpoint: string;
  token?: string;
}

export interface HttpRequest {
  headers?: any;
  path: string;
  body: unknown;
}

export class HTTPClient {
  public instance: AxiosInstance;

  constructor({ endpoint, token }: SetupOptions) {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: endpoint,
      headers: {
        Authorization: token,
      },
    };

    this.instance = axios.create({
      ...axiosConfig,
    });
  }

  async post<T>({ headers, path, body }: HttpRequest): Promise<AxiosResponse<T>> {
    return this.instance.request({
      method: 'POST',
      headers: headers,
      data: body,
      url: path,
    });
  }
}
