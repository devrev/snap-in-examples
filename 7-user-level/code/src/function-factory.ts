import on_work_creation from './functions/on_work_creation';
import on_work_updation from './functions/on_work_updation';

export const functionFactory = {
  // Add your functions here
  on_work_creation,
  on_work_updation,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
