import { EventType, ExtractorEventType, processTask } from '@devrev/ts-adaas';

import {  normalizeIssue, normalizeUser } from '../github-extractor/data-normalization';
import { WorkerAdapter } from '@devrev/ts-adaas';
import { GithubExtractorState } from '../index';

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


const repos = [
  {
    itemType: 'issues',
    normalize: normalizeIssue,
  },
  {
    itemType: 'users',
    normalize: normalizeUser,
  },
];

processTask({
  task: async({ adapter }: { adapter: WorkerAdapter<GithubExtractorState> }) => {
    adapter.initializeRepos(repos);
    const githubToken = adapter.event.payload.connection_data.key;
  
      // @ts-ignore - property exists at runtime
      const repoName = adapter.event.payload.event_context.external_sync_unit_name;
      const repoId = adapter.event.payload.event_context.external_sync_unit_id;
    if (adapter.event.payload.event_type === EventType.ExtractionDataStart) {

      if (!repoId) {
        console.error('Repo ID not found in event payload');
        return;
      }
      if (!githubToken || !repoName) {
        console.error('GitHub token or repo not found in event payload');
        return;
      }
      let issues: any[] = [];
      try {
        issues = await getGithubIssues(githubToken, repoId);
      } catch (error) {
        console.error('Error fetching GitHub issues:', error);
        throw error;
      }
      try {
        await adapter.getRepo('issues')?.push(issues);
      } catch (error) {
        console.error('Error pushing issues to repository:', error);
        throw error;
      }
      // Update state to indicate that issues have been fetched
      adapter.state.issues.completed = true;
      adapter.state.issues.issues = issues;


      await adapter.emit(ExtractorEventType.ExtractionDataProgress, {
        progress: 50,
      });
    } else {

      // Get issues from state
      const issues = adapter.state.issues.issues;
      if (issues && issues.length > 0) {
        // get assignees for each issue
        const assignees = extractAssigneesID(issues);
        try {
          const assigneesData = await getGithubUsers(githubToken, assignees);
          await adapter.getRepo('users')?.push(assigneesData);
        } catch (error) {
          console.error('Error fetching GitHub users:', error);
          throw error;
        }
      }     
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
  const perPage = 100;
  const allIssues = [];

  const fetchPage = async (page: number) => {
    const url = `https://api.github.com/repositories/${repo_id}/issues?page=${page}&per_page=${perPage}&state=all`;
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Accept': 'application/vnd.github.v3+json'
    };

    const response = await fetch(url, { headers });
    const issuesResponse = await response.json();
    
    // Filter out pull requests
    return issuesResponse.filter((issue: any) => !issue.pull_request);
  };

  let page = 1;
  while (true) {
    console.log('page', page);
    const pageIssues = await fetchPage(page);
    allIssues.push(...pageIssues);

    if (pageIssues.length < perPage) {
      break;
    }
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
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Accept': 'application/vnd.github.v3+json'
  };

  const fetchUser = async (assigneeId: string) => {
    try {
      const response = await fetch(`https://api.github.com/user/${assigneeId}`, { headers });
      return await response.json();
    } catch (error) {
      console.error(`GitHub API request failed for user ${assigneeId}: ${error}`);
      return null;
    }
  };

  const assigneesData = await Promise.all(
    assignees.map(assigneeId => fetchUser(assigneeId))
  );

  return assigneesData.filter(data => data !== null);
}
