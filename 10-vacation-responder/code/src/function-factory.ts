import vacation_responder from './functions/vacation_responder';

export const functionFactory = {
  // Add your functions here
  vacation_responder,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
