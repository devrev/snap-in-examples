import { ExternalSyncUnit, ExtractorEventType, processTask } from '@devrev/ts-adaas';

processTask({
  task: async ({ adapter }) => {
    const ev = adapter.event;
    const githubToken = ev.payload.connection_data.key;
    
    let allRepos: any[] = [];
    let page = 1;
    let repos;
    do {
      repos = await getGithubRepos(githubToken, page);
      allRepos = allRepos.concat(repos);
      page++;
    } while (repos.length === 100);
    const orgs = allRepos;
    const externalSyncUnits = orgs.map((org) => ({
      id: org.id,
      name: org.name,
      description: org.description,
    }));

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



async function getGithubRepos(authToken: string, page: number = 1): Promise<any[]> {
  try {
    const response = await fetch(`https://api.github.com/user/repos?page=${page}&per_page=100`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.statusText}`);
    }

    const repos = await response.json();
    return repos.map((repo: {
      id: number;
      name: string;
      description: string | null;
      html_url: string;
      created_at: string;
      updated_at: string;
      language: string | null;
      visibility: string;
      default_branch: string;
    }) => ({
      id: repo.id.toString(),
      name: repo.name,
      description: repo.description || '',
      html_url: repo.html_url,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      language: repo.language,
      visibility: repo.visibility,
      default_branch: repo.default_branch
    }));
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    throw error;
  }
}

async function getGithubOrgs(authToken: string): Promise<any[]> {
  // get list of organizations the user is a member of
  const response = await fetch('https://api.github.com/user/memberships/orgs', {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.statusText}`);
  }

  return await response.json();
}

async function getGithubReposForOrg(authToken: string, orgId: string): Promise<any[]> {
  // get list of repos for a given organization
  const response = await fetch(`https://api.github.com/orgs/${orgId}/repos`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.statusText}`);
  }

  return await response.json();
}
