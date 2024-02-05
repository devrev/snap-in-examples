import github_handler from './functions/github_handler';

export const functionFactory = {
  // Add your functions here
  github_handler,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
