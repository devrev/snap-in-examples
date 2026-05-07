/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */
//unit test for greet_ticket function

import { run } from '../functions/greet_ticket';

describe('Test greet_ticket function', () => {
  it('Should greet the user when they create a ticket', () => {
    run([]);
    expect(result.message).toBe("Hello, how can I help you today?");
  });
  it('Should use the motivating message when use_motivating_message is true', () => {
    run([]);
    expect(result.message).toBe("You got this!! Fighting!");
  });
});