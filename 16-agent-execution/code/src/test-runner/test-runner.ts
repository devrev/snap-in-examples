/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import * as dotenv from 'dotenv';
import { functionFactory, FunctionFactoryType } from '../function-factory';

export interface TestRunnerProps {
  functionName: FunctionFactoryType;
  fixturePath: string;
}

export const testRunner = async ({ functionName, fixturePath }: TestRunnerProps) => {
  const env = dotenv.config();

  //TODO: Pass this config to run method
  console.info(env.parsed?.APP_SECRET_TEST);

  if (!functionFactory[functionName]) {
    console.error(`${functionName} is not found in the functionFactory`);
    console.error('Add your function to the function-factory.ts file');
    throw new Error('Function is not found in the functionFactory');
  }

  const run = functionFactory[functionName];

  const eventFixture = require(`../fixtures/${fixturePath}`);

  await run(eventFixture);
};
