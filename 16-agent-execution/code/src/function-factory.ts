/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import trigger_agent_execution from './functions/trigger_agent_execution/index';
import handle_agent_response from './functions/handle_agent_response/index';

export const functionFactory = {
  trigger_agent_execution,
  handle_agent_response
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
