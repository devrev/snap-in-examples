import { NormalizedAttachment, NormalizedItem } from '@devrev/ts-adaas';

// TODO: Fix the normalization functions.
// Ref: https://github.com/devrev/adaas-chef-cli?tab=readme-ov-file#normalize-data
export function normalizeIssue(item: any): NormalizedItem {
  return {
    id: item.id,
    created_date: item.created_date,
    modified_date: item.modified_date,
    data: {
      creator: item.creator,
      owner: item.owner,
      title: item.title,
      state: item.state,
    },
  };
}

export function normalizeUser(item: any): NormalizedItem {
  return {
    id: item.id,
    created_date: item.created_date,
    modified_date: item.modified_date,
    data: {
      email: item.email,
      name: item.name,
    },
  };
}
