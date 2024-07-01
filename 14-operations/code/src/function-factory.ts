import on_work_creation from './functions/on_work_creation';
import operation_handler from './functions/operation_handler';

export const functionFactory = {
  // Add your functions here
  on_work_creation,
  operation_handler,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
