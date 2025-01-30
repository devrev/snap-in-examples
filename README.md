## Steps

1. **Define Operation in Manifest**
   Add your operation under the `operations` section in `manifest.yaml`:

   ```yaml
   operations:
     - name: "My Operation"           # Display name shown in UI
       display_name: "My Operation"    
       description: "Operation description"
       slug: "my_operation"           # Unique identifier
       function: operation_handler    # Function that handles the operation
       type: action                   # Operation type 
       inputs:                        # Define input schema
         fields:
           - name: input_field
             field_type: text        
             is_required: true
             ui:
               display_name: "Input Field"
       outputs:                      # Define output schema
         fields:
           - name: output_field
             field_type: text
             ui:
               display_name: "Output Field"
       keyrings:                     # Optional: Define external service connections
         - name: external_service
           display_name: "External Service"
           types: 
             - service_type
   ```

2. **Create Operation Handler**
   Create a new TypeScript class that extends `OperationBase`:

   ```typescript
   import { 
     OperationBase,
     OperationContext,
     ExecuteOperationInput,
     OperationOutput,
     Error as OperationError,
     Error_Type
   } from '@devrev/typescript-sdk/dist/snap-ins';

   interface MyOperationInput {
     input_field: string;
   }

   export class MyOperation extends OperationBase {
     constructor(e: FunctionInput) {
       super(e);
     }

     async run(
       context: OperationContext,      // Contains endpoint, tokens etc
       input: ExecuteOperationInput,   // Contains input data
       resources: any                  // Contains keyring secrets
     ): Promise<OperationOutput> {
       // Extract input data
       const input_data = input.data as MyOperationInput;
       
       // Access DevRev endpoint and token if needed
       const endpoint = context.devrev_endpoint;
       const token = context.secrets.access_token;
       
       // Access external service token if defined in keyrings
       const external_token = resources.keyrings.external_service.secret;

       try {
         // Operation logic here
         const result = "success";

         // Return output
         return OperationOutput.fromJSON({
           output: {
             values: [{ output_field: result }]
           }
         });
       } catch (e: any) {
         // Handle errors
         return OperationOutput.fromJSON({
           error: {
             message: e.message,
             type: Error_Type.InvalidRequest
           }
         });
       }
     }
   }
   ```

3. **Register Operation**
   Add the operation to the `operationMap` in your handler's index file:

   ```typescript
   const operationMap: OperationMap = {
     my_operation: MyOperation,
     // ... other operations
   };
   ```

# DevRev CLI Commands Guide

## Prerequisites
1. Install the DevRev CLI
   ```bash
   # For installation instructions, visit:
   # https://developer.devrev.ai/public/snapin-development/references/cli-install
   devrev --version
   ```

## Authentication
2. Login to the DevRev CLI
   ```bash
   devrev profiles authenticate -o <org> -u <email>
   ```

## Snap-in Package
3. Create a new snap-in package
   ```bash
   devrev snap_in_package create-one --slug <slug> | jq .
   ```

## Local Development
4. Set up local development environment
   ```bash
   # Start ngrok tunnel
   ngrok http 8000

   # Start test server
   npm run test:server

   # Create snap-in version with testing URL
   devrev snap_in_version create-one --manifest <manifest path> --create-package --testing-url <HTTP_URL>

   # View snap-in version details
   devrev snap_in_version show
   ```

## Deployment
5. Deploy locally
   ```bash
   devrev snap_in draft | jq .
   ```

Open the snap-in page using the given URL and configure the snap-in. 

6. Deploy to production infrastructure
   ```bash
   devrev snap_in_version upgrade --path .
   ```
