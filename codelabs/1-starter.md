# Codelab: Starter Snap-in

## Overview
This example provides a basic template for creating your own Snap-ins. It demonstrates the fundamental structure of a Snap-in, including how to define and register functions. Developers can use this as a starting point to build more complex automations.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.

## Step-by-Step Guide

### 1. Manifest
Since this is a starter template, you need to create the `manifest.yaml` file yourself. This file defines the Snap-in's metadata, functions, and event subscriptions. Create a file named `manifest.yaml` in the `1-starter/` directory with the following content:

```yaml
version: '1'
name: starter-snap-in
display_name: Starter Snap-in
summary: A basic template for creating Snap-ins
description: Demonstrates the fundamental structure of a Snap-in.
discoverable: true
level_of_support: devrev
tags:
  - starter
  - template
functions:
  - name: function_1
    description: Logs the event payload it receives.
    code_file: 1-starter/code
    is_public: true
event_sources:
  - type: devrev
    events:
      - work_created
```

### 2. Code
The code for the basic function is located at `1-starter/code/src/functions/function_1/index.ts`. It simply logs the event payload it receives.

```typescript
/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

export const run = async (events: any[]) => {
  for (const event of events) {
    console.info('Received event:', JSON.stringify(event, null, 2));
  }
};

export default run;
```

### 3. Run and Verify
To test the function locally, navigate to the `1-starter/code` directory and run the local test runner. This command executes `function_1` using a sample payload from `src/fixtures/function_1_event.json`.

```bash
npm install
npm run start:watch -- --functionName=function_1 --fixturePath=function_1_event.json
```

You should see detailed log output in your console, indicating successful execution. The output will look similar to this:

```
[9:21:49 PM] File change detected. Starting compilation...
[9:21:51 PM] Compilation finished.
info: Running function function_1
info: Received event: {
  "payload": {
    "work_created": {
      "work": {
        "id": "work-123",
        "title": "Fix login button"
      }
    }
  },
  "context": {
    "dev_user": {
      "id": "don-1"
    }
  },
  "execution_metadata": {
    "devrev_endpoint": "https://api.devrev.ai",
    "function_name": "function_1",
    "invocation_id": "inv-abc-123"
  }
}
```

## Explanation
This starter example demonstrates a simple Snap-in.
- **`manifest.yaml`**: Declares the Snap-in's properties, including its name and the `function_1` function. It subscribes this function to the `work_created` event.
- **`function_1/index.ts`**: Contains the core logic. When triggered by an event, it iterates through the event payloads and logs them to the console.
- **`function-factory.ts`**: Maps the function name from the manifest (`function_1`) to its implementation in the `code/` directory. This allows the test runner to find and execute the correct code.
- **Local Testing**: The `npm run start:watch` command simulates a DevRev event, allowing you to test your function's behavior locally without deploying it.

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
