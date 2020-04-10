/**
 * A rpc call is represented by sending a Request object to a Server.
 */
export interface RpcRequest<T> {
  /**
   * A String specifying the version of the JSON-RPC protocol. **MUST** be exactly "2.0".
   */
  jsonrpc: '2.0';

  /**
   * A String containing the name of the method to be invoked.
   */
  method: string;

  /**
   * A Structured value that holds the parameter values
   * to be used during the invocation of the method.
   */
  params: T;

  /**
   * An identifier established by the Client that **MUST** contain a `String`, `Number`,
   * or `NULL` value if included.
   * If it is not included it is assumed to be a notification.
   * The value **SHOULD** normally not be Null and Numbers **SHOULD NOT** contain fractional parts
   */
  id?: string | number | null;
}

/**
 * When a rpc call is made, the Server **MUST** reply with a Response
 * except for in the case of Notifications.
 * The Response is expressed as a single JSON Object
 */
export interface RpcResponse<T, E = any> {
  /**
   * A String specifying the version of the JSON-RPC protocol.
   * **MUST** be exactly "2.0".
   */
  jsonrpc: '2.0';

  /**
   * This member is **REQUIRED** on success.
   * This member **MUST NOT** exist if there was an error invoking the method.
   * The value of this member is determined by the method invoked on the Server.
   */
  result?: T;

  /**
   * This member is REQUIRED on error.
   * This member MUST NOT exist if there was no error triggered during invocation.
   * The value for this member MUST be an Object of Type `RpcResponseError`.
   */
  error?: RpcResponseError<E>;

  /**
   * An identifier established by the Client that **MUST** contain a `String`, `Number`,
   * or `NULL` value if included.
   * It **MUST** be the same as the value of the id member in the Request Object.
   * If there was an error
   * in detecting the `id` in the Request object (e.g. `Parse error`/`Invalid Request`)
   * it **MUST** be `Null`.
   */
  id: string | number | null;
}

/**
 * When a rpc call encounters an error,
 * the Response Object MUST contain the error member with a value that is that object
 */
export interface RpcResponseError<T = any> {
  /**
   * A Number that indicates the error type that occurred.
   */
  code: number | RpcErrorCode;
  /**
   * A String providing a short description of the error.
   */
  message: string;
  /**
   * A Primitive or Structured value that contains additional information about the error.
   * The value of this member is defined by the Server
   * (e.g. detailed error information, nested errors etc.).
   */
  data?: T;
}

export enum RpcErrorCode {
  /**
   * Invalid JSON was received by the server.
   * or An error occurred on the server while parsing the JSON text.
   */
  PARSE_ERROR = -32700,
  /**
   * The JSON sent is not a valid Request object.
   */
  INVALID_REQUEST = -32600,
  /**
   * The method does not exist / is not available.
   */
  METHOD_NOT_FOUND = -32601,
  /**
   * Invalid method parameter(s).
   */
  INVALID_PARAMS = -32602,
  /**
   * Internal JSON-RPC error.
   */
  INTERNAL_ERROR = -32603,
  /**
   * Reserved for implementation-defined server-errors.
   */
  SERVER_ERROR = -32000,
}
