import { testRunner } from '../../test-runner/test-runner';
describe('Example Index Test file', () => {
  it('Testing the method', () => {
    testRunner({
      fixturePath: 'on_work_created_event.json',
      functionName: 'on_work_creation',
    });
  });
});
