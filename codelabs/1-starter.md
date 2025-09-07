# Codelab: Starter Snap-in

## Overview
This example provides a basic template for creating your own Snap-ins. It demonstrates the fundamental structure of a Snap-in, including how to define and register functions. Developers can use this as a starting point to build more complex automations.

## Prerequisites
- Node.js and npm installed.

## Step-by-Step Guide

### 1. Setup
The starter example contains a `code` directory with the following structure:
- `src/functions`: This directory contains the individual functions of your Snap-in. Each function is in its own subdirectory.
- `src/function-factory.ts`: This file is responsible for mapping function names to their implementations.
- `src/fixtures`: This directory contains sample event payloads for testing your functions locally.

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

## Next Steps
- Add a new function to the `src/functions` directory and register it in `src/function-factory.ts`.
- Modify the existing `function_1` to perform a specific action, such as creating a new ticket or sending a notification.
- Explore other examples in this repository to learn about more advanced features.
