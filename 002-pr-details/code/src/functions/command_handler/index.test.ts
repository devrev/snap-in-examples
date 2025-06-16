import { testRunner } from '../../test-runner/test-runner';

describe('Example Index Test file', () => {
  it('Testing the method', () => {
    testRunner({
      fixturePath: 'on_command.json',
      functionName: 'command_handler',
    });
  });
});
