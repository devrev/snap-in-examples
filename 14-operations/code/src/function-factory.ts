import operation_handler from './functions/operation_handler';

export const functionFactory = {
  // Add your functions here
  operation_handler,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
