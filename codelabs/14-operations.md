# Codelab: Custom Operations

## Overview
This Snap-in demonstrates how to create custom operations for the DevRev Workflow Builder. Custom operations are reusable nodes that can simplify and enhance your workflows. This example includes three custom operations:
- **Get Temperature**: Returns the temperature for a given city.
- **Post Comment on Ticket**: Uses the DevRev SDK to post a comment to a ticket.
- **Send Slack Message**: Connects to Slack to send a message.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.
- A Slack workspace and bot token (for the "Send Slack Message" operation).

## 1. Get Temperature
This operation takes a city as input and returns its temperature.

### Manifest
```yaml
  - name: get_temperature
    display_name: Get Temperature
# ... (rest of manifest snippet)
```

### Code
```typescript
export class GetTemperature extends OperationBase {
  // ... (constructor and context logic) ...
  async run(_context: OperationContext, input: ExecuteOperationInput, _resources: any): Promise<OperationOutput> {
    const input_data = input.data as GetTemperatureInput;
    const temperature = _context.metadata ? _context.metadata[input_data.city] : null;
    // ... (return temperature) ...
  }
}
```

## 2. Post Comment on Ticket
This operation posts a comment to a ticket's timeline.

### Manifest
```yaml
  - name: post_comment_on_ticket
    display_name: Post Comment on Ticket
# ... (rest of manifest snippet)
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

## 3. Send Slack Message
This operation posts a message to a specified Slack channel.

### Manifest
```yaml
  - name: send_slack_message
    display_name: Send Slack Message
# ... (rest of manifest snippet)
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
Custom operations are defined in the `operations` section of `manifest.yaml`. Each has a name, description, slug, function, type, inputs, and outputs. The logic is implemented in a class that extends `OperationBase`.

## Getting Started from Scratch
To build this Snap-in from scratch, follow these steps:

1.  **Initialize Project**:
    - **TODO**: Use the `devrev snaps init` command to scaffold a new Snap-in project structure. This will create the basic directory layout and configuration files.

2.  **Update Manifest**:
    - **TODO**: Modify the generated `manifest.yaml` to define your Snap-in's name, functions, and event subscriptions, similar to the example provided in this guide.

3.  **Implement Function**:
    - **TODO**: Write your function's logic in the corresponding `index.ts` file within the `code/src/functions/` directory.

4.  **Test Locally**:
    - **TODO**: Create a test fixture (e.g., `event.json`) with a sample event payload. Use the `npm run start:watch` command to run your function and verify its behavior.
