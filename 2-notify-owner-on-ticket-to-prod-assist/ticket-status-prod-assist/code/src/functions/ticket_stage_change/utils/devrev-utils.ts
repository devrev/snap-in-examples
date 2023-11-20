/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

import { client } from "@devrev/typescript-sdk";

const DEVREV_API_BASE = "https://api.devrev.ai/";

export async function getPart(partID: string, token: string, api_base: string) {
    const devrevSDK = client.setup({
        endpoint: api_base,
        token: token,
    })
    try {
        let response = await devrevSDK.partsGet({
            id: partID,
        });
        return response.data;
    } catch (error) {
        console.log(error);
        return null;
    }
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

export async function ticketTimelineEntryCreate(ticketID: string, body: string, token: string, api_base: string ) {
    const devrevSDK = client.setup({
        endpoint: api_base,
        token: token,
    })
    let payload: any = {
        object: ticketID,
        type: "timeline_comment",
        body: body,
    }
    await devrevSDK.timelineEntriesCreate(payload);
}