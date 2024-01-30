import { client } from '@devrev/typescript-sdk';

// Handles the event from GitHub
async function handleEvent(event: any) {
  // Extract necessary information from the event
  const token = event.context.secrets.service_account_token;
  const endpoint = event.execution_metadata.devrev_endpoint;

  // Set up the DevRev SDK with the extracted information
  const devrevSDK = client.setup({
    endpoint: endpoint,
    token: token,
  });

  // Extract the part ID and commits from the event
  const partID = event.input_data.global_values.part_id;
  const commits = event.payload.commits;

  // Iterate through commits and append the commit message to the body of the comment
  let bodyComment = '';
  for (const commit of commits) {
    bodyComment += commit.message + '\n';
  }

  // Prepare the body for creating a timeline comment
  const body = {
    body: bodyComment,
    object: partID,
    type: 'timeline_comment',
  };

  // Create a timeline comment using the DevRev SDK
  const response = await devrevSDK.timelineEntriesCreate(body as any);

  // Return the response from the DevRev API
  return response;
}

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
