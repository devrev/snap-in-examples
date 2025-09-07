# Codelab: Custom Operations

## Overview
This Snap-in demonstrates how to create custom operations that can be used in the DevRev Workflow Builder. Custom operations allow you to create reusable nodes for your workflows, which can help to simplify your workflows and make them more powerful. This example includes three custom operations:
- **Get Temperature**: A simple operation that returns the temperature for a given city.
- **Post Comment on Ticket**: An operation that uses the DevRev SDK to post a comment to a ticket.
- **Send Slack Message**: An operation that connects to an external system (Slack) to send a message.

## Prerequisites
- Node.js and npm installed.
- A Slack workspace and a Slack app with a bot token (for the "Send Slack Message" operation).

## Get Temperature
This operation takes a city as input and returns the temperature for that city.

### Manifest
```yaml
  - name: get_temperature
    display_name: Get Temperature
    description: Operation to get the temperature of a city
    slug: get_temperature
    function: operation_handler
    type: action
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
    outputs:
      fields:
        - name: temperature
          field_type: double
          ui:
            display_name: Temperature
```

### Code
```typescript
export class GetTemperature extends OperationBase {
  // ... (constructor) ...

  override GetContext(): OperationContext {
    // ... (provides temperature data) ...
  }

  async run(_context: OperationContext, input: ExecuteOperationInput, _resources: any): Promise<OperationOutput> {
    const input_data = input.data as GetTemperatureInput;
    const temperature = _context.metadata ? _context.metadata[input_data.city] : null;
    // ... (return temperature) ...
  }
}
```

## Post Comment on Ticket
This operation takes a ticket ID and a comment as input and posts the comment to the ticket's timeline.

### Manifest
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

### Code
```typescript
export class PostCommentOnTicket extends OperationBase {
  // ... (constructor) ...

  async run(context: OperationContext, input: ExecuteOperationInput, _resources: any): Promise<OperationOutput> {
    const input_data = input.data as PostCommentOnTicketInput;
    const ticket_id = input_data.id;
    const comment = input_data.comment;
    // ... (use DevRev SDK to post comment) ...
  }
}
```

## Send Slack Message
This operation takes a Slack channel ID and a message as input and posts the message to the specified channel.

### Manifest
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

### Code
```typescript
export class SendSlackMessage extends OperationBase {
  // ... (constructor) ...

  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const input_data = input.data as SendSlackMessageInput;
    const channel_id = input_data.channel;
    const comment = input_data.message;
    const slack_token =  resources.keyrings.slack_token.secret;
    // ... (use Slack WebClient to send message) ...
  }
}
```

## Explanation
Custom operations are defined in the `operations` section of the `manifest.yaml` file. Each operation has a name, a description, a slug, a function, a type, and a set of inputs and outputs. The logic for the operation is implemented in a class that extends the `OperationBase` class.

## Next Steps
- Create a new custom operation to perform a different action.
- Use the custom operations in this Snap-in to build a new workflow in the Workflow Builder.
- Explore the other types of operations, such as `query` and `event`.
