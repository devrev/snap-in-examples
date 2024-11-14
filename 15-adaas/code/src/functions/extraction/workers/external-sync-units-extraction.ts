import { ExtractorEventType, processTask } from '@devrev/ts-adaas';

interface GithubRepo {
  id: number;
  name: string; 
  description: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  language: string | null;
  visibility: string;
  default_branch: string;
}

interface ExternalSyncUnit {
  id: string;
  name: string;
  description: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  language: string | null;
  visibility: string;
  default_branch: string;
}

processTask({
  task: async ({ adapter }) => {
    const githubToken = adapter.event.payload.connection_data.key;
    const externalSyncUnits = await getAllExternalSyncUnits(githubToken);

    await adapter.emit(ExtractorEventType.ExtractionExternalSyncUnitsDone, {
      external_sync_units: externalSyncUnits,
    });
  },
  onTimeout: async ({ adapter }) => {
    await adapter.emit(ExtractorEventType.ExtractionExternalSyncUnitsError, {
      error: {
        message: 'Failed to extract external sync units. Lambda timeout.',
      },
    });
  },
});

async function getAllExternalSyncUnits(authToken: string): Promise<ExternalSyncUnit[]> {
  const repos = await fetchAllRepos(authToken);
  return repos.map(mapRepoToExternalSyncUnit);
}

async function fetchAllRepos(authToken: string): Promise<GithubRepo[]> {
  const perPage = 100;
  let page = 1;
  let allRepos: GithubRepo[] = [];
  let currentPageRepos: GithubRepo[];

  do {
    currentPageRepos = await getGithubRepos(authToken, page, perPage);
    allRepos = allRepos.concat(currentPageRepos);
    page++;
  } while (currentPageRepos.length === perPage);

  return allRepos;
}

async function getGithubRepos(
  authToken: string, 
  page: number = 1, 
  perPage: number = 100
): Promise<GithubRepo[]> {
  try {
    const response = await fetch(
      `https://api.github.com/user/repos?page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    throw error;
  }
}

function mapRepoToExternalSyncUnit(repo: GithubRepo): ExternalSyncUnit {
  return {
    id: repo.id.toString(),
    name: repo.name,
    description: repo.description || '',
    html_url: repo.html_url,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    language: repo.language,
    visibility: repo.visibility,
    default_branch: repo.default_branch
  };
}
