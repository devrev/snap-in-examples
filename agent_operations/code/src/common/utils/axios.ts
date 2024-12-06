import axios from 'axios';
import axiosRetry from 'axios-retry';

import logger from './logger';

const instance = axios.create({
  validateStatus: (status) => status >= 200 && status < 300,
});

instance.interceptors.response.use(
  (response) => {
    console.log(response)
    return response;
  },
  (error) => {
    let err: any = { message: error.message };
    console.log(JSON.stringify(error))
    if (error.response) {
      err = {
        ...err,
        data: error.response.data,
        headers: error.response.headers,
        status: error.response.status,
      };
    } else if (error.request) {
      err = {
        ...err,
        request: error.request,
      };
    }
    const method = error.config?.method ?? error.request?.method ?? '';
    logger.error('error during %s request %O', method.toUpperCase(), err);
    return Promise.reject(error);
  }
);

axiosRetry(instance, {
  onRetry: (retryCount, error, requestConfig) => {
    logger.warn('Request failed %O', { error, requestConfig, retryCount });
  },
  retryDelay: axiosRetry.exponentialDelay,
});

export default instance;
