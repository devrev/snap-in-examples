/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import search_giphy from './functions/search_giphy/index';
import render_giphy from './functions/render_giphy/index';
import publish_giphy_on_work_closed from './functions/publish_giphy_on_work_closed/index';

export const functionFactory = {
  search_giphy,
  render_giphy,
  publish_giphy_on_work_closed,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
