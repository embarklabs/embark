import { CommandWithPayload } from "../lib/core/commandWithPayload";

interface Props {
  done(files: string[]): void;
  options: any;
}

export class ScaffoldGenerateContracts extends CommandWithPayload<Props> {
  public static readonly type = "ScaffoldGenerateContracts";
}
