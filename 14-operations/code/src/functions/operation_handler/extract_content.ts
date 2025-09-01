import {
  FunctionInput,
  OperationBase,
  OperationContext,
  ExecuteOperationInput,
  OperationOutput,
  Error_Type,
  OutputValue,
} from '@devrev/typescript-sdk/dist/snap-ins';

import axios from 'axios';
import { Buffer } from 'buffer';
import FormData from 'form-data';

enum PDFExtractStrategy {
  HiRes = 'hi_res',
  Fast = 'fast',
  HiResAdditional = 'hi_res_additional',
}

interface ArtifactContentExtractRequest {
  id: string;
  options?: {
    pdf_extractor_strategy: PDFExtractStrategy;
  };
}

interface ExtractContentInput {
  input_format: 'artifact' | 'url';
  artifact_id?: string;
  url?: string;
  max_content_length?: number;
  pdf_extract_strategy?: PDFExtractStrategy;
}

export class ExtractContent extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  private async createExtractedContentArtifact(context: OperationContext, content: string): Promise<any> {
    const req = {
      file_name: 'Extracted Content',
    };

    let artifactPrepareResponse: any;
    try {
      artifactPrepareResponse = await axios.post(
        `${context.devrev_endpoint}/internal/artifacts.prepare`,
        req,
        {
          headers: {
            Authorization: context.secrets.access_token,
            'Content-Type': 'application/json',
            'Connection': 'keep-alive',
          },
        },
      );
      if (artifactPrepareResponse.status !== 200) {
        throw new Error(`Failed to prepare artifact: ${artifactPrepareResponse.statusText}`);
      }
    } catch (error) {
      console.error(`Error preparing artifact: ${error}`);
      throw error;
    }

    // Add form data fields
    const formData = new FormData();
    for (const formItem of artifactPrepareResponse.data.form_data) {
      try {
        formData.append(formItem.key, formItem.value);
      } catch (err) {
        console.error(
          `error in appending form-item to form. Key: ${formItem.key}, Value: ${formItem.value}, err: ${err}`,
        );
        throw err;
      }
    }

    // Add the file content
    try {
      const contentBuffer = Buffer.from(content, 'utf-8');
      formData.append('file', contentBuffer, {
        filename: 'Extracted Content',
        contentType: 'text/plain',
      });
    } catch (err) {
      console.error(`error in creating form file. err: ${err}`);
      throw err;
    }

    try {
      const uploadResponse = await axios.post(
        artifactPrepareResponse.data.url,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        });
      if (uploadResponse.status !== 204) {
        throw new Error(`Failed to upload artifact: ${uploadResponse.statusText}`);
      }
      return artifactPrepareResponse.data.id;
    } catch (error) {
      console.error(`Error uploading artifact: ${error}`);
      throw error;
    }
  }

  async run(context: OperationContext, input: ExecuteOperationInput, _: Record<string, any>): Promise<OperationOutput> {
    const endpoint = `${context.devrev_endpoint}/internal/artifacts.contents.extract`;
    const token = context.secrets.access_token;
    const request = input.data as ExtractContentInput;
    const maxContentLength = Math.min(request.max_content_length || 500); // Default to 500KB
    const maxBytes = maxContentLength * 1024;

    if ((!request.artifact_id && !request.url) || (request.artifact_id && request.url)) {
      return OperationOutput.fromJSON({
        error: {
          message: 'Either artifact ID or URL must be provided, but not both',
          type: Error_Type.InvalidRequest,
        },
      });
    }

    let isTruncated = false;
    let extractedContent = '';

    if (request.url) {
      // Validate URL against regex
      const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)$/;
      if (!urlRegex.test(request.url)) {
        console.error(`Invalid URL: ${request.url}`);
        return OperationOutput.fromJSON({
          error: {
            message: 'Invalid URL',
            type: Error_Type.InvalidRequest,
          },
        });
      }
      try {
        const urlResponse = await axios.get(request.url);
        extractedContent = String(urlResponse.data);

        if (!extractedContent) {
          throw new Error('No content extracted from URL');
        }

        // check if length of extractedContent is greater than maxBytes, if yes truncate it to maxBytes
        if (extractedContent.length > maxBytes) {
          isTruncated = true;
          extractedContent = extractedContent.slice(0, maxBytes);
        }

        const artifactId = await this.createExtractedContentArtifact(context, extractedContent);

        return OperationOutput.fromJSON({
          output: {
            values: [{
              is_truncated: isTruncated,
              artifact_id: artifactId,
            }],
          } as OutputValue,
        });
      } catch (error: any) {
        return OperationOutput.fromJSON({
          error: {
            message: error.message,
            type: Error_Type.InvalidRequest,
          }
        });
      }
    } else {
      // Call the artifacts content extract API
      let req: ArtifactContentExtractRequest = {
        id: request.artifact_id || '',
      };
      if (request.pdf_extract_strategy) {
        req.options = {
          pdf_extractor_strategy: request.pdf_extract_strategy,
        };
      }

      try {
        const controller = new AbortController();
        const response = await axios.post(
          endpoint,
          req,
          {
            signal: controller.signal,
            headers: {
              Authorization: token,
              'Content-Type': 'application/json',
              'Connection': 'close'
            },
            responseType: 'stream',
            timeout: 30000, // 30 second timeout for the entire request
            maxContentLength: maxBytes * 2, // Limit axios buffer to 2x our target
            maxBodyLength: maxBytes * 2
          },
        );

        extractedContent = await new Promise<string>((resolve, reject) => {
          let accumulatedContent = '';
          let rawBuffer = '';
          let currentBytes = 0; // Track byte count incrementally
          let isResolved = false;
  
          const cleanup = () => {
            if (!isResolved) {
              isResolved = true;
              controller.abort();
              response.data.destroy();
              // Also destroy the underlying socket if available
              if (response.data && (response.data as any).socket) {
                (response.data as any).socket.destroy();
              }
            }
          };
  
          response.data.on('data', (chunk: Buffer) => {
            if (isResolved) return; // Ignore data if already resolved
  
            rawBuffer += chunk.toString();
  
            // Process complete lines only
            const lines = rawBuffer.split('\n');
            rawBuffer = lines.pop() || ''; // Keep incomplete line for next chunk
  
            for (const line of lines) {
              if (isResolved) break; // Exit early if already resolved
  
              if (!line.trim().startsWith('data:')) continue;
  
              const jsonStr = line.replace(/^data: /, '').trim();
              if (!jsonStr) continue;
              
              try {
                const data = JSON.parse(jsonStr);
                if (data.extracted_text) {
                  // Optimize: track byte count incrementally instead of recalculating
                  const newTextBytes = Buffer.byteLength(data.extracted_text);
                  const newTotalBytes = currentBytes + newTextBytes;
  
                  if (newTotalBytes >= maxBytes) {
                    // Calculate how much of the new text we can include
                    const remainingBytes = maxBytes - currentBytes;
                    let finalText = accumulatedContent;
  
                    if (remainingBytes > 0) {
                      // Add as much of the new text as we can fit
                      const truncatedNewText = data.extracted_text.slice(0, remainingBytes);
                      finalText += truncatedNewText;
                      // Only mark as truncated if we actually had to truncate
                      isTruncated = newTotalBytes > maxBytes;
                    }
  
                    isResolved = true;
                    controller.abort();
                    response.data.destroy();
                    resolve(finalText);
                    return;
                  }
  
                  // Only concatenate if we're under the limit
                  accumulatedContent += data.extracted_text;
                  currentBytes = newTotalBytes;
                }
              } catch (e) {
                console.error(`Error parsing JSON: ${e}`);
                cleanup();
                reject(e);
                return;
              }
            }
          });
  
          response.data.on('end', () => {
            if (!isResolved) {
              isResolved = true;
              resolve(accumulatedContent);
            }
          });
  
          response.data.on('error', (err: Error) => {
            if (!isResolved) {
              cleanup();
              reject(err);
            }
          });
        });

        if (!extractedContent) {
          throw new Error('No content extracted from file stream');
        }

        const artifactId = await this.createExtractedContentArtifact(context, extractedContent);

        return OperationOutput.fromJSON({
          output: {
            values: [{
              is_truncated: isTruncated,
              artifact_id: artifactId,
            }],
          } as OutputValue,
        });
      } catch (error: any) {
        console.error('Error extracting content: ', error);
        return OperationOutput.fromJSON({
          error: {
            message: error.message,
            type: Error_Type.InvalidRequest,
          }
        });
      }
    }
  }
}
