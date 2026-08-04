/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import greet_ticket from './functions/greet_ticket/index';

export const functionFactory = {
  greet_ticket,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;