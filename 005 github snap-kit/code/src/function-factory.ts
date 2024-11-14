import command_handler from './functions/command_handler';
import handle_actions from './functions/handle_actions';

export const functionFactory = {
  // Add your functions here
  command_handler,
  handle_actions,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
