import { OperationContext, OperationIfc, OperationOutput, Error_Type, ExecuteOperationInput } from "@devrev/typescript-sdk/dist/snap-ins";
import { DevrevSDKUtils } from "../common/utils/devrev_sdk_utils";
import { tryGetAsync } from "../common/utils/tryget";
import logger from "../common/utils/logger";
import axios from "../common/utils/axios";
import checkPropertyValue from "../common/utils/check_property";

const GET_ARTICLE_ENDPOINT = "/internal/articles.get";

export class GetArticleExtractedContent implements OperationIfc {
  public event: any;

  constructor(event: any) {
    this.event = event;
  }

  async run(metadata: OperationContext, input: ExecuteOperationInput, resources: Record<string, any>): Promise<OperationOutput> {
    const endpoint = metadata.devrev_endpoint;
    const token = metadata.secrets.access_token;
    const data = input.data as Record<string, any>;
    
    if (data === undefined) {
      logger.error(`received undefined data in GetArticleExtractedContent`);
      return {
        error: {
          type: Error_Type.InvalidRequest,
          message: `received undefined data in GetArticleExtractedContent`
        },
        output: undefined,
        port_outputs: [],
      };
    }

    // If content is directly provided in the input, return it
    if (data['content']) {
      logger.info('Using content provided in input data');
      return {
        error: undefined,
        output: {
          values: [{
            content: data['content']
          }]
        },
        port_outputs: [],
      };
    }

    const id = data['id'];
    if (!id) {
      logger.error('No id provided in input data');
      return {
        error: {
          type: Error_Type.InvalidRequest,
          message: 'No id provided in input data'
        },
        output: undefined,
        port_outputs: [],
      };
    }

    const apiUtils = new DevrevSDKUtils(endpoint, token);
    
    // Get article details using internal API
    const articleUrl = `${endpoint}${GET_ARTICLE_ENDPOINT}`;
    try {
      const articleResponse = await axios.post(articleUrl, {
        id: id
      }, {
        headers: {
          'Authorization': `${token}`
        }
      });

      // Get the extracted content URL from the response
      const extractedContent = articleResponse.data?.article?.extracted_content;
      if (!extractedContent || !Array.isArray(extractedContent) || extractedContent.length === 0) {
        // Handle case when no extracted content is available
      }
      
      // If you need the preview_url from the first artifact:
      const extractedContentUrl = extractedContent[0]?.preview_url;
      if (!extractedContentUrl) {
        logger.error('No extracted content URL found in article response');
        return {
          error: {
            type: Error_Type.InvalidRequest,
            message: 'No extracted content URL found in article response'
          },
          output: undefined,
          port_outputs: [],
        };
      }

      // Download the content from the S3 URL using the working implementation
      logger.info('Fetching content from S3...');
      const contentResponse = await axios.get(extractedContentUrl, {
        responseType: 'text',
        headers: {
          'Accept': '*/*'
        }
      });

      logger.info('Response status: ' + contentResponse.status);
      logger.info('Content type: ' + contentResponse.headers['content-type']);
      logger.info('Data preview: ' + contentResponse.data.substring(0, 200) + '...');

      return {
        error: undefined,
        output: {
          values: [{
            content: contentResponse.data,
            status: contentResponse.status,
            contentType: contentResponse.headers['content-type']
          }]
        },
        port_outputs: [],
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      logger.error('Error fetching article content:', {
        message: errorMessage,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      return {
        error: {
          type: Error_Type.InvalidRequest,
          message: `Failed to get article content: ${errorMessage}`
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
    };
  }
}