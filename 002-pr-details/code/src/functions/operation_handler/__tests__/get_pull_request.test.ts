import { GetPullRequest } from '../get_pull_request';
import { ExecuteOperationInput, FunctionInput, OperationContext, OperationMetadata_Type } from '@devrev/typescript-sdk/dist/snap-ins';

// Mock the @octokit/core module
jest.mock('@octokit/core', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    request: jest.fn()
  }))
}));

describe('GetPullRequest', () => {
  let getPullRequest: GetPullRequest;
  let mockContext: OperationContext;
  let mockResources: any;

  beforeEach(() => {
    // Initialize with empty FunctionInput
    getPullRequest = new GetPullRequest({} as FunctionInput);

    // Mock context and resources
    mockContext = {} as OperationContext;
    mockResources = {
      keyrings: {
        github_token: {
          secret: 'mock-token'
        }
      }
    };

    // Clear console logs
    console.log = jest.fn();
    console.error = jest.fn();
  });

  it('should successfully fetch pull request details', async () => {
    // Mock PR data
    const mockPRData = {
      title: 'Test PR',
      body: 'Test PR description',
      created_at: '2024-03-14T12:00:00Z'
    };

    // Mock Octokit response
    const mockOctokitResponse = {
      status: 200,
      data: mockPRData
    };

    // Setup Octokit mock
    const { Octokit } = require('@octokit/core');
    const mockRequest = jest.fn().mockResolvedValue(mockOctokitResponse);
    Octokit.mockImplementation(() => ({
      request: mockRequest
    }));

    // Create input with valid PR URL
    const input: ExecuteOperationInput = {
      metadata: {
        namespace: 'test-namespace',
        slug: 'test-slug',
        type: OperationMetadata_Type.Action
      },
      input_port_name: 'default',
      data: {
        pr_url: 'https://github.com/owner/repo/pull/123'
      }
    };

    // Execute the run method
    const result = await getPullRequest.run(mockContext, input, mockResources);

    // Verify Octokit was called with correct parameters
    expect(mockRequest).toHaveBeenCalledWith(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}',
      expect.objectContaining({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    );

    // Verify the output matches expected format
    expect(result.output?.values).toHaveLength(1);
    expect(result.output?.values[0]).toEqual({
      title: mockPRData.title,
      body: mockPRData.body,
      created_at: mockPRData.created_at
    });

    // Verify no errors were returned
    expect(result.error).toBeUndefined();
  });
}); 