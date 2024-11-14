/*
 * Copyright (c) 2024 DevRev Inc. All rights reserved.

Disclaimer:
The code provided herein is intended solely for testing purposes.
Under no circumstances should it be utilized in a production environment. Use of
this code in live systems, production environments, or any situation where
reliability and stability are critical is strongly discouraged. The code is
provided as-is, without any warranties or guarantees of any kind, and the user
assumes all risks associated with its use. It is the responsibility of the user 
to ensure that proper testing and validation procedures are carried out before 
deploying any code into production environments.
*/

import bodyParser from 'body-parser';
import express, { Express, Handler, Request, Response } from 'express';

import process from 'process';
import { functionFactory, FunctionFactoryType } from '../src/function-factory';
import { HTTPClient, HttpRequest } from './http_client';
import {
  ActivateHookResult,
  DeactivateHookResult,
  ExecutionResult,
  FunctionError,
  HandlerError,
  RuntimeError,
  RuntimeErrorType,
  SnapInsSystemUpdateRequest,
  SnapInsSystemUpdateRequestInactive,
  SnapInsSystemUpdateRequestStatus,
  SnapInsSystemUpdateResponse,
} from './types';


import {
  Context as SnapInContext,
  ExecuteOperationResult,
  ExecuteOperationResult_SerializationFormat,
  ExecutionMetadata,
  FunctionExecutionError,
  FunctionInput,
  OperationOutput,
} from '@devrev/typescript-sdk/dist/snap-ins';

const app: Express = express();
app.use(bodyParser.json(), bodyParser.urlencoded({ extended: false }));

export const startServer = (port: number) => {
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
};

// handle async requests
app.post('/handle/async', async (req: Request, resp: Response) => {
  const events = req.body;
  if (events === undefined) {
    resp.status(400).send('Invalid request format: body is undefined');
    return;
  }

  await handleEvent(events, true /* isAsync */, resp);
});

app.post('/handle/sync', async (req: Request, resp: Response) => {
  if (req.body === undefined) {
    resp.status(400).send('Invalid request format: body is undefined');
    return;
  }
  // for sync invokation, wrap in an array
  const events: any[] = [req.body];
  await handleEvent(events, false /* isAsync */, resp);
});

async function run(f: any, event: any): Promise<any> {
  let result = await f(event);
  return result;
}

async function handleEvent(events: any[], isAsync: boolean, resp: Response) {
  let error;
  let results: ExecutionResult[] = [];
  let receivedError = false;

  if (!Array.isArray(events)) {
    let errMsg = 'Invalid request format: body is not an array';
    error = {
      err_type: RuntimeErrorType.InvalidRequest,
      err_msg: errMsg,
    } as RuntimeError;
    console.error(error.err_msg);
    resp.status(400).send(errMsg);
    return;
  }
  // if the request is synchronous, there should be a single event
  if (!isAsync) {
    if (events.length > 1) {
      let errMsg = 'Invalid request format: multiple events provided for synchronous request';
      error = {
        err_type: RuntimeErrorType.InvalidRequest,
        err_msg: errMsg,
      } as RuntimeError;
      console.error(error.err_msg);
      resp.status(400).send(errMsg);
      return;
    }
  } else {
    // return a success response back to the server
    resp.status(200).send();
  }

  for (let event of events) {
    let result;
    const functionName: FunctionFactoryType = event.execution_metadata.function_name as FunctionFactoryType;
    if (functionName === undefined) {
      error = {
        err_type: RuntimeErrorType.FunctionNameNotProvided,
        err_msg: 'Function name not provided in event',
      } as RuntimeError;
      console.error(error.err_msg);
      receivedError = true;
    } else {
      const f = functionFactory[functionName];
      try {
        if (f == undefined) {
          error = {
            err_type: RuntimeErrorType.FunctionNotFound,
            err_msg: `Function ${event.execution_metadata.function_name} not found in factory`,
          } as RuntimeError;
          console.error(error.err_msg);
          receivedError = true;
        } else {
          result = await run(f, [event]);
        }
      } catch (e) {
        error = { error: e } as FunctionError;
        console.error(e);
      }

    // Any common post processing goes here. The function returns
    // only if the function execution was by an operation
    }
    const opResult = await postRun(event,error, result);

    // Return result.
    let res: ExecutionResult = {};

    if (opResult !== undefined) {
      res.function_result = opResult;
    } else if (result !== undefined) {
      res.function_result = result;
    }
  
    if (error !== undefined) {
      res.error = error;
    }
    results.push(res);
  }

  if (!isAsync) {
    resp.status(200).send(results[0]);
  }
}

// post processing
async function postRun(event: any, handlerError: HandlerError, result: any){
  console.debug('Function execution complete');
  // Check if the function was invoked by an operation.
  if (isInvokedFromOperation(event)) {
    // handle operation specific logic
    console.debug('Function was invoked by an operation');
    const data: Uint8Array = OperationOutput.encode(result).finish();

    return {
      serialization_format: ExecuteOperationResult_SerializationFormat.Proto,
      data: Buffer.from(data).toString('base64'),
    } as ExecuteOperationResult;
  }
  if (isActivateHook(event)) {
    handleActivateHookResult(event,handlerError, result);
  } else if (isDeactivateHook(event)) {
    handleDeactivateHookResult(event,handlerError, result);
  }
  return undefined
}

function isActivateHook(event: any): boolean {
  return event.execution_metadata.event_type === 'hook:snap_in_activate';
}

function isDeactivateHook(event: any): boolean {
  return event.execution_metadata.event_type === 'hook:snap_in_deactivate';
}

function isInvokedFromOperation(event: any): boolean {
  return  event.execution_metadata.operation_slug !== undefined;
}

function handleActivateHookResult(event: any, handlerError: HandlerError, result: any) {
  let update_req: SnapInsSystemUpdateRequest = {
    id: event.context.snap_in_id,
    status: SnapInsSystemUpdateRequestStatus.Active,
  };
  let res = getActivateHookResult(result);
  update_req.inputs_values = res.inputs_values;

  if (handlerError !== undefined || res?.status === 'error') {
    console.debug('Setting snap-in status to error');
    update_req.status = SnapInsSystemUpdateRequestStatus.Error;
  }

  return updateSnapInState(event, update_req);
}

function handleDeactivateHookResult(event: any, handlerError: HandlerError, result: any) {
  let update_req: SnapInsSystemUpdateRequest = {
    id: event.context.snap_in_id,
    status: SnapInsSystemUpdateRequestStatus.Inactive,
  };
  let res = getDeactivateHookResult(result);
  update_req.inputs_values = res.inputs_values;
  if (event.payload.force_deactivate) {
    console.debug('Snap-in is being force deactivated, errors ignored');
  }
  if ((handlerError !== undefined || res?.status === 'error') && !event.payload.force_deactivate) {
    console.debug('Setting snap-in status to error');
    update_req.status = SnapInsSystemUpdateRequestStatus.Error;
  } else {
    if (event.payload.is_deletion) {
      console.debug('Marking snap-in to be deleted');
      (update_req as SnapInsSystemUpdateRequestInactive).is_deletion = true;
    } else {
      console.debug('Setting snap-in status to inactive');
    }
  }

  return updateSnapInState(event, update_req);
}

// Update the snap-in status based on hook result.
async function updateSnapInState(event: any, update_req: SnapInsSystemUpdateRequest) {
  console.debug('Updating snap-in state after running async hook');
  const { secrets } = event.context;
  const client = new HTTPClient({
    endpoint: event.execution_metadata.devrev_endpoint,
    token: secrets?.service_account_token,
  });

  const request: HttpRequest = {
    path: '/internal/snap-ins.system-update',
    body: update_req,
  };

  try {
    await client.post<SnapInsSystemUpdateResponse>(request);
  } catch (e) {
    console.error(e);
  }
}

function getActivateHookResult(input: any): ActivateHookResult {
  let res = {} as ActivateHookResult;
  if (input instanceof Object) {
    if (input.status === 'active' || input.status === 'error') {
      res.status = input.status;
    } else if (input.status !== undefined) {
      console.error(`Invalid status field ${input.status}: status must be active or error`);
    }
    if (input.inputs_values instanceof Object) {
      res.inputs_values = input.inputs_values;
    } else if (input.inputs_values !== undefined) {
      console.error(`Invalid inputs_values field ${input.inputs_values}: inputs_values is not an object`);
    }
  }
  return res;
}

function getDeactivateHookResult(input: any): DeactivateHookResult {
  let res = {} as DeactivateHookResult;
  if (input instanceof Object) {
    if (input.status === 'inactive' || input.status === 'error') {
      res.status = input.status;
    } else if (input.status !== undefined) {
      console.error(`Invalid status field ${input.status}: status must be inactive or error`);
    }
    if (input.inputs_values instanceof Object) {
      res.inputs_values = input.inputs_values;
    } else if (input.inputs_values !== undefined) {
      console.error(`Invalid inputs_values field ${input.inputs_values}: inputs_values is not an object`);
    }
  }
  return res;
}
