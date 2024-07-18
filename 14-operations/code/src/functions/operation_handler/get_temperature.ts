import { client, publicSDK } from '@devrev/typescript-sdk';
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

interface GetTemperatureInput {
  city: string;
}

export class GetTemperature extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  // This is optional and can be used to provide any extra context required.
  override GetContext(): OperationContext {
    let baseMetadata = super.GetContext();
    const temperatures: Record<string, number> = {
      'New York': 72,
      'San Francisco': 65,
      Seattle: 55,
      'Los Angeles': 80,
      Chicago: 70,
      Houston: 90,
    };

    return {
      ...baseMetadata,
      metadata: temperatures,
    };
  }

  async run(_context: OperationContext, input: ExecuteOperationInput, _resources: any): Promise<OperationOutput> {
    const input_data = input.data as GetTemperatureInput;

    const temperature = _context.metadata ? _context.metadata[input_data.city] : null;

    let err: OperationError | undefined = undefined;
    if (!temperature) {
      err = {
        message: 'City not found',
        type: Error_Type.InvalidRequest,
      };
    }
    const temp = {
      error: err,
      output: {
        values: [{ "temperature": temperature }],
      } as OutputValue,
    }
    return OperationOutput.fromJSON(temp);
  }
}
