## Ticket Greeter Bot Snap-In

This Snap-In automatically posts a welcome comment when a new ticket is created in DevRev.

### Features

- **Automatic Greeting**: Posts a welcome message on every new ticket
- **Customizable Messages**: Choose between happy, motivating, or default message types
- **Priority-Based Greetings**: Optional feature to send special messages for high-priority tickets
- **Configurable**: All messages can be customized via manifest inputs

### Getting Started

1. Install dependencies:
```bash
npm install
```

2. Test locally with a fixture:
```bash
npm run start:watch -- --functionName=ticket_greeter --fixturePath=ticket_created.json
```

### Configuration

The Snap-In supports the following configuration options (set in the manifest):

- **welcome_message_type**: Choose "happy", "motivating", or "default"
- **happy_message**: Custom message for happy greeting type
- **motivating_message**: Custom message for motivating greeting type
- **default_message**: Custom message for default greeting type
- **greet_by_priority**: Enable/disable priority-based greetings (boolean)
- **high_priority_message**: Custom message for high-priority tickets

All messages support the `%ticket_id%` placeholder which will be replaced with the actual ticket display ID.

### Building and Packaging

1. Build the project:
```bash
npm run build
```

2. Package for deployment:
```bash
npm run package
```

This creates a `build.tar.gz` file that can be uploaded when creating a snap-in version.

### Testing

You can test the Snap-In locally using the provided fixture file:
- `src/fixtures/ticket_created.json` - Sample ticket creation event

To test with different configurations, modify the `input_data.global_values` section in the fixture file.

### Function Structure

- `src/functions/ticket_greeter/index.ts` - Main function that handles ticket greeting logic
- `src/functions/ticket_greeter/utils/devrev-utils.ts` - DevRev API utilities
- `src/functions/ticket_greeter/utils/api-utils.ts` - HTTP API utilities

### How It Works

1. The Snap-In subscribes to `work_created` events via the DevRev webhook
2. The manifest filter ensures only ticket creation events are processed
3. When a ticket is created, the `ticket_greeter` function is triggered
4. The function:
   - Extracts ticket information
   - Determines which message type to use based on configuration
   - Checks if priority-based greeting is enabled (for high-priority tickets)
   - Replaces placeholders in the message
   - Posts the comment on the ticket using the DevRev API

