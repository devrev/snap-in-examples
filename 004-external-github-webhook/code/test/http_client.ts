/*
 * Copyright (c) 2024 DevRev Inc. All rights reserved.

Disclaimer:
The code provided herein is intended solely for testing purposes.
Under no circumstances should it be utilized in a production environment. Use of
this code in live systems, production environments, or any situation where
reliability and stability are critical is strongly discouraged. The code is
provided as-is, without any warranties or guarantees of any kind, and the user
assumes all risks associated with its use. It is the responsibility of the user 
to ensure that proper testing and validation procedures are carried out before 
deploying any code into production environments.
*/

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
      data: body,
      headers: headers,
      method: 'POST',
      url: path,
    });
  }
}
