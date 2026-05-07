
import * as dotenv from 'dotenv';
import { functionFactory, FunctionFactoryType } from '../function-factory';

export interface TestRunnerProps {
  functionName: FunctionFactoryType;
  fixturePath: string;
}

export const testRunner = async ({ functionName, fixturePath }: TestRunnerProps) => {
  const env = dotenv.config();

  console.info(env.parsed?.APP_SECRET_TEST);

  if (!functionFactory[functionName]) {
    console.error(`${functionName} is not found in the functionFactory`);
    console.error('Add your function to the function-factory.ts file');
    throw new Error('Function is not found in the functionFactory');
  }

  const run = functionFactory[functionName];

  // Use path relative to src directory (works for both source and compiled code)
  const path = require('path');
  const fixturesPath = path.join(__dirname, '../fixtures', fixturePath);
  const eventFixture = require(fixturesPath);

  await run(eventFixture);
};

