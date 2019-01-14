import * as path from "path";
import { File, Types } from "../../core/file";
import { removePureView, replacePureView } from "./code";

const { urlJoin, groupBy } = require("../../utils/utils");
const fs = require("../../core/fs");

const FIND_IMPORTS_REGEX = /^import[\s]*(['"])(.*)\1;/gm;
const FIND_FILE_REGEX = /import[\s]*(['"])(.*)\1;/;

interface RemapImport {
  path: string;
  searchValue: string;
  replaceValue: string;
}

const getImports = (source: string) => {
  const importStatements = source.match(FIND_IMPORTS_REGEX) || [];

  return importStatements.map((importStatement) => {
    const fileStatement = FIND_FILE_REGEX.exec(importStatement) || [];
    if (fileStatement.length < 3) {
      return "";
    }

    return fileStatement[2];
  }).filter((fileImport) => fileImport.length);
};

const prepareInitialFile = async (file: File) => {
  if (file.type === Types.http) {
    return await file.content;
  }

  const destination = path.join(".embark", file.path);
  if (file.type === Types.dappFile) {
    fs.copySync(file.path, destination);
  }

  if (file.type === Types.custom) {
    fs.writeFileSync(destination);
  }

  file.path = destination;
};

const buildNewFile = (file: File, importPath: string) => {
  let from: string;
  let to: string;

  // started with HTTP file that then further imports local paths in
  // it's own repo/directory
  if (file.type === Types.http && !isHttp(importPath)) {
    const externalUrl = urlJoin(file.externalUrl, importPath);
    return new File({ externalUrl, type: Types.http });
  }

  // http import
  if (isHttp(importPath)) {
    return new File({ externalUrl: importPath, type: Types.http });
  }

  // imported from node_modules, ie import "@aragon/os/contracts/acl/ACL.sol"
  if (isNodeModule(importPath)) {
    from = path.join("node_modules", importPath);
    to = path.join(".embark", from);
    fs.copySync(from, to);
    return new File({ path: to, type: Types.dappFile });
  }

  // started with node_modules then further imports local paths in it's own repo/directory
  if (isEmbarkNodeModule(file.path)) {
    from = path.join(path.dirname(file.path.replace(".embark", ".")), importPath);
    to = path.join(path.dirname(file.path), importPath);
    fs.copySync(from, to);
    return new File({ path: to, type: Types.dappFile });
  }

  // local import, ie import "../path/to/contract" or "./path/to/contract"
  from = path.join(path.dirname(file.path.replace(".embark", ".")), importPath);
  to = path.join(".embark", from);

  fs.copySync(from, to);
  return new File({ path: to, type: Types.dappFile });
};

const rescursivelyFindRemapImports = async (file: File) => {
  let remapImports: RemapImport[] = [];
  const content = await file.content;
  const imports = getImports(content);

  // if no imports, break recursion
  if (!imports.length) {
    return [];
  }

  for (const importPath of imports) {
    const newFile = buildNewFile(file, importPath);
    file.importRemappings.push({prefix: importPath, target: newFile.path});
    remapImports.push({path: file.path, searchValue: importPath, replaceValue: newFile.path});
    remapImports = remapImports.concat(
      await rescursivelyFindRemapImports(newFile),
    );
  }

  return remapImports;
};

const isEmbarkNodeModule = (input: string) => {
  return input.startsWith(".embark/node_modules");
};

const isNodeModule = (input: string) => {
  return !input.startsWith("..") && fs.existsSync(path.join("./node_modules/", input));
};

const isHttp = (input: string) => {
  return input.startsWith("https://") || input.startsWith("http://");
};

const replaceImports = (remapImports: RemapImport[]) => {
  const byPath: {[path: string]: [{searchValue: string, replaceValue: string}]} = groupBy(remapImports, "path");
  Object.keys(byPath).forEach((p) => {
    let source = fs.readFileSync(p, "utf-8");
    byPath[p].forEach(({searchValue, replaceValue}) => {
      source = source.replace(`import "${searchValue}";`, `import "${replaceValue}";`);
    });
    fs.writeFileSync(p, source);
  });
};

export const prepareForCompilation = async (file: File, isCoverage = false) => {
  await prepareInitialFile(file);
  const remapImports = await rescursivelyFindRemapImports(file);
  replaceImports(remapImports);

  const content = await file.content;
  if (!isCoverage) {
    return content;
  }

  removePureView(path.join(".embark"));
  return replacePureView(content);
};
