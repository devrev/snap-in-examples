import { OperationContext, OperationIfc, OperationOutput, Error_Type, ExecuteOperationInput } from "@devrev/typescript-sdk/dist/snap-ins";
import { DevrevSDKUtils } from "../common/utils/devrev_sdk_utils";
import logger from "../common/utils/logger";
import axios from "../common/utils/axios";
import FormData from 'form-data';
import { Readable } from 'stream';

interface Data {
  key: string;
  value: string;
}

interface ArtifactsPrepareResponse {
  url: string;
  id: string;
  form_data: Data[];
}

export class CreateArticle implements OperationIfc {
  public event: any;

  constructor(event: any) {
    this.event = event;
  }

  private async createArtifact(apiUtils: DevrevSDKUtils): Promise<ArtifactsPrepareResponse> {
    const response = await axios.post(`${apiUtils.endpoint}/internal/artifacts.prepare`, {
      file_name: 'test_article',
      file_type: 'devrev/rt'
    }, {
      headers: {
        'Authorization': `Bearer ${apiUtils.token}`
      }
    });
    return response.data;
  }

  private async uploadToS3(artifact_form_data: Data[], upload_url: string, content: string): Promise<any> {
    // Create RTE content as a buffer
    const rteContent = JSON.stringify({ 
      article: content,
      artifactIds: [] 
    });
    
    logger.info('RTE Content:', rteContent);
    
    const buffer = Buffer.from(rteContent, 'utf-8');
    const stream = Readable.from(buffer);

    const form = new FormData();
    artifact_form_data.forEach((data) => {
      logger.info('Form data entry:', data);
      form.append(data.key, data.value);
    });
    
    // Append the buffer as a file stream
    form.append('file', stream, {
      filename: 'test_article',
      contentType: 'application/json',
      knownLength: buffer.length // Add content length
    });
    
    logger.info('Uploading to URL:', upload_url);
    logger.info('Form headers:', form.getHeaders());
    
    return axios.post(upload_url, form, {
      headers: {
        ...form.getHeaders(),
        'Content-Length': form.getLengthSync()
      }
    });
  }

  private async prepareArtifact(apiUtils: DevrevSDKUtils, content: string): Promise<string> {
    try {
      // Create an artifact
      logger.info('Creating artifact...');
      const artifactResponse = await this.createArtifact(apiUtils);
      logger.info('Artifact created:', artifactResponse);

      const { form_data, url, id } = artifactResponse;
      
      // Upload to S3
      logger.info('Uploading to S3...');
      await this.uploadToS3(form_data, url, content);
      logger.info('Upload complete');
      
      return id;
    } catch (error: any) {
      logger.error('Error preparing artifact:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async run(metadata: OperationContext, input: ExecuteOperationInput, resources: Record<string, any>): Promise<OperationOutput> {
    const endpoint = metadata.devrev_endpoint;
    const token = metadata.secrets.access_token;
    const data = input.data as Record<string, any>;
    
    if (!data?.['content']) {
      return {
        error: {
          type: Error_Type.InvalidRequest,
          message: 'Content is required'
        },
        output: undefined,
        port_outputs: [],
      };
    }

    const apiUtils = new DevrevSDKUtils(endpoint, token);
    
    try {
      // Create the artifact
      const artifactId = await this.prepareArtifact(apiUtils, data['content']);
      logger.info('Created artifact with ID:', artifactId);

      // Create the article
      logger.info('Creating article...');
      const createArticleResponse = await axios.post(
        `${endpoint}/internal/articles.create`,
        {
          applies_to_parts: ['FEAT-1'],
          description: data['description'] || '',
          owned_by: ['DEVU-1'],
          resource: {
            artifacts: [artifactId],
          },
          title: data['title'] || 'BRD',
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const article = createArticleResponse.data.article;
      logger.info('Article created successfully');
      
      return {
        error: undefined,
        output: {
          values: [{
            article: article,
            message: 'Article created successfully'
          }]
        },
        port_outputs: [],
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      logger.error('Error creating article:', {
        message: errorMessage,
        response: error.response?.data,
        status: error.response?.status
      });
      
      return {
        error: {
          type: Error_Type.InvalidRequest,
          message: `Failed to create article: ${errorMessage}`
        },
        output: undefined,
        port_outputs: [],
      };
    }
  }

  GetContext(): OperationContext {
    const auth = this.event.context.secrets.access_token;
    const devorg = this.event.context.dev_oid;
    const devrevEndpoint = this.event.execution_metadata.devrev_endpoint;
    const inputPortName = this.event.payload.input_port_name;

    return {
      devrev_endpoint: devrevEndpoint,
      secrets: {
        access_token: auth,
      },
      dev_oid: devorg,
      input_port: inputPortName,
    };
  }
} 