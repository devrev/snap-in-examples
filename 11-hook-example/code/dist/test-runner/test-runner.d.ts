import { FunctionFactoryType } from '../function-factory';
export interface TestRunnerProps {
    functionName: FunctionFactoryType;
    fixturePath: string;
}
export declare const testRunner: ({ functionName, fixturePath }: TestRunnerProps) => Promise<void>;
