declare module "embark-core" {
  export class IPC {
    constructor(options: { ipcRole: string });
  }

  type CommandCallback = (
    opt1?: any,
    opt2?: any,
    opt3?: any,
    opt4?: any,
    opt5?: any,
    opt6?: any,
    opt7?: any,
    opt8?: any,
    opt9?: any,
    opt10?: any,
    opt11?: any,
    opt12?: any,
  ) => any;

  export class Events {
    on: any;
    request: any;
    request2: any;
    emit: any;
    once: any;
    setCommandHandler(
      name: string,
      callback: CommandCallback,
    ): void;
  }
}
