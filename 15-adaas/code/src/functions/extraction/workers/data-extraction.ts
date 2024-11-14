import { EventType, ExtractorEventType, processTask } from '@devrev/ts-adaas';

import { normalizeAttachment, normalizeIssue, normalizeUser } from '../dummy-extractor/data-normalization';
import { WorkerAdapter } from '@devrev/ts-adaas';
import { DummyExtractorState } from '../index';

// Dummy data that originally would be fetched from an external source
const issues = [
  {
    id: 'issue-1',
    created_date: '1999-12-25T01:00:03+01:00',
    modified_date: '1999-12-25T01:00:03+01:00',
    body: '<p>This is issue 1</p>',
    creator: 'user-1',
    owner: 'user-1',
    title: 'Issue 1',
  },
  {
    id: 'issue-2',
    created_date: '1999-12-27T15:31:34+01:00',
    modified_date: '2002-04-09T01:55:31+02:00',
    body: '<p>This is issue 2</p>',
    creator: 'user-2',
    owner: 'user-2',
    title: 'Issue 2',
  },
];

const users = [
  {
    id: 'user-1',
    created_date: '1999-12-25T01:00:03+01:00',
    modified_date: '1999-12-25T01:00:03+01:00',
    data: {
      email: 'johndoe@test.com',
      name: 'John Doe',
    },
  },
  {
    id: 'user-2',
    created_date: '1999-12-27T15:31:34+01:00',
    modified_date: '2002-04-09T01:55:31+02:00',
    data: {
      email: 'janedoe@test.com',
      name: 'Jane Doe',
    },
  },
];

const attachments = [
  {
    url: 'https://app.dev.devrev-eng.ai/favicon.ico',
    id: 'attachment-1',
    file_name: 'dummy.jpg',
    author_id: 'user-1',
    parent_id: 'issue-1',
  },
  {
    url: 'https://app.dev.devrev-eng.ai/favicon.ico',
    id: 'attachment-2',
    file_name: 'dummy.ico',
    author_id: 'user-2',
    parent_id: 'issue-2',
  },
];

const repos = [
  {
    itemType: 'issues',
    normalize: normalizeIssue,
  },
  {
    itemType: 'users',
    normalize: normalizeUser,
  },
  {
    itemType: 'attachments',
    normalize: normalizeAttachment,
  },
];

processTask({
  task: async({ adapter }: { adapter: WorkerAdapter<DummyExtractorState> }) => {
    adapter.initializeRepos(repos);
    if (adapter.event.payload.event_type === EventType.ExtractionDataStart) {
      const githubToken = adapter.event.payload.connection_data.key;
      // @ts-ignore - property exists at runtime
      const repoName = adapter.event.payload.event_context.external_sync_unit_name;
      const repoId = adapter.event.payload.event_context.external_sync_unit_id;
      if (!repoId) {
        console.error('Repo ID not found in event payload');
        return;
      }
      if (!githubToken || !repoName) {
        console.error('GitHub token or repo not found in event payload');
        return;
      }
      const issues = await getGithubIssues(githubToken, repoId);
     await adapter.getRepo('issues')?.push(issues);
     
     adapter.state.issues.completed = true;

      // get assignees for each issue
      const assignees = extractAssigneesID(issues);


      const assigneesData = await getGithubUsers(githubToken, assignees);
      await adapter.getRepo('users')?.push(assigneesData);

      // How to handle the state?
      await adapter.emit(ExtractorEventType.ExtractionDataProgress, {
        progress: 90,
      });
    } else {
      adapter.getRepo('attachments')?.push(attachments);
      await adapter.emit(ExtractorEventType.ExtractionDataDone, {
        progress: 100,
      });
    }
  },
  onTimeout: async ({ adapter }) => {
    await adapter.postState();
    await adapter.emit(ExtractorEventType.ExtractionDataProgress, {
      progress: 50,
    });
  },
});


// get list of github issues for a given repo
async function getGithubIssues(authToken: string, repo_id: string) {
 
  let page = 1;
  const perPage = 100;
  let hasMorePages = true;
  const allIssues = [];

  while (hasMorePages) {
    console.log('page', page);
    const response = await fetch(
      `https://api.github.com/repositories/${repo_id}/issues?page=${page}&per_page=${perPage}&state=all`, 
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    const issuesResponse = await response.json();
    console.log('issuesResponse', issuesResponse.length);
    // only get issues that are not pull requests
    const issues = issuesResponse.filter((issue: any) => issue.pull_request === undefined);
    console.log('issues', issues.length);
    allIssues.push(...issues);

    // Check if there are more pages based on response length
    hasMorePages = issuesResponse.length === perPage;
    page++;
  }

  return allIssues;
}


function extractAssigneesID(issues: any[]) {
  const allAssignees: string[] = [];
  // get assignees for each issue
  for (const issue of issues) {
    // Check if assignees already exist in allAssignees. assignee have
    // id that can be used for comparison.
    for (const assignee of issue.assignees) {
      if (!allAssignees.find((a) => a === assignee.id)) {
        allAssignees.push(assignee.id);
      }
    }
  }
  return allAssignees;
}

async function getGithubUsers(authToken: string, assignees: string[]) {
  const assigneesData: any[] = [];
  for (const assignee of assignees) {
    try {
      const response = await fetch(`https://api.github.com/user/${assignee}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
      });
      assigneesData.push(await response.json());
    } catch (error) {
      console.error(`GitHub API request failed: ${error}`);
      continue;
    }

  }

  return assigneesData;
}
