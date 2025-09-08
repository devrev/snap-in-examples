# Codelab: Custom Operations

## Overview
This Snap-in demonstrates how to create custom operations for the DevRev Workflow Builder. Custom operations are reusable nodes that can simplify and enhance your workflows. This example includes three custom operations:
- **Get Temperature**: A simple operation that returns the temperature for a given city.
- **Post Comment on Ticket**: An operation that uses the DevRev SDK to post a comment to a ticket.
- **Send Slack Message**: An operation that connects to an external system (Slack) to send a message.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.
- A Slack workspace and a Slack app with a bot token (for the "Send Slack Message" operation).

## Step-by-Step Guide

### 1. Setup
This section guides you on setting up a new Snap-in project from scratch. Since this Codelab covers multiple operations, you can adapt the steps for each specific use case.

1.  **Initialize the project:** Run `devrev snap_in_version init <project_name>` to create a new project directory with a template structure. *(Reference: `init` documentation)*
2.  **Update the manifest:** Modify the `manifest.yaml` file to include your custom `operations` definitions.
3.  **Validate the manifest:** Before writing code, check your manifest by running `devrev snap_in_version validate-manifest manifest.yaml`. *(Reference: `validate-manifest` documentation)*
4.  **Prepare test data:** Create a JSON file in `code/src/fixtures/` with a sample event payload for local testing.

### 2. Get Temperature
This operation takes a city as input and returns the temperature for that city.

**Manifest**
```yaml
  - name: get_temperature
    display_name: Get Temperature
    description: Operation to get the temperature of a city
    slug: get_temperature
    function: operation_handler
    type: action
    # Inputs to the operation.
    inputs:
      fields:
        - name: city
          field_type: enum
          allowed_values:
          - New York
          - San Francisco
          - Los Angeles
          - Chicago
          - Houston
          is_required: true
          default_value: "New York"
          ui:
            display_name: City
    #  Outputs of the operation.
    outputs:
      fields:
        - name: temperature
          field_type: double
          ui:
            display_name: Temperature
    # Defines the timeout for the execution of the operation.
    execute_options:
      default_timeout: 45
```

**Code**
```typescript
import { client, publicSDK } from '@devrev/typescript-sdk';
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

interface GetTemperatureInput {
  city: string;
}

export class GetTemperature extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  // This is optional and can be used to provide any extra context required.
  override GetContext(): OperationContext {
    let baseMetadata = super.GetContext();
    const temperatures: Record<string, number> = {
      'New York': 72,
      'San Francisco': 65,
      Seattle: 55,
      'Los Angeles': 80,
      Chicago: 70,
      Houston: 90,
    };

    return {
      ...baseMetadata,
      metadata: temperatures,
    };
  }

  async run(_context: OperationContext, input: ExecuteOperationInput, _resources: any): Promise<OperationOutput> {
    const input_data = input.data as GetTemperatureInput;

    const temperature = _context.metadata ? _context.metadata[input_data.city] : null;

    let err: OperationError | undefined = undefined;
    if (!temperature) {
      err = {
        message: 'City not found',
        type: Error_Type.InvalidRequest,
      };
    }
    const temp = {
      error: err,
      output: {
        values: [{ "temperature": temperature }],
      } as OutputValue,
    }
    return OperationOutput.fromJSON(temp);
  }
}
```

### 3. Post Comment on Ticket
This operation takes a ticket ID and a comment as input and posts the comment to the ticket's timeline.

**Manifest**
```yaml
  - name: post_comment_on_ticket
    display_name: Post Comment on Ticket
    description: Operation to post a comment on ticket
    slug: post_comment_on_ticket
    function: operation_handler
    type: action
    inputs:
      fields:
        - name: id
          description: Ticket ID to post comment on.
          field_type: text
          is_required: true
          ui:
            display_name: Ticket ID
        - name: comment
          description: Comment to post on ticket.
          field_type: text
          is_required: true
          ui:
            display_name: Comment
    outputs:
      fields:
        - name: comment_id
          field_type: text
          ui:
            display_name: Comment ID
```

**Code**
```typescript
import { client } from '@devrev/typescript-sdk';
import { TimelineEntriesCreateRequestType } from '@devrev/typescript-sdk/dist/auto-generated/beta/beta-devrev-sdk';
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

interface PostCommentOnTicketInput {
  id: string;
  comment: string;
}

export class PostCommentOnTicket extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput, _resources: any): Promise<OperationOutput> {
    const input_data = input.data as PostCommentOnTicketInput;
    const ticket_id = input_data.id;
    const comment = input_data.comment;

    let err: OperationError | undefined = undefined;
    if (!ticket_id) {
      err = {
        message: 'Ticket ID not found',
        type: Error_Type.InvalidRequest,
      };
    }

    const endpoint = context.devrev_endpoint;
    const token = context.secrets.access_token;

    const devrevBetaClient = client.setupBeta({
      endpoint: endpoint,
      token: token,
    });
    let ticket;
    try {
      const ticketResponse = await devrevBetaClient.worksGet({
        id: ticket_id,
      });
      console.log(JSON.stringify(ticketResponse.data));
      ticket = ticketResponse.data.work;
    } catch (e: any) {
      err = {
        message: 'Error while fetching ticket details:' + e.message,
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
      });
    }

    try {
      const timelineCommentResponse = await devrevBetaClient.timelineEntriesCreate({
        body: comment,
        type: TimelineEntriesCreateRequestType.TimelineComment,
        object: ticket.id,
      });
      console.log(JSON.stringify(timelineCommentResponse.data));
      let commentID = timelineCommentResponse.data.timeline_entry.id;
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [{ comment_id: commentID }],
        } as OutputValue,
      });
    } catch (e: any) {
      err = {
        message: 'Error while posting comment:' + e.message,
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
      });
    }
  }
}
```

### 4. Send Slack Message
This operation takes a Slack channel ID and a message as input and posts the message to the specified channel.

**Manifest**
```yaml
  - name: send_slack_message
    display_name: Send Slack Message
    description: Operation to send a message to a Slack channel/thread
    slug: send_slack_message
    function: operation_handler
    type: action
    keyrings:
      - name: slack_token
        display_name: Slack Connection
        description: Connection to Slack
        types:
          - slack
    inputs:
      fields:
        - name: channel
          description: Channel to send message to.
          field_type: text
          is_required: true
          ui:
            display_name: Channel
        - name: message
          description: Message to send.
          field_type: rich_text
          is_required: true
          ui:
            display_name: Message
    outputs:
      fields:
        - name: message_id
          field_type: text
          ui:
            display_name: Message ID
```

**Code**
```typescript
import { client } from '@devrev/typescript-sdk';
import { TimelineEntriesCreateRequestType } from '@devrev/typescript-sdk/dist/auto-generated/beta/beta-devrev-sdk';
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

import { WebClient } from '@slack/web-api';

interface SendSlackMessageInput {
  channel: string;
  message: string;
}

export class SendSlackMessage extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }
  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const input_data = input.data as SendSlackMessageInput;
    const channel_id = input_data.channel;
    const comment = input_data.message;

    let err: OperationError | undefined = undefined;
    if (!channel_id) {
      err = {
        message: 'Channel ID not found',
        type: Error_Type.InvalidRequest,
      };
    }

    console.log("context:", context);

    const slack_token =  resources.keyrings.slack_token.secret;
    let slackClient;
    try {
      console.log('Creating slack client');
      slackClient = new WebClient(slack_token);
      console.log('Slack client created');
    } catch (e: any) {
      console.log('Error while creating slack client:', e.message);
      err = {
        message: 'Error while creating slack client:' + e.message,
        type: Error_Type.InvalidRequest,
      };
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [],
        } as OutputValue,
      });
    }
    console.log('Sending message to slack channel:', channel_id);
    try {
      const result = await slackClient.chat.postMessage({
        channel: channel_id,
        text: comment,
      });
      console.log('Message sent: ', result.ts);
      return OperationOutput.fromJSON({
        error: err,
        output: {
          values: [{ message_id: result.ts }],
        } as OutputValue,
      });
    } catch (e: any) {
      console.log('Error while sending message:', e.message);
      err = {
        message: 'Error while sending message:' + e.message,
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
```

## Explanation
Custom operations are defined in the `operations` section of the `manifest.yaml` file. Each operation has a name, a description, a slug, a function, a type, and a set of inputs and outputs. The logic for the operation is implemented in a class that extends the `OperationBase` class.
