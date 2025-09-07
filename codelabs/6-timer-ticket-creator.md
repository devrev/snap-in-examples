# Codelab: Timer-based Ticket Creator

## Overview
This Snap-in demonstrates how to create timer-based automations that perform actions on a schedule. This example automatically creates a new ticket every 10 minutes, which can be useful for recurring tasks or reminders.

## Prerequisites
- Node.js and npm installed.

## Step-by-Step Guide

### 1. Setup
The core of this Snap-in is the `timer-events` event source defined in the `manifest.yaml` file. This event source uses a cron expression to trigger the automation at a specified interval. In this example, the cron expression is `*/10 * * * *`, which means the automation will run every 10 minutes.

### 2. Code
The `6-timer-ticket-creator/code/src/functions/ticket_creator/index.ts` file contains the function that is executed by the timer automation. It uses the DevRev SDK to create a new ticket with a timestamped title and body.

```typescript
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
```

### 3. Run
Once the Snap-in is installed, the automation will start running automatically. No manual intervention is required.

### 4. Verify
Every 10 minutes, a new ticket will be created in the "PROD-1" part and assigned to the "DEVU-1" team. You can verify this by checking the tickets in your DevRev organization.

## Manifest
The `manifest.yaml` file defines the timer event source and the automation that creates the tickets.

```yaml
# For reference: https://github.com/devrev/snap-in-docs/blob/main/references/manifest.md.
# Refactor the code based on your business logic.

version: "2"

name: "Timely Ticketer"
description: "Snap-in to create ticket every 10 minutes"

# This is the name displayed in DevRev where the Snap-In takes actions using the token of this service account.
service_account:
    display_name: Automatic Ticket Creator Bot

event_sources:
    organization:
        - name: timer-event-source
          description: Event source that sends events every 10 minutes.
          display_name: Timer Event Source
          type: timer-events
          config:
            # CRON expression for triggering every 10 minutes.
            cron: "*/10 * * * *"
            metadata:
                event_key: ten_minute_event

functions:
    - name: ticket_creator
      description: Function to create a new ticket when triggered.

automations:
    - name: periodic_ticket_creator
      description: Automation to create a ticket every 10 minutes
      source: timer-event-source
      event_types:
        - timer.tick
      function: ticket_creator
```

## Explanation
This Snap-in uses a `timer-events` event source, which allows you to schedule automations using cron expressions. The `cron` field in the `config` section of the event source specifies the schedule. When the timer fires, it sends a `timer.tick` event, which triggers the `periodic_ticket_creator` automation. This automation then executes the `ticket_creator` function to create the new ticket.

## Next Steps
- Change the cron expression in the `manifest.yaml` to a different schedule. For example, to run every hour, you would use `0 * * * *`.
- Modify the `ticket_creator` function to create a different type of work item, such as an issue or a task.
- Add input fields to the Snap-in to allow users to customize the ticket title, body, part, and owner.
