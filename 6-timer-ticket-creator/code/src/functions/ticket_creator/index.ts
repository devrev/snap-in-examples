import { client, publicSDK } from '@devrev/typescript-sdk';

export const run = async (events: any[]) => {
  for (const event of events) {
    const endpoint = event.execution_metadata.devrev_endpoint;
    const token = event.context.secrets.service_account_token;

    // Initialize the public SDK client
    const devrevSDK = client.setup({ endpoint, token });

    // Create a ticket. Name the ticket using the current date and time.
    const date = new Date();
    const ticketName = `Ticket created at ${date.toLocaleString()}`;
    const ticketBody = `This ticket was created by a snap-in at ${date.toLocaleString()}`;

    const reponse = await devrevSDK.worksCreate({
      title: ticketName,
      body: ticketBody,
      // The ticket will be created in the PROD-1 part. Rename this to match your part.
      applies_to_part: 'PROD-1',
      // The ticket will be owned by the DEVU-1 team. Rename this to match the required user.
      owned_by: ['DEVU-1'],
      type: publicSDK.WorkType.Ticket,
    });

    console.log(reponse);
  }
};

export default run;
