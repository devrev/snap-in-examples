# Codelab: Notify Owner on Ticket to Prod Assist

## Overview
This Snap-in automatically posts a comment on a ticket when its stage is changed to "Awaiting Product Assist". This helps ensure that the ticket gets the attention of the relevant part owner.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.

## Step-by-Step Guide

### 1. Manifest
The `manifest.yaml` file defines the Snap-in's automation, connecting the `work_updated` event to the `ticket_stage_change` function.

```yaml
version: "2"
name: "Notify On Prod Assist"
description: "Snap-In to post a comment on a ticket when its stage changes to 'Awaiting Product Assist'"

service_account:
  display_name: "DevRev Bot"

event_sources:
  organization:
    - name: devrev-webhook
      description: Source listening for work_updated events from DevRev.
      display_name: DevRev Webhook
      type: devrev-webhook
      config:
        event_types:
          - work_updated

functions:
  - name: ticket_stage_change
    description: Function to post a comment on a ticket when its stage changes to "Awaiting Product Assist".

automations:
  - name: add_comment_on_ticket_stage_change
    source: devrev-webhook
    event_types:
      - work_updated
    function: ticket_stage_change
```

### 2. Code
The core logic is in `2-notify-owner-on-ticket-to-prod-assist/code/src/functions/ticket_stage_change/index.ts`. It checks if the ticket has been moved to the "awaiting_product_assist" stage and, if so, posts a comment to the ticket timeline.

```typescript
/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import {
	getPart,
	getPartOwnersString,
	ticketTimelineEntryCreate,
} from "./utils/devrev-utils"
import {
	sprintf
} from 'sprintf-js';

// Timeline Comment if the part owner of a ticket is devrev-bot
const BOT_PART_OWNER_NOTIF: string = `Hey, this ticket moved to Product Assist stage and may need attention.`;
const PART_OWNER_NOTIF: string = `Hey %s, this ticket moved to Product Assist stage and may need your attention. You are being notified because you are the part owner of this ticket.`;

async function EventListener(event: any) {
	const oldStage: string = event.payload.work_updated.old_work.stage.name;
	const currStage: string = event.payload.work_updated.work.stage.name;
	const workType: string = event.payload.work_updated.work.type;
	const snap_in_token = event.context.secrets.service_account_token;
	try {
		if (!(
			currStage === "awaiting_product_assist" &&
			oldStage !== "awaiting_product_assist" &&
			workType === "ticket"
		)) return;

		const ticketID = event.payload.work_updated.work.id;
		const partID = event.payload.work_updated.work.applies_to_part.id;
		const partObject = await getPart(partID, snap_in_token);

		console.log(`Ticket ${ticketID} moved to Product Assist stage`);

		if ((partObject.part.owned_by).length == 1 && partObject.part.owned_by[0].type != "dev_user") {
			console.log("A bot is the part owner");
			await ticketTimelineEntryCreate(ticketID, BOT_PART_OWNER_NOTIF, snap_in_token);
		} else {
			let partOwners = await getPartOwnersString(partObject);
			if (partOwners != "") {
				console.log("Creating timeline entry for the part owners");
				await ticketTimelineEntryCreate(ticketID, sprintf(PART_OWNER_NOTIF, [partOwners]), snap_in_token);
			} else
				console.log("No part owners to notify regarding the stage change");
		}
	} catch (error) {
		console.error('Error: ', error);
	}
}

export const run = async (events: any[]) => {
	for (let i = 0; i < events.length; i++) {
		await EventListener(events[i]);
	}
};
export default run;
```

### 3. Run and Verify
To test the function locally, navigate to the `2-notify-owner-on-ticket-to-prod-assist/code` directory and run the local test runner.

```bash
npm install
npm run start:watch -- --functionName=ticket_stage_change --fixturePath=work_updated_event.json
```

The test runner will simulate a `work_updated` event. You should see logs indicating that the function was called and that it attempted to post a timeline entry.

```
info: Running function ticket_stage_change
info: Ticket TKT-123 moved to Product Assist stage
info: Creating timeline entry for the part owners
```

When deployed, moving a ticket to the "Awaiting Product Assist" stage will post a comment on the ticket's timeline.

## Explanation
This Snap-in listens for `work_updated` events as defined in the manifest. When a ticket's stage changes to "awaiting_product_assist", the `ticket_stage_change` function is triggered. The function fetches the part owner and posts a formatted comment to the ticket's timeline, tagging the owner.

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
