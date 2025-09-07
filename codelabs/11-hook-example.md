# Codelab: Input Validation with Hooks

## Overview
This Snap-in demonstrates how to use `validate` hooks to ensure that the inputs provided by users are valid before they are saved. This is a powerful way to enforce data integrity and prevent errors. In this example, we validate that an account ID is correct and that two stage inputs are not the same.

## Prerequisites
- Node.js and npm installed.

## Step-by-Step Guide

### 1. Setup
The `manifest.yaml` file defines a `validate` hook that points to the `validate_input` function. This hook is automatically triggered whenever a user tries to save the Snap-in's settings.

### 2. Code
The `11-hook-example/code/src/functions/validate_input/index.ts` file contains the logic for the validation hook. It checks two conditions:
1.  The initial and final stages are not the same.
2.  The account ID is a valid DevRev account ID.

If either of these conditions is not met, the function throws an error, which is displayed to the user.

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
To trigger the hook, go to the Snap-in's settings page and try to save the settings with invalid inputs. For example:
-   Set the "Initial Stage" and "Final Stage" to the same value.
-   Enter an invalid account ID.

### 4. Verify
When you try to save the settings with invalid inputs, you should see an error message. For example, if the stages are the same, you will see the message "Initial and final stages cannot be the same. Please provide different stages.".

## Manifest
The `manifest.yaml` file defines the inputs and the `validate` hook.

```yaml
version: '2'

name: RevOrg Info
description: Gets information about a revorg from an account.

# ... (service_account, inputs) ...

functions:
  - name: validate_input
    description: Function to validate the input.

hooks:
  - type: validate
    function: validate_input
```

## Explanation
`Validate` hooks are a powerful feature that allows you to run custom logic to validate the inputs of your Snap-in. The hook is triggered before the inputs are saved, and if the hook's function throws an error, the inputs are not saved and the error message is displayed to the user.

## Next Steps
- Add more validation rules to the `validate_input` function. For example, you could check that the `account_id` belongs to a specific organization.
- Create a new hook to perform a different type of action, such as sending a notification when the settings are changed.
- Use a `render` hook to dynamically change the appearance of the Snap-in's settings page based on the values of the inputs.
