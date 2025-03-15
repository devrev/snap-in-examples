import { OperationContext, OperationIfc, OperationOutput, Error_Type, ExecuteOperationInput } from "@devrev/typescript-sdk/dist/snap-ins";
import logger from "../common/utils/logger";
import checkPropertyValue from "../common/utils/check_property";
import fetch from 'node-fetch';
import { Response } from 'node-fetch';
import { Readable } from 'stream';
const he = require('he');

async function parsePayload(payload: string): Promise<Record<string, any>> {
    if (payload.includes('&lbrace;') || payload.includes('&rbrace;')) {
        payload = he.decode(payload);
    }

    try {
        return JSON.parse(payload);
    } catch (parseError) {
        // Try cleaning the payload if initial parse fails
        const cleanPayload = payload.replace(/^\uFEFF/, '').trim();
        return JSON.parse(cleanPayload);
    }
}

async function processStreamingResponse(response: Response): Promise<Record<string, any>> {
    let lastJsonObject: Record<string, any> | null = null;
    let buffer = '';

    // Get the body as a readable stream
    const stream = response.body as Readable;

    if (!stream) {
        throw new Error('Response body stream is not available');
    }

    return new Promise<Record<string, any>>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
            // Convert buffer to string and add to existing buffer
            buffer += chunk.toString('utf8');

            // Split by newlines and process each line
            const lines = buffer.split('\n');
            // Keep the last potentially incomplete line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        let jsonStr = line;

                        // Handle SSE format (data: {json})
                        if (line.startsWith('data:')) {
                            jsonStr = line.substring(5).trim();
                        }

                        const parsedObject: Record<string, any> = JSON.parse(jsonStr);
                        lastJsonObject = parsedObject;
                        logger.info(`Received JSON object: ${jsonStr.substring(0, 100)}...`);
                    } catch (err) {
                        logger.error(`Failed to parse JSON line: ${line}`);
                    }
                }
            }
        });

        stream.on('end', () => {
            // Process anything remaining in the buffer
            if (buffer.trim()) {
                try {
                    let jsonStr = buffer;

                    // Handle SSE format (data: {json})
                    if (buffer.startsWith('data:')) {
                        jsonStr = buffer.substring(5).trim();
                    }

                    const parsedObject: Record<string, any> = JSON.parse(jsonStr);
                    lastJsonObject = parsedObject;
                } catch (err) {
                    logger.error(`Failed to parse remaining buffer: ${buffer}`);
                }
            }
            resolve(lastJsonObject || {});
        });

        stream.on('error', (error: Error) => {
            logger.error(`Error reading stream: ${error}`);
            reject(error);
        });
    });
}

async function makeApiCall(url: string, method: string, payloadObj: Record<string, any>, authorization: string): Promise<Record<string, any>> {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': authorization || '',
    };

    const requestOptions = {
        method: method || 'POST',
        headers: headers,
        body: method !== 'GET' ? JSON.stringify(payloadObj) : undefined,
    };

    const response = await fetch(url, requestOptions);

    // Check if the response is a stream
    const contentType = response.headers.get('content-type');
    if (contentType && (
        contentType.includes('application/x-ndjson') ||
        contentType.includes('text/event-stream')
    )) {
        // Handle streaming JSON response
        return processStreamingResponse(response);
    } else {
        try {
            // Handle regular JSON response
            return await response.json() as Record<string, any>;
        } catch (error) {
            // If JSON parsing fails, check if it might be a streaming response
            // that wasn't properly identified by the content-type header
            if (response.body) {
                logger.info('Regular JSON parsing failed, trying to process as streaming response');
                return processStreamingResponse(response);
            }
            throw error;
        }
    }
}

export class APICall implements OperationIfc {
    public event: any;

    constructor(event: any) {
        this.event = event;
    }

    async run(metadata: OperationContext, input: ExecuteOperationInput, resources: Record<string, any>): Promise<OperationOutput> {
        const data = input.data as Record<string, any>;
        if (data === undefined) {
            logger.error(`received undefined data in APICall`);
            return {
                error: {
                    type: Error_Type.InvalidRequest,
                    message: `received undefined data in APICall`
                },
                output: undefined,
                port_outputs: [],
            };
        }

        const url = data['url'];
        // Check if method is provided and is one of GET, POST, PUT, DELETE. If not, set it to POST.
        const method = data['method'];
        let authorization = data['authorization'];
        const payload = data['payload'];

        if (!url) {
            return {
                error: {
                    type: Error_Type.InvalidRequest,
                    message: 'URL is required'
                },
                output: undefined,
                port_outputs: [],
            };
        }

        // Check if authorization is empty and URL contains devrev. If so, use the access token from the metadata.
        if ((!authorization || authorization === '') && url.toLowerCase().includes('devrev')) {
            authorization = metadata.secrets.access_token;
        }

        try {
            // Fix payload handling logic
            let payloadObj: Record<string, any> = {};
            if (payload && payload !== '') {
                payloadObj = await parsePayload(payload);
            }
            const responseData = await makeApiCall(url, method, payloadObj, authorization);

            return {
                error: undefined,
                output: {
                    values: [{ response: responseData }],
                },
                port_outputs: [],
            };
        } catch (error) {
            logger.error(`API call failed with error: ${error}`);

            return {
                error: {
                    type: Error_Type.InvalidRequest,
                    message: error instanceof Error
                        ? error.message
                        : `API call failed with error: ${error}`
                },
                output: undefined,
                port_outputs: [],
            };
        }
    }

    GetContext(): OperationContext {
        logger.info(JSON.stringify(this.event));
        const auth = checkPropertyValue(this.event, 'context.secrets.access_token');
        const devorg = checkPropertyValue(this.event, 'context.dev_oid');
        const devrevEndpoint = checkPropertyValue(this.event, 'execution_metadata.devrev_endpoint');
        const inputPortName = checkPropertyValue(this.event, 'payload.input_port_name');

        return {
            devrev_endpoint: devrevEndpoint.value,
            secrets: {
                access_token: auth.value,
            },
            dev_oid: devorg.value,
            input_port: inputPortName.value,
        }
    }
}