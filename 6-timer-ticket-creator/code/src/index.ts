import ticket_creator from "./functions/ticket_creator";

export const functionFactory = {
  ticket_creator,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
