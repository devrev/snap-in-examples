import process_playstore_reviews from './functions/process_playstore_reviews';

export const functionFactory = {
  process_playstore_reviews,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
