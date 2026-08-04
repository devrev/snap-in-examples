import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { FunctionFactoryType } from './function-factory';
import { testRunner } from './test-runner/test-runner';

(async () => {
  const argv = await yargs(hideBin(process.argv)).options({
    fixturePath: {
      require: true,
      type: 'string',
    },
    functionName: {
      require: true,
      type: 'string',
    },
  }).argv;

  if (!argv.fixturePath || !argv.functionName) {
    console.error('Please make sure you have passed fixturePath & functionName');
  }

  await testRunner({
    fixturePath: argv.fixturePath,
    functionName: argv.functionName as FunctionFactoryType,
  });
})();
