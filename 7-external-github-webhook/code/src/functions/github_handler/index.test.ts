import { testRunner } from '../../test-runner/test-runner';

describe('Example Index Test file', () => {
  it('Testing the method', () => {
    testRunner({
      fixturePath: 'github_event.json',
      functionName: 'github_handler',
    });
  });
});
