import post_survey from './functions/post_survey/index';
import process_response from './functions/process_response/index';

export const functionFactory = {
  post_survey,
  process_response,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
