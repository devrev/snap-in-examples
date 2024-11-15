import { GetRepository } from '../get_repository';
import { ExecuteOperationInput, FunctionInput, OperationContext, OperationMetadata_Type } from '@devrev/typescript-sdk/dist/snap-ins';
import { Octokit } from '@octokit/core';

// Mock the @octokit/core module
jest.mock('@octokit/core', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    request: jest.fn()
  }))
}));

describe('GetRepository', () => {
  let getRepository: GetRepository;
  let mockContext: OperationContext;
  let mockResources: any;

  beforeEach(() => {
    // Initialize with empty FunctionInput
    getRepository = new GetRepository({} as FunctionInput);

    // Mock context and resources
    mockContext = {} as OperationContext;
    mockResources = {
      keyrings: {
        github_connection: {
          secret: 'mock-token'
        }
      }
    };

    // Clear console logs
    console.log = jest.fn();
  });

  it('should successfully fetch repository details', async () => {
    // Mock repository data
    const mockRepoData = {
      description: 'Test Repository',
      forks_count: 42,
      stargazers_count: 100
    };

    // Mock Octokit response
    const mockOctokitResponse = {
      status: 200,
      data: mockRepoData
    };

    // Setup Octokit mock
    const mockRequest = jest.fn().mockResolvedValue(mockOctokitResponse);
    ((Octokit as unknown) as jest.Mock).mockImplementation(() => ({
      request: mockRequest
    }));

    // Create input with valid repository URL
    const input: ExecuteOperationInput = {
      metadata: {
        namespace: 'test-namespace',
        slug: 'test-slug',
        type: OperationMetadata_Type.Action
      },
      input_port_name: 'default',
      data: {
        repo_url: 'owner/repo'
      }
    };

    // Execute the run method
    const result = await getRepository.run(mockContext, input, mockResources);

    // Verify Octokit was called with correct parameters
    expect(mockRequest).toHaveBeenCalledWith(
      'GET /repos/{owner}/{repo}',
      expect.objectContaining({
        owner: 'owner',
        repo: 'repo'
      })
    );

    // Verify the output matches expected format
    expect(result.output?.values).toHaveLength(1);
    expect(result.output?.values[0]).toEqual({
      description: mockRepoData.description,
      forks_count: mockRepoData.forks_count
    });

    // Verify no errors were returned
    expect(result.error).toBeUndefined();
  });
});