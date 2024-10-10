import { testRunner } from '../../test-runner/test-runner';
import { client } from '@devrev/typescript-sdk';
import { handleEvent } from '.';

jest.mock('@devrev/typescript-sdk', () => ({
  client: {
    setup: jest.fn(),
  },
  publicSDK: {
    WorkType: {
      Ticket: 'ticket',
    },
  },
}));

describe('Example Index Test file', () => {
  it('Testing handleEvent', async () => {
    const mockSetup = jest.fn();
    client.setup = mockSetup;
    const mockWorkList = jest.fn();
    mockSetup.mockReturnValue({
      worksList: mockWorkList,
    });
    mockWorkList.mockReturnValue({
      data: {
        works: [
          {
            id: '123',
          },
        ],
      },
    });
    const event = {
      payload: {
        work_created: {
          work: {
            id: '123',
          },
        },
      },
      context: {
        secrets: {
          service_account_token: 'TEST-PAT',
        },
      },
      execution_metadata: {
        devrev_endpoint: 'https://devrev.com',
      },
    };
    const expectedResp = {
      works: [
        {
          id: '123',
        },
      ],
    };
    const response = await handleEvent(event);
    expect(response).toEqual(expectedResp);
  });
});

describe('Example Index Test file', () => {
  it('Testing the method', () => {
    testRunner({
      fixturePath: 'on_work_created_event.json',
      functionName: 'on_work_creation',
    });
  });
});
