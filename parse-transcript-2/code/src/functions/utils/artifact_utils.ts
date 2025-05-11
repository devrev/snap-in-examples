import { client } from '@devrev/typescript-sdk';
import axios from 'axios';

export interface File {
  name: string;
  type: string;
  buffer: Buffer;
}

export const createArtifact = async (devrevClient: any, file: File): Promise<string> => {
  try {
      const artifact = await devrevClient.artifactsPrepare({
        file_name: file.name,
        file_type: file.type,
    });
    uploadArtifactToAWS(artifact.data, file);
    return artifact.data.id;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

async function uploadArtifactToAWS(data: any, file: File): Promise<void> {
  const url = data.url;
  const formData = new FormData();

  for (const fd of data.form_data) formData.append(fd.key, fd.value);

  const blob: any = new Blob([file.buffer], { type: file.type });
  blob.lastModified = new Date();
  blob.name = file.name;

  formData.append('file', blob);

  await makePostRequest(url, formData, {});
}

export async function makePostRequest(endpoint: string, payload: any, headers: any, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.post(endpoint, payload, { headers });
      return response.data;
    } catch (error: any) {
      console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries})`, {
        endpoint,
        error: error.message,
      });

      // Don't retry on client errors (except rate limiting)
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        break;
      }

      // If this is the last attempt, don't catch the error
      if (attempt === maxRetries - 1) throw error;

      const delay = 500 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// const test_string =
//   'This is a test string very long test string blah blah\nIt has now been new line delimited blah blah\n';
// const buffer = Buffer.from(test_string);
// const file = {
//   buffer: buffer,
//   name: 'test.txt',
//   type: 'text/plain',
// };

// const endpoint = 'https://api.dev.devrev-eng.ai/';
// const token =
//   'TOKEN';

// const devrevBetaClient = client.setupBeta({
//   endpoint: endpoint,
//   token: token,
// });

// const artifact_id = await createArtifact(devrevBetaClient, file);
// console.log(artifact_id);
