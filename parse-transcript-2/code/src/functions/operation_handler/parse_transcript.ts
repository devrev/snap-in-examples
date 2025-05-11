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
import { client } from '@devrev/typescript-sdk';
import { formatTranscript } from '../utils/transcript_formatter';
import { createArtifact, File, makePostRequest } from '../utils/artifact_utils';


const ARTIFACTS_GET_ENDPOINT = '/internal/artifacts.get';

interface ParseTranscriptInput {
  transcript_id: string;
}

export class ParseTranscript extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }
  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const input_data = input.data as ParseTranscriptInput;
    const transcript_id = input_data.transcript_id;

    console.log("Parsing Transcript: ", transcript_id);

    let err: OperationError | undefined = undefined;
    if (!transcript_id) {
      err = {
        message: 'Transcript ID not found',
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [],
        } as OutputValue,
      });
    }

    const access_token = context.secrets.access_token;
    const devrev_endpoint = context.devrev_endpoint;

    const devrevBetaClient = client.setupBeta({
      endpoint: devrev_endpoint,
      token: access_token,
    });

    try {
      const headers = {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      };
      const endpoint = `${devrev_endpoint}${ARTIFACTS_GET_ENDPOINT}`;
      const payload = {
        id: transcript_id,
      };

      const response = await makePostRequest(endpoint, payload, headers);
      console.log("Response: ", response);
      const transcript_url = response.artifact.preview_url;

      console.log("Transcript URL: ", transcript_url);

      const transcript_response = await axios.get(transcript_url);
      const transcript_text = transcript_response.data;

      // Parse the JSON transcript and format it
      const parsed_transcript = JSON.parse(
        typeof transcript_text === 'string' ? transcript_text : JSON.stringify(transcript_text)
      );
      const formatted_transcript = formatTranscript(parsed_transcript);

      const file: File = {
        name: 'formatted_transcript.txt',
        type: 'text/plain',
        buffer: Buffer.from(formatted_transcript),
      };

      const artifact_id = await createArtifact(devrevBetaClient, file);
      
      console.log("Artifact ID: ", artifact_id);
      const output = OperationOutput.fromJSON({
        output: {
          values: [
            {
              artifact: artifact_id,
            },
          ],
        } as OutputValue,
      });

      console.log("Output: ", output);

      return output;
    } catch (error: any) {
      console.error("Error while parsing transcript: ", error);
      err = {
        message: `Error processing transcript: ${error.message}`,
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
