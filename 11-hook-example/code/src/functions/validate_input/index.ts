import { client, FunctionInput } from '@devrev/typescript-sdk';

// Validating the input by fetching the account details.
async function handleEvent(event: FunctionInput) {
  // Extract necessary information from the event
  const token = event.context.secrets['service_account_token'];
  const endpoint = event.execution_metadata.devrev_endpoint;

  // Set up the DevRev SDK with the extracted information
  const devrevSDK = client.setupBeta({
    endpoint: endpoint,
    token: token,
  });

  // Extract the part ID and commits from the event
  const accountId = event.input_data.global_values['account_id'];
  const initialStage = event.input_data.global_values['initial_stage'];
  const finalStage = event.input_data.global_values['final_stage'];

  // Check the intitial and final stages are not equal
  if (initialStage === finalStage) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw 'Initial and final stages cannot be the same. Please provide different stages.';
  }

  try {
    // Create a timeline comment using the DevRev SDK
    const response = await devrevSDK.accountsGet({
      id: accountId,
    });
    console.log(JSON.stringify(response.data));
    // Return the response from the DevRev API
    return response;
  } catch (error) {
    console.error(error);
    // Handle the error here
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw 'Failed to fetch account details. Please provide the right account ID.';
  }
}

export const run = async (events: FunctionInput[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
