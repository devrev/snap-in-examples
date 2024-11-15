import { NormalizedAttachment, NormalizedItem } from '@devrev/ts-adaas';

// TODO: Fix the normalization functions.
// Ref: https://github.com/devrev/adaas-chef-cli?tab=readme-ov-file#normalize-data
export function normalizeIssue(item: any): NormalizedItem {
  return {
    id: item.id.toString(),
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
  // if created_date is not present, set it to the current date
  if (!item.created_date) {
    item.created_date = new Date().toISOString();
  }
  if (!item.modified_date) {
    item.modified_date = new Date().toISOString();
  }
  return {
    id: item.id.toString(),
    created_date: item.created_date,
    modified_date: item.modified_date,
    data: {
      email: item.email,
      name: item.name,
    },
  };
}
