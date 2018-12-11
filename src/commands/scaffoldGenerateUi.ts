import { CommandWithPayload } from "../lib/core/commandWithPayload";

interface Props {
  done(): void;
  options: any;
}

export class ScaffoldGenerateUi extends CommandWithPayload<Props> {
  public static readonly type = "ScaffoldGenerateUi";
}
