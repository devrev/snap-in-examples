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

interface YDCWebSearchInput {
  query: string;
  freshness: string;
  safe_search: string;
  num_web_results: number;
}

export class YDCWebSearch extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }
  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const input_data = input.data as YDCWebSearchInput;
    const query = input_data.query;
    const freshness = input_data.freshness;
    const safe_search = input_data.safe_search;
    const num_web_results = input_data.num_web_results;

    let err: OperationError | undefined = undefined;
    if (!query) {
      err = {
        message: 'Query not found',
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [],
        } as OutputValue,
      });
    }
   
    const ydc_api_key = resources.keyrings.ydc_api_key.secret;
    
    try {
      // Build the URL with query parameters
      const url = 'https://api.ydc-index.io/search';
      
      // Configure API request options
      const options = {
        method: 'GET',
        headers: {
          'X-API-Key': ydc_api_key
        },
        params: {
          query: query,
          freshness: freshness || 'day', // Default to 'day' if not provided
          safe_search: safe_search,
          num_web_results: num_web_results
        }
      };

      // Make the API call using axios
      const response = await axios(url, options);
      console.log("YDC Web Search Response: ", JSON.stringify(response.data, null, 2));
      //  For each 'hit', we only need title, snippets, and URL
      const hits = response?.data?.hits;
      const search_results = hits.map((hit: any) => ({
        title: hit.title,
        snippets: hit.snippets,
        url: hit.url
      }));
      console.log("User query: ", query)
      console.log("Search results: ", JSON.stringify(search_results, null, 2));
      // Return the successful response with the data
      return OperationOutput.fromJSON({
        error: undefined,
        output: {
          values: [{ search_results: search_results }],
        } as OutputValue,
      });
    } catch (error) {
      console.error('Error calling YDC Web Search API:', error);
      
      // Return an error response
      err = {
        message: `Failed to call YDC Web Search API: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
}
