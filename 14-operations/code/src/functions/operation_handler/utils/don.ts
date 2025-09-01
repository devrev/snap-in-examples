export interface DONV2 {
    partition: string;
    objectType: string;
    objectID: string;
    service: string;
    components: { objectType: string; objectID: string }[];
    is_custom_leaf_type: boolean;
}

// source: https://github.com/devrev/devrev-web/blob/c75e03eae2b3aab9fe9833db8e7d257cb039aea7/libs/shared/utils/src/don/don.ts#L10
export const validDonRx =
    /^don:(?:[a-z][a-z0-9-]*):(?:[a-z][a-z0-9-]*)(?::[a-z][a-z0-9-_]*(?:\/[a-z][a-z0-9-_]*)?\/[a-zA-Z0-9-._]+)+(?<![._-])$/;

export const DON_BRACKET_RX = /don:(?:[a-z][a-z0-9-]*):(?:[a-z][a-z0-9-]*)(?::[a-z][a-z0-9-_]*(?:\/[a-z][a-z0-9-_]*)?\/[a-zA-Z0-9-._]+)+(?<![._-])/g;

const DON_BRACKET_FORMAT = (content: string) => `<${content}>`;

const DON_SERVICE_TYPES = ["identity", "core", "integration", "commerce", "discovery", "pulse", "data"];

export function parseDonV2(donV2: string): DONV2 {
    const donV2Parts = donV2.split(":");
    if (donV2Parts.length < 4) {
        console.error(`Must have at least 4 parts: ${donV2}`);
        return {} as DONV2;
    }
    if (donV2Parts[0] !== "don") {
        console.error(`Must have a valid don prefix: ${donV2}`);
        return {} as DONV2;
    }
    if (!DON_SERVICE_TYPES.includes(donV2Parts[1])) {
        console.error(`Must have a valid service : ${donV2}`);
        return {} as DONV2;
    }
    const components = donV2Parts.slice(3);
    let is_custom_leaf_type = false;
    let parsedComponents: { objectType: string; objectID: string }[] =
        components.map((component) => {
            const componentParts = component.split("/");
            if (componentParts[0] === "custom_object") {
                if (componentParts.length !== 3) {
                    console.error(`Must have valid custom object components : ${donV2}`);
                    return {} as { objectType: string; objectID: string };
                }
                is_custom_leaf_type = true;
                return { objectType: componentParts[1], objectID: componentParts[2] };
            }
            if (componentParts.length !== 2) {
                console.error(`Must have valid components : ${donV2}`);
                return {} as { objectType: string; objectID: string };
            }
            return { objectType: componentParts[0], objectID: componentParts[1] };
        });
    if (parsedComponents?.length === 0) {
        return {} as DONV2;
    }
    return {
        partition: donV2Parts[2],
        service: donV2Parts[1],
        components: parsedComponents,
        objectType: parsedComponents[parsedComponents.length - 1].objectType,
        objectID: parsedComponents[parsedComponents.length - 1].objectID,
        is_custom_leaf_type: is_custom_leaf_type,
    } as DONV2;
}

export function isValidDon(don: string): boolean {
    return validDonRx.test(don);
}

export function encloseDonsWithBrackets(input: string): string {
    return input.replace(DON_BRACKET_RX, (match) => DON_BRACKET_FORMAT(match));
}
