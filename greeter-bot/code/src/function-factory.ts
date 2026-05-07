

import ticket_greeter from './functions/ticket-greeter/index';

export const functionFactory = {
  ticket_greeter,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;


