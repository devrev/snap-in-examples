import { client } from '@devrev/typescript-sdk';
import {
  Error as OperationError,
  Error_Type,
  ExecuteOperationInput,
  FunctionInput,
  OperationBase,
  OperationContext,
  OperationOutput,
  OutputValue,
} from '@devrev/typescript-sdk/dist/snap-ins';

interface GetCurrentTimeInput {
  query: string;
}

export class GetCurrentTime extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(context: OperationContext, input: ExecuteOperationInput, resources: any): Promise<OperationOutput> {
    const currentTime = new Date().toISOString();
    
    return OperationOutput.fromJSON({
      summary: `Current time: ${currentTime}`,
      output: {
        values: [{ current_time: currentTime }],
      } as OutputValue,
    });
  }
}
