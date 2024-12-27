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
