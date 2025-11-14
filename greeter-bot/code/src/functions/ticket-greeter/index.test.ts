

import { testRunner } from '../../test-runner/test-runner';

describe('Ticket Greeter Test', () => {
  it('should greet a new ticket with default message', async () => {
    await testRunner({
      fixturePath: 'ticket_created.json',
      functionName: 'ticket_greeter',
    });
  });
});

