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

import { Octokit } from '@octokit/core';

interface GetRepositoryInput {
  repo_url: string;
}

export class GetRepository extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    console.log('Starting GetRepository operation');
    const input_data = input.data as GetRepositoryInput;
    const repo_url = input_data.repo_url;
    console.log('Repository URL:', repo_url);

    let err: OperationError | undefined = undefined;
    if (!repo_url) {
      console.log('Error: Repository URL not provided');
      err = {
        message: 'Repository URL not found',
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [],
        } as OutputValue,
      });
    }

    // Parse owner and repo from URL
    const urlParts = repo_url.split('/');
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1];
    console.log('Parsed repository details:', { owner, repo });

    const github_token = resources.keyrings.github_connection.secret;
    console.log('GitHub token retrieved:', github_token ? 'Present' : 'Missing');
    const octokit = new Octokit({ auth: github_token });

    try {
      console.log('Sending request to GitHub API');
      const response = await octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo,
      });
      console.log('GitHub API response received:', {
        status: response.status,
        description: response.data.description,
        forks_count: response.data.forks_count
      });

      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [{
            description: response.data.description,
            forks_count: response.data.forks_count
          }],
        } as OutputValue,
      });
    } catch (e: any) {
      console.log('Error details:', {
        message: e.message,
        status: e.status,
        response: e.response?.data
      });
      console.log('Error while fetching repository details:', e.message);
      err = {
        message: 'Error while fetching repository details: ' + e.message,
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [],
        } as OutputValue,
      });
    }
  }
}
