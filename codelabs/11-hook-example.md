# Codelab: Input Validation with Hooks

## Overview
This Snap-in demonstrates how to use `validate` hooks to ensure user inputs are valid before they are saved. This is a powerful way to enforce data integrity and prevent errors. In this example, we validate that an account ID is correct and that two stage inputs are not the same.

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.

## Step-by-Step Guide

### 1. Manifest
The `manifest.yaml` file defines a `validate` hook that points to the `validate_input` function. This hook is automatically triggered whenever a user tries to save the Snap-in's settings.

```yaml
version: '2'

name: RevOrg Info
description: Gets information about a revorg from an account.

service_account:
  display_name: 'RevOrg Bot'

inputs:
  organization:
    - name: account_id
      description: The ID of the account.
      field_type: text
      is_required: true
      default_value: 'don:identity:dvrv-us-1:devo/XXXXX:account/XXXXX'
      ui:
        display_name: Account ID
    - name: initial_stage
      description: The Initial Stage from which the stage is to be updated.
      field_type: enum
      allowed_values:
        [
          'Queued',
          'Awaiting Product Assist',
          'Awaiting Development',
          'In Development',
          'Work In Progress',
          'Awaiting Customer Response',
          'Resolved',
          'Canceled',
          'Accepted',
        ]
      default_value: 'Awaiting Customer Response'
      ui:
        display_name: Initial Stage
    - name: final_stage
      description: The Final Stage to which the stage is to be updated.
      field_type: enum
      allowed_values:
        [
          'Queued',
          'Awaiting Product Assist',
          'Awaiting Development',
          'In Development',
          'Work In Progress',
          'Awaiting Customer Response',
          'Resolved',
          'Canceled',
          'Accepted',
        ]
      default_value: 'Work In Progress'
      ui:
        display_name: Final Stage

functions:
  - name: validate_input
    description: Function to validate the input.

hooks:
  - type: validate
    function: validate_input
```

### 2. Code
The function at `11-hook-example/code/src/functions/validate_input/index.ts` validates that the initial and final stages are different and that the account ID is a valid DevRev account ID. If not, it throws an error, which is displayed to the user.

```typescript
// Validating the input by fetching the account details.
async function handleEvent(event: any) {
  // ... (setup code) ...

  // Extract the part ID and commits from the event
  const accountId = event.input_data.global_values['account_id'];
  const initialStage = event.input_data.global_values['initial_stage'];
  const finalStage = event.input_data.global_values['final_stage'];

  // Check the intitial and final stages are not equal
  if (initialStage === finalStage) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw 'Initial and final stages cannot be the same. Please provide different stages.';
  }

  try {
    // Create a timeline comment using the DevRev SDK
    const response = await devrevSDK.accountsGet({
      id: accountId,
    });
    console.log(JSON.stringify(response.data));
    // Return the response from the DevRev API
    return response;
  } catch (error) {
    console.error(error);
    // Handle the error here
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw 'Failed to fetch account details. Please provide the right account ID.';
  }
}
```

### 3. Run and Verify
Go to the Snap-in's settings page and try to save with invalid inputs (e.g., identical stages or a bad account ID). An error message, like "Initial and final stages cannot be the same," should appear.

## Explanation
`Validate` hooks allow you to run custom logic to validate Snap-in inputs. The hook is triggered before saving. If the function throws an error, the inputs are not saved, and the error message is displayed to the user.

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
