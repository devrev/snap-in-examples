import { NormalizedAttachment, NormalizedItem } from '@devrev/ts-adaas';

export function normalizeIssue(item: any): NormalizedItem {
  return {
    id: item.id.toString(),
    created_date: item.created_date,
    modified_date: item.modified_date,
    data: {
      body: item.body,
      creator: item.creator,
      owner: item.owner,
      title: item.title,
      state: item.state,
    },
  };
}

export function normalizeUser(item: any): NormalizedItem {
  let createdDate = new Date().toISOString();
  if (item.created_date) {
    createdDate = new Date(item.created_date).toISOString();
  }
  let modifiedDate = new Date().toISOString();
  if (item.modified_date) {
    modifiedDate = new Date(item.modified_date).toISOString();
  }

  return {
    id: item.id.toString(),
    created_date: createdDate,
    modified_date: modifiedDate,
    data: {
      email: item.email,
      name: item.name,
    },
  };
}

export function normalizeAttachment(item: any): NormalizedAttachment {
  return {
    url: item.url,
    id: item.id.toString(),
    file_name: item.file_name,
    author_id: item.author_id,
    parent_id: item.parent_id,
  };
}
