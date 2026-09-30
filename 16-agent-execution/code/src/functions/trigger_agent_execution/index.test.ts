/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import { testRunner } from '../../test-runner/test-runner';
describe('Example Index Test file', () => {
  it('Testing the method', () => {
    testRunner({
      fixturePath: 'timeline_entry.json',
      functionName: 'trigger_agent_execution',
    });
  });
});
