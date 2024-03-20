import validate_input from './functions/validate_input';

export const functionFactory = {
  // Add your functions here
  validate_input,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
