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

interface GetDevRevObjectsInput {
    query: string;
    external_sync_unit_objects: string[];
}

interface ExternalSyncUnitObject {
    external_sync_unit_id: string;
    object_types: string[];
}

export class GetDevRevObjects extends OperationBase {
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

            const response = await axios.get(base_url, {
                params: params,
            });

            return response.data as string;
        }));

        console.log('Article Data:', article_data);

        return article_data;
        // return ["", ""]

    }

    async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
        const input_data = input.data as GetDevRevObjectsInput;
        const query = input_data.query;
        const external = input_data.external_sync_unit_objects;

        const sync_unit_info = external.map((obj: string) => {
            try {
                const obj_data = JSON.parse(obj);
                return {
                    external_sync_unit_id: obj_data.external_sync_unit_id,
                    object_types: obj_data.object_types,
                };
            } catch (e: any) {
                console.log('Error while parsing external sync unit object:', e.message);
                return {
                    external_sync_unit_id: '',
                    object_types: [],
                };
            }
        }).filter((obj: ExternalSyncUnitObject) => obj.external_sync_unit_id !== '');

        let err: OperationError | undefined = undefined;
        if (!query) {
            err = {
                message: 'Channel ID not found',
                type: Error_Type.InvalidRequest,
            };
        }

        const endpoint = context.devrev_endpoint;
        const token = context.secrets.access_token;
        // const ISSUE_ID = "don:core:dvrv-us-1:devo/1116OUfuKu:issue/1";

        const devrevBetaClient = client.setupBeta({
            endpoint: endpoint,
            token: token,
        });

        const object_types = Array.from(new Set(sync_unit_info.map((obj: ExternalSyncUnitObject) => obj.object_types).flat()));

        let results: string[] = [];
        const ARTICLE_OBJ_TYPE = 'article';

        // If "articles" is in the object_types, then call searchHybrid since we only support articles for now
        // TODO: Add support for other object types later
        if (object_types.includes(ARTICLE_OBJ_TYPE)) {
            try {
                const searchResponse = await devrevBetaClient.searchHybrid({
                    query: query,
                    namespace: SearchHybridNamespace.Article,
                    limit: 5,
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
        }


        return OperationOutput.fromJSON({
            error: err,
            output: {
                values: [{ results: JSON.stringify({ "results": results }) }],
            } as OutputValue,
        });


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
