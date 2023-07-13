/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import { postCall, getCall, generateQueryString } from "./api-utils"

const DEVREV_API_BASE = "https://api.devrev.ai/";

export async function getPart(partID: string, token: string) {
    const partGetPath = "parts.get?";
    let params: any = {
        ...(partID && { id: partID }),
    };
    let endpoint = DEVREV_API_BASE + partGetPath + generateQueryString(params);
    let part = await getCall(endpoint, token);
    if (!part)
        console.error("Unable to fetch part from the Part Id : " + partID);
    return part;
}

export async function getPartOwnersString(partObject: any) {
    let partOwnersString = "";
    // Making a string of part owners
    if ((partObject.part.owned_by).length == 0)
        return partOwnersString;
    let mentionUser = partObject.part.owned_by[0].id;
    partOwnersString = partOwnersString + "<" + mentionUser + ">";
    for (let i = 1; i < (partObject.part.owned_by).length; i++) {
        let mentionUser = partObject.part.owned_by[i].id;
        partOwnersString = partOwnersString + ", <" + mentionUser + ">";
    }
    return partOwnersString;
}

export async function ticketTimelineEntryCreate(ticketID: string, body: string, token: string) {
    const timelineEntryCreatePath = "timeline-entries.create";
    let endpoint = DEVREV_API_BASE + timelineEntryCreatePath;
    let payload: any = {
        object: ticketID,
        type: "timeline_comment",
        body: body,
    }
    await postCall(endpoint, payload, token);
}
