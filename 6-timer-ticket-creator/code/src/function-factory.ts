import ticket_creator from './functions/ticket_creator';

export const functionFactory = {
  // Add your functions here
  ticket_creator,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
