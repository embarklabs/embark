import * as fs from "fs-extra";
import * as globule from "globule";
import * as path from "path";

export const removePureView = (dir: string) => {
  globule.find(path.join(dir, "**/*.sol")).forEach((filepath) => {
    let source = fs.readFileSync(filepath, "utf-8");
    source = replacePureView(source);
    fs.writeFileSync(filepath, source);
  });
};

export const replacePureView = (source: string) => {
  return source.replace(/pure/g, "").replace(/view/g, "");
};
