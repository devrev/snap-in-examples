import {
  Error as OperationError,
  Error_Type,
  ExecuteOperationInput,
  FunctionInput,
  OperationBase,
  OperationContext,
  OperationOutput,
  OutputValue,
} from '@devrev/typescript-sdk/dist/snap-ins';

interface GetRepositoryInput {
  repository_url: string;
}

export class GetRepository extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }
  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    console.log('Starting GetRepository operation');
    const input_data = input.data as GetRepositoryInput;
    const repository_url = input_data.repository_url;
    console.log('Repository URL:', repository_url);

    let err: OperationError | undefined = undefined;
    if (!repository_url) {
      err = {
        message: 'Repository URL not found',
        type: Error_Type.InvalidRequest,
      };
      console.error('Error:', err);
    }

    console.log("Context:", context);
    console.log("GitHub token exists:", !!resources.keyrings.github_token.secret);

    const github_token = resources.keyrings.github_token.secret;

    // Fetch repository details from GitHub
    const { Octokit } = require('@octokit/core');
    const octokit = new Octokit({ auth: github_token });

    // Extract owner and repo from URL
    const githubRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/;
    const match = repository_url.replace(/^<|>$/g, '').match(githubRegex);
    console.log('URL parsing result:', { match });

    if (!match || match.length !== 3) {
      console.error('Invalid repository URL format:', repository_url);
      throw new Error('Invalid repository URL format');
    }

    const [, owner, repo] = match;
    console.log('Extracted owner/repo:', { owner, repo });

    try {
      // Fetch repository details
      console.log('Fetching repository details from GitHub...');
      const response = await octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      console.log('GitHub API response status:', response.status);

      const result = {
        description: response.data.description,
        forks_count: response.data.forks_count,
        stargazers_count: response.data.stargazers_count
      }
      console.log('Final result:', result);

      return OperationOutput.fromJSON({
        output: {
          values: [result],
          error: err,
        } as OutputValue,
      });
    } catch (error) {
      console.error('Error fetching repository details:', error);
      throw error;
    }
  }
}
