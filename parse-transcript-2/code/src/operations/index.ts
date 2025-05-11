import { OperationMap,OperationIfc, FunctionInput } from '@devrev/typescript-sdk/dist/snap-ins';

/**
 * OperationFactory is a factory class that creates a map of operations with the slug mentioned
 * in the manifest.
 */
export class OperationFactory  {
  operationMap: OperationMap;

  constructor(operationMap?: OperationMap) {
    this.operationMap = operationMap || {};
  }

/**
 * @param slug  The slug of the operation mentioned in the manifest
 * @param event Event object that is passed to the snap-in
 * @returns Operation
 */
  public getOperation(slug: string, event: FunctionInput): OperationIfc {
    if (!this.operationMap[slug]) {
      throw new Error(`Operation with slug ${slug} not found`);
    }
    return new this.operationMap[slug](event);
  }
}

