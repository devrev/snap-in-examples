import on_work_creation from './functions/on_work_creation';

export const functionFactory = {
  // Add your functions here
  on_work_creation,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
