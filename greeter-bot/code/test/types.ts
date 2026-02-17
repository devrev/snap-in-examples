/*
  Error Types
*/

export enum RuntimeErrorType {
    FunctionNotFound = 'FUNCTION_NOT_FOUND',
    FunctionNameNotProvided = 'FUNCTION_NAME_NOT_PROVIDED',
    InvalidRequest = 'INVALID_REQUEST',
  }
  
  export type FunctionError = {
    error: unknown;
  };
  
  export type RuntimeError = {
    err_type: RuntimeErrorType;
    err_msg: string;
  };
  
  /* 
    Snap-in types
  */
  
  /** snap-ins-system-update-request */
  export type SnapInsSystemUpdateRequest = (
    | SnapInsSystemUpdateRequestActive
    | SnapInsSystemUpdateRequestError
    | SnapInsSystemUpdateRequestInactive
  ) & {
    /** The ID of the snap-in to update. */
    id: string;
    /** Values of the inputs. */
    inputs_values?: object;
    status: SnapInsSystemUpdateRequestStatus;
  };
  
  /* snap-ins-system-update-request-active */
  export type SnapInsSystemUpdateRequestActive = object;
  
  /* snap-ins-system-update-request-error */
  export type SnapInsSystemUpdateRequestError = object;
  
  /* snap-ins-system-update-request-inactive */
  export interface SnapInsSystemUpdateRequestInactive {
    /** Parameter to proceed with deletion of snap-in. */
    is_deletion?: boolean;
  }
  
  export enum SnapInsSystemUpdateRequestStatus {
    Active = 'active',
    Error = 'error',
    Inactive = 'inactive',
  }
  
  /* snap-ins-system-update-response */
  export type SnapInsSystemUpdateResponse = object;
  
  export type HandlerError = FunctionError | RuntimeError | undefined;
  
  export type ExecutionResult = {
    function_result?: any;
    error?: HandlerError;
  };
  
  export type ActivateHookResult = {
    status: 'active' | 'error';
    inputs_values?: Record<string, any>;
  };
  
  export type DeactivateHookResult = {
    status: 'inactive' | 'error';
    inputs_values?: Record<string, any>;
  };
  
  