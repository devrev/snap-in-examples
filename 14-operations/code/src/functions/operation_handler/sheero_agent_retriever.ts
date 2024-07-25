import { client, betaSDK } from '@devrev/typescript-sdk';
import { ArticleSearchSummary, SearchHybridNamespace, SearchHybridResponse, SearchResult, SearchResultType, TimelineEntriesCreateRequestType } from '@devrev/typescript-sdk/dist/auto-generated/beta/beta-devrev-sdk';
import {
    Error as OperationError,
    Error_Type,
    ExecuteOperationInput,
    FunctionInput,
    OperationBase,
    OperationContext,
    OperationOutput,
    OutputValue,
} from '@devrev/typescript-sdk/dist/snap-ins';
import axios from 'axios';
import { URLSearchParams } from 'url';
import { WebClient } from '@slack/web-api';

interface AgentRetrieverInput {
    query: string;
}

export class SheeroAgentRetriever extends OperationBase {
    event: any;

    constructor(e: FunctionInput) {
        super(e);
        this.event = e;
    }

    async extractData(token: string, search_results: SearchHybridResponse): Promise<string[]> {
        const results = search_results.results;
        const ARTICLES_GET_URL = "https://api.dev.devrev-eng.ai/internal/articles.get";
        const article_ids = results
            .filter((res: SearchResult) => res.type === SearchResultType.Article)
            .map((result: SearchResult) => {
                return (result as ArticleSearchSummary).article.id;
            });

        console.log('Article IDs:', article_ids);

        let article_urls = await Promise.all(
            article_ids.map(async (id: string) => {
                const response = await axios.post(ARTICLES_GET_URL, {
                    article_id: id,
                }, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });
                return response.data.article.extracted_content[0].original_url;
            })
        );

        article_urls = article_urls.filter((url: string | undefined) => url !== undefined);

        console.log('Article URLs:', article_urls);

        const article_data = await Promise.all(article_urls.map(async (url_string: string) => {
            // Do a GET request to the article URL and extract the data
            const url = new URL(url_string);
            const base_url = url.origin + url.pathname;
            const url_params = new URLSearchParams(url.search);

            // Construct object by looping over the URLSearchParams object
            let params = {}
            for (const [key, value] of url_params) {
                Object.defineProperty(params, key, {
                    value: value,
                    writable: true,
                    enumerable: true,
                    configurable: true
                });
            }

            console.log('URL:', base_url);
            console.log('Params:', params);

            const response = await axios.get(base_url, {
                params: params,
            });
            console.log('Response:', response.data)
            return response.data as string;
        }));

        console.log('Article Data:', article_data);

        return article_data;
        // return ["", ""]

    }


    private serializeSlackResults(response: any): any[] {
        const results = [];
        if (response.messages?.matches) {
            for (const match of response.messages.matches) {
                results.push(this.extractMessageData(match));
            }
        }
        if (response.files?.matches) {
            for (const match of response.files.matches) {
                results.push(this.extractFilesData(match));
            }
        }
        return results;
    }

    private extractMessageData(messageJson: any): any {
        const document: any = { type: "message" };
        if (messageJson.text) {
            document.text = messageJson.text;
        }
        if (messageJson.permalink) {
            document.url = messageJson.permalink;
        }
        if (messageJson.channel && messageJson.channel.name) {
            document.title = messageJson.channel.name;
        }
        return document;
    }

    private extractFilesData(fileJson: any): any {
        const document: any = { type: "file" };
        if (fileJson.permalink) {
            document.url = fileJson.permalink;
        }
        if (fileJson.title) {
            document.title = fileJson.title;
            document.text = fileJson.title;
        }
        return document;
    }

    async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
        const input_data = input.data as AgentRetrieverInput;
        const query = input_data.query;

        let err: OperationError | undefined = undefined;
        if (!query) {
            err = {
                message: 'Query is required',
                type: Error_Type.InvalidRequest,
            };
        }

        const slackToken = "SLACK-TOKEN";
        let slackClient: WebClient;
        try {
            slackClient = new WebClient(slackToken);
        } catch (e: any) {
            err = {
                message: 'Error while creating slack client for search:' + e.message,
                type: Error_Type.InvalidRequest,
            };
            return OperationOutput.fromJSON({
                error: err,
                output: {
                    values: [],
                } as OutputValue,
            });
        }

        const endpoint = context.devrev_endpoint;
        const token = context.secrets.access_token;

        const devrevBetaClient = client.setupBeta({
            endpoint: endpoint,
            token: token,
        });


        const sync_unit_filters = `sync_metadata__last_sync_in.sync_unit_id:"don:integration:dvrv-us-1:devo/1wvHAzmDBB:external_system_type/ZENDESK:external_system/sheero:sync_unit/715ed693-826d-47e8-9838-ffb792754ab4"`;

        const search_query = `${sync_unit_filters} ${query}`;

        let results: string[] = [];
        const ARTICLE_OBJ_TYPE = 'article';

        // If "articles" is in the object_types, then call searchHybrid since we only support articles for now
        // TODO: Add support for other object types later
        try {
            const searchResponse = await devrevBetaClient.searchHybrid({
                query: search_query,
                namespace: SearchHybridNamespace.Article,
                limit: 3,
            });

            results = await this.extractData(token, searchResponse.data);
        }
        catch (e: any) {
            err = {
                message: 'Error while searching for articles:' + e.message,
                type: Error_Type.InvalidRequest,
            };
            return OperationOutput.fromJSON({
                error: JSON.stringify({ "message": err.message }),
            });
        }

        try {
            // Make in:channel_1 in_channel_2 in_channel_3 query
            console.log('Query: ' + query)
            const result = await slackClient.search.messages({ query: query });
            const serializedResults = this.serializeSlackResults(result);
            // Assuming serializedResults is an array of objects as described

            for (const result of serializedResults) {
                // Template literal to format the string as required
                const formattedMessage = `Message: ${result.text}  URL: ${result.url}`;
                results.push(formattedMessage);
            }
            console.log(results)
            return OperationOutput.fromJSON({
                error: err,
                output: {
                    values: [{ results: JSON.stringify(results) }],
                } as OutputValue,
            });
        } catch (e: any) {
            err = {
                message: 'Error while searching:' + e.message,
                type: Error_Type.InvalidRequest,
            };
            return OperationOutput.fromJSON({
                error: err,
                output: {
                    values: [],
                } as OutputValue,
            });
        }
    }

    override GetContext(): OperationContext {
        // logger.info(JSON.stringify(this.event));
        const auth = this.event.context.secrets.access_token;
        const devorg = this.event.context.dev_oid
        const devrevEndpoint = this.event.execution_metadata.devrev_endpoint
        // const devrevEndpoint = "http://localhost:8080";
        const inputPortName = this.event.payload.input_port_name

        console.log("Context: ", JSON.stringify(
            {
                devrev_endpoint: devrevEndpoint,
                secrets: {
                    access_token: auth,
                },
                dev_oid: devorg,
                input_port: inputPortName,
            }
        ))

        return {
            devrev_endpoint: devrevEndpoint,
            secrets: {
                access_token: auth,
            },
            dev_oid: devorg,
            input_port: inputPortName,
        }
    }
}
