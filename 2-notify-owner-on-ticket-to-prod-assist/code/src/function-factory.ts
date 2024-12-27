/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import ticket_stage_update from './functions/ticket_stage_change/index'

export const functionFactory = {
  ticket_stage_update,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
