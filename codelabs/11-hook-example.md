# Codelab: Input Validation with Hooks

## Overview
This Snap-in demonstrates how to use `validate` hooks to ensure user inputs are valid before they are saved. This is a powerful way to enforce data integrity and prevent errors. In this example, we validate that an account ID is correct and that two stage inputs are not the same.

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
The `manifest.yaml` file defines a `validate` hook that points to the `validate_input` function. This hook is automatically triggered whenever a user tries to save the Snap-in's settings.

### 2. Code
The `11-hook-example/code/src/functions/validate_input/index.ts` file contains the validation logic. It checks that the initial and final stages are different and that the account ID is valid. If not, it throws an error.

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

### 3. Run
To trigger the hook, go to the Snap-in's settings page and try to save with invalid inputs (e.g., identical stages or a bad account ID).

### 4. Verify
An error message should appear, for example: "Initial and final stages cannot be the same. Please provide different stages."

## Manifest
The `manifest.yaml` file defines the inputs and the `validate` hook.

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

## Explanation
`Validate` hooks allow you to run custom logic to validate Snap-in inputs. The hook is triggered before saving. If the function throws an error, the inputs are not saved, and the error message is displayed to the user.
