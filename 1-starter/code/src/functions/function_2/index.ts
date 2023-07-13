/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

export const run = async (events: any[]): Promise<Record<string, any>> => {
  console.info(events);
  return { 'input_event': events[0] };
};

export default run;
