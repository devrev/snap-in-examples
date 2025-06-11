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

interface GetPullRequestInput {
  pr_url: string;
}

export class GetPullRequest extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    console.log('Starting GetPullRequest operation');
    const input_data = input.data as GetPullRequestInput;
    const pr_url = input_data.pr_url;
    console.log('Pull Request URL:', pr_url);

    let err: OperationError | undefined = undefined;
    if (!pr_url) {
      err = {
        message: 'Pull Request URL not found',
        type: Error_Type.InvalidRequest,
      };
      console.error('Error:', err);
    }

    console.log("Context:", context);
    console.log("GitHub token exists:", !!resources.keyrings.github_token.secret);

    const github_token = resources.keyrings.github_token.secret;

    // Initialize Octokit
    const { Octokit } = require('@octokit/core');
    const octokit = new Octokit({ auth: github_token });

    // Extract owner, repo, and PR number from URL
    const githubPRRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)\/?$/;
    const match = pr_url.replace(/^<|>$/g, '').match(githubPRRegex);
    console.log('URL parsing result:', { match });

    if (!match || match.length !== 4) {
      console.error('Invalid pull request URL format:', pr_url);
      throw new Error('Invalid pull request URL format');
    }

    const [, owner, repo, pull_number] = match;
    console.log('Extracted owner/repo/PR:', { owner, repo, pull_number });

    try {
      // Fetch pull request details
      console.log('Fetching pull request details from GitHub...');
      const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
        owner,
        repo,
        pull_number: parseInt(pull_number),
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      console.log('GitHub API response status:', response.status);

      const result = {
        title: response.data.title,
        body: response.data.body || '',
        created_at: response.data.created_at
      }
      console.log('Final result:', result);

      return OperationOutput.fromJSON({
        output: {
          values: [result],
          error: err,
        } as OutputValue,
      });
    } catch (error) {
      console.error('Error fetching pull request details:', error);
      throw error;
    }
  }
} 