import { FunctionInput, Context, ExecutionMetadata, InputData } from '@devrev/typescript-sdk';
import { run } from '../functions/command_handler';

describe('Test some function', () => {
  const context: Context = {
    dev_oid: 'devOrgId',
    automation_id: 'automationId',
    source_id: 'sourceId',
    snap_in_id: 'snapInId',
    snap_in_version_id: 'snapInVersionId',
    service_account_id: 'serviceAccountId',
    secrets: {
      service_account_token: 'serviceAccountToken',
      actor_session_token: 'actorSessionToken',
    },
  };

  const executionMetadata: ExecutionMetadata = {
    request_id: 'requestId',
    function_name: 'functionName',
    event_type: 'eventType',
    devrev_endpoint: 'https://api.devrev.ai/',
  }

  const input_data: InputData = {
    keyrings: {
      github_connection: 'githubConnection',
    },
    global_values: {
      globalValue: 'globalValue',
    },
    event_sources: {
      eventSource: 'eventSource',
    },
  };

  const event: FunctionInput = {
    payload: {
      orgName: 'testOrg',
      repoName: 'testRepo',
      issueDetails: {
        title: 'testTitle',
        description: 'testDescription',
        issueDisplayName: 'testIssueDisplayName',
      },
    },
    context: context,
    execution_metadata: executionMetadata,
    input_data: input_data,
  };

  it('Something', () => {
    run([event]);
  });
});
