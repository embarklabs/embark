import path from 'path';
import { Stats } from 'fs';

enum FileType {
  SymbolicLink = 'symbolic link',
  Socket = 'socket',
  Unknown = 'unknown'
}

export class InitializationError extends Error {

  name = 'InitalizationError';

  constructor(public innerError: Error) {
    super();
    this.message = `Failed to initalize tracking file: Orignal Error: ${innerError}`;
  }
}

export class UnsupportedTargetError extends Error {

  name = 'UnsupportedTargetError';

  constructor(public stats: Stats) {
    super();
    // We can't access `this` before `super()` is called so we have to
    // set `this.message` after that to get a dedicated error message.
    this.setMessage();
  }

  private setMessage() {
    let ftype = FileType.Unknown;
    if (this.stats.isSymbolicLink()) {
      ftype = FileType.SymbolicLink;
    } else if (this.stats.isSocket()) {
      ftype = FileType.Socket;
    }
    this.message = `Script execution target not supported. Expected file path or directory, got ${ftype} type.`;
  }
}

export class ScriptExecutionError extends Error {

  name = 'ScriptExecutionError';

  constructor(public target: string, public innerError: Error) {
    super();
    this.message = `Script '${path.basename(target)}' failed to execute. Original error: ${innerError.stack}`;
  }
}

export class ScriptTrackingError extends Error {

  name = 'ScriptTrackingError';

  constructor(public innerError: Error) {
    super();
    this.message = `Couldn't track script due execption. Original error: ${innerError.stack}`;
  }
}
