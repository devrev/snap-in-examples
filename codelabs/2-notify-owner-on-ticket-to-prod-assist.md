# Codelab: Notify Owner on Ticket to Prod Assist

## Overview
This Snap-in automatically posts a comment on a ticket when its stage is changed to "Awaiting Product Assist". This helps ensure that the ticket gets the attention of the relevant part owner.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.

## Step-by-Step Guide

### 1. Setup
This section guides you on setting up a new Snap-in project from scratch and explains the structure of this specific example.

#### Initializing a New Project
To create a new Snap-in, you'll use the DevRev CLI.

1.  **Initialize the project:** Run `devrev snap_in_version init <project_name>` to create a new project directory with a template structure. *(Reference: `init` documentation)*
2.  **Validate the manifest:** Before writing code, check the template `manifest.yaml` by running `devrev snap_in_version validate-manifest manifest.yaml`. *(Reference: `validate-manifest` documentation)*
3.  **Prepare test data:** Create a JSON file in `code/src/fixtures/` with a sample event payload for local testing.

#### Example Structure
This example consists of a single function, `ticket_stage_change`, which is triggered by a `work_updated` event. The `manifest.yaml` file defines the automation that connects the event to the function.

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

### 3. Run
To run the function locally, you can use the provided fixture. Navigate to the `2-notify-owner-on-ticket-to-prod-assist/code` directory and run:

```bash
npm install
npm run start:watch -- --functionName=ticket_stage_change --fixturePath=work_updated_event.json
```

### 4. Verify
After moving a ticket to the "Awaiting Product Assist" stage, a comment will be posted to the timeline of the ticket, notifying the part owner. If the part is owned by a bot, a generic message is posted.

## Manifest
The `manifest.yaml` file for this Snap-in defines the event source, the function, and the automation that ties them together.

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

## Explanation
This Snap-in listens for `work_updated` events. When a ticket is updated, the `ticket_stage_change` function is invoked. The function checks if the ticket's stage has changed to "awaiting_product_assist". If it has, the function fetches the part owner's information and uses the `ticketTimelineEntryCreate` utility function to post a comment on the ticket, notifying the owner.
