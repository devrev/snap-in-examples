import { client, publicSDK } from "@devrev/typescript-sdk";

export async function handleEvent(
  event: any,
) {
  const devrevPAT = event.context.secrets.service_account_token;
  const APIBase = event.execution_metadata.devrev_endpoint;
  const devrevSDK = client.setup({
    endpoint: APIBase,
    token: devrevPAT,
  })
  try {
    const response = await devrevSDK.worksList({
      limit: 1,
      type: [publicSDK.WorkType.Ticket]
    });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
}

export const run = async (events: any[]) => {
  /*
  Put your code here to handle the event.
  */
  for (let event of events) {
    await handleEvent(event);
  }
};

export default run;
