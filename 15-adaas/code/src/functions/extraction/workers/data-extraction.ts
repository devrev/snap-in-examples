import { EventType, ExtractorEventType, processTask } from '@devrev/ts-adaas';

import { normalizeIssue, normalizeUser } from '../github-extractor/data-normalization';
import { WorkerAdapter } from '@devrev/ts-adaas';
import { GithubExtractorState } from '../index';
import { getGithubIssues, getGithubUsers, extractAssigneesID } from './github';

// Dummy data that originally would be fetched from an external source
const issues = [
  {
    id: 'issue-1',
    created_date: '1999-12-25T01:00:03+01:00',
    modified_date: '1999-12-25T01:00:03+01:00',
    creator: 'user-1',
    owner: 'user-1',
    title: 'Issue 1',
  },
  {
    id: 'issue-2',
    created_date: '1999-12-27T15:31:34+01:00',
    modified_date: '2002-04-09T01:55:31+02:00',
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

// TODO: Add support for extraction of the body and the due_on fields of the issues
processTask({
  task: async ({ adapter }: { adapter: WorkerAdapter<GithubExtractorState> }) => {
    adapter.initializeRepos(repos);
    const githubToken = adapter.event.payload.connection_data.key;

    const repoId = adapter.event.payload.event_context.external_sync_unit_id;
    if (adapter.event.payload.event_type === EventType.ExtractionDataStart) {
      if (!repoId) {
        console.error('Repo ID not found in event payload');
        return;
      }
      if (!githubToken) {
        console.error('GitHub token not found in event payload');
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
      console.log('issues', issues.length);

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
        await adapter.emit(ExtractorEventType.ExtractionDataProgress, {
          progress: 50,
        });
        return;
      }
      await adapter.emit(ExtractorEventType.ExtractionDataDone, {
        progress: 100,
      });
    } else {
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
