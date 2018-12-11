import events from "events";
import { Observable, Subject } from "rxjs";
import { filter, map } from "rxjs/operators";
import { Command } from "./command";

const COMMAND_PREFIX = "command";
export default class EventEmitter extends events.EventEmitter {
  private messages: Subject<Command> = new Subject();

  public request(event: string, ...args: any[]) {
    return this.emit(`${COMMAND_PREFIX}:${event}`, ...args);
  }

  public setCommandHandler(event: string, listener: (...args: any[]) => void = () => undefined) {
    const commandName = `${COMMAND_PREFIX}:${event}`;
    this.removeAllListeners(commandName);
    return this.on(commandName, listener);
  }

  public setCommandHandlerOnce(event: string, listener: (...args: any[]) => void = () => undefined) {
    return this.once(`${COMMAND_PREFIX}:${event}`, listener);
  }

  public observe<T extends Command>(command: { type: string }): Observable<T> {
    return this.messages.pipe(
      filter((message) => message.constructor.type === command.type),
      map((message) => message as T),
    );
  }

  public push(command: Command) {
    this.messages.next(command);
  }
}

EventEmitter.prototype.setMaxListeners(350);
