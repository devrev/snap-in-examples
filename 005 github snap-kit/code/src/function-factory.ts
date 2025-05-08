import command_handler from './functions/command_handler';

export const functionFactory = {
  // Add your functions here
  command_handler,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
