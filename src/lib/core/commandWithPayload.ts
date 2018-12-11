import { Command } from "./command";

export abstract class CommandWithPayload<T> extends Command {
  constructor(public readonly payload: T) {
    super();
  }
}
