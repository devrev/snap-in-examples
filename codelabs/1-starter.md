# Codelab: Starter Snap-in

## Overview
This example provides a basic template for creating your own Snap-ins. It demonstrates the fundamental structure of a Snap-in, including how to define and register functions. Developers can use this as a starting point to build more complex automations.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.

## Step-by-Step Guide

### 1. Setup
This section guides you on setting up a new Snap-in project from scratch and explains the structure of this specific example.

#### Initializing a New Project
To create a new Snap-in, you'll use the DevRev CLI.

1.  **Initialize the project:** Run `devrev snap_in_version init <project_name>` to create a new project directory with a template structure. *(Reference: `init` documentation)*
2.  **Validate the manifest:** Before writing code, check the template `manifest.yaml` by running `devrev snap_in_version validate-manifest manifest.yaml`. *(Reference: `validate-manifest` documentation)*
3.  **Prepare test data:** Create a JSON file in `code/src/fixtures/` with a sample event payload for local testing.

#### Example Structure
This starter example contains a `code` directory with the following key files:
- `src/functions`: This directory contains the individual functions of your Snap-in.
- `src/function-factory.ts`: This file maps function names to their implementations.
- `src/fixtures`: This directory contains sample event payloads for testing.

### 2. Code
Here is the code for a basic function that logs the event payload it receives. This file is located at `1-starter/code/src/functions/function_1/index.ts`.

```typescript
/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */

export const run = async (events: any[]) => {
  /*
  Put your code here and remove the log below
  */

  console.info('events', events);
};

export default run;
```

### 3. Run
To run the function locally, navigate to the `1-starter/code` directory and run the following commands:

```bash
npm install
npm run start:watch -- --functionName=function_1 --fixturePath=function_1_event.json
```

### 4. Verify
After running the command, you should see the following output in your console, which indicates that the function has been executed successfully:

```
info: events [ { execution_metadata: { ... } } ]
```
The output will contain the full event payload from the `function_1_event.json` fixture.

## Explanation
This starter example uses a function factory pattern to dynamically load and execute functions. The `src/function-factory.ts` file imports all the functions from the `src/functions` directory and exports a factory function that returns the requested function based on the `functionName` parameter. This allows you to add new functions without modifying the core logic of the Snap-in. The local test runner (`npm run start:watch`) uses this factory to execute the specified function with the provided fixture.
