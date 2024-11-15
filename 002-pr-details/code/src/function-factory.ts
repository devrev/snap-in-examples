import command_handler from './functions/command_handler';
import operation_handler from './functions/operation_handler';
export const functionFactory = {
  // Add your functions here
  command_handler,
  operation_handler,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
