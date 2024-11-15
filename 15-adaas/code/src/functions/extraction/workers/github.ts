
// get list of github issues for a given repo
export async function getGithubIssues(authToken: string, repo_id: string) {
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
      console.log('issuesResponse', issuesResponse.length);
      return issuesResponse;
    };
  
    let page = 1;
    while (true) {
      console.log('page', page);
      const pageIssues = await fetchPage(page);

      // Filter out pull requests
      const filteredIssues = pageIssues.filter((issue: any) => !issue.pull_request);

      allIssues.push(...filteredIssues);
  
      if (pageIssues.length < perPage) {
        break;
      }
      page++;
    }
  
    return allIssues;
  }
  
  
export function extractAssigneesID(issues: any[]) {
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
  
export async function getGithubUsers(authToken: string, assignees: string[]) {
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
  