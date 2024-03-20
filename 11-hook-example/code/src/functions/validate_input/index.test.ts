import { testRunner } from '../../test-runner/test-runner';

describe('Example Index Test file', () => {
  it('Testing the method', () => {
    testRunner({
      fixturePath: 'event.json',
      functionName: 'validate_input',
    });
  });
});
