# Codelab: Timer-based Ticket Creator

## Overview
This Snap-in demonstrates how to create timer-based automations that perform actions on a schedule. This example automatically creates a new ticket every 10 minutes, which can be useful for recurring tasks or reminders.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.

## Step-by-Step Guide

### 1. Manifest
The `manifest.yaml` file defines a `timer-events` source that runs on a schedule. The `cron` expression `*/10 * * * *` triggers the automation every 10 minutes.

```yaml
version: "2"

name: "Timely Ticketer"
description: "Snap-in to create ticket every 10 minutes"

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

### 2. Code
The function at `6-timer-ticket-creator/code/src/functions/ticket_creator/index.ts` is executed by the timer. It uses the DevRev SDK to create a new ticket with a timestamped title and body.

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

### 3. Run and Verify
Once the Snap-in is installed, the automation starts automatically. Every 10 minutes, a new ticket will be created in the "PROD-1" part and assigned to the "DEVU-1" team. You can verify this by checking the tickets list in your DevRev organization.

## Explanation
This Snap-in uses a `timer-events` source to schedule automations with cron expressions. The `cron` field specifies the schedule. When the timer fires, it sends a `timer.tick` event, triggering the `periodic_ticket_creator` automation. This automation executes the `ticket_creator` function to create the new ticket.

## Getting Started from Scratch
To build this Snap-in from scratch, follow these steps:

1.  **Initialize Project**:
    - **TODO**: Use the `devrev snaps init` command to scaffold a new Snap-in project structure. This will create the basic directory layout and configuration files.

2.  **Update Manifest**:
    - **TODO**: Modify the generated `manifest.yaml` to define your Snap-in's name, functions, and event subscriptions, similar to the example provided in this guide.

3.  **Implement Function**:
    - **TODO**: Write your function's logic in the corresponding `index.ts` file within the `code/src/functions/` directory.

4.  **Test Locally**:
    - **TODO**: Create a test fixture (e.g., `event.json`) with a sample event payload. Use the `npm run start:watch` command to run your function and verify its behavior.
