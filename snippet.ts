interface GetRepositoryInput {
  repository_url: string;
}

interface GetRepositoryOutput {
  description: string;
  forks_count: number;
  stargazers_count: number;
}

// Operation to get details of a GitHub repository
function get_repository(input: GetRepositoryInput): GetRepositoryOutput {
  // Some business logic on the input 

  // Return the output
  const result: GetRepositoryOutput = {
    description: "This is a test description",
    forks_count: 100,
    stargazers_count: 200,
  };
  return result;
}
