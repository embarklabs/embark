import * as path from "path";
import { File, Types } from "../../core/file";
import { removePureView, replacePureView } from "./code";

const { urlJoin, groupBy } = require("../../utils/utils");
const fs = require("../../core/fs");

const FIND_IMPORTS_REGEX = /^import[\s]*(['"])(.*)\1;/gm;
const FIND_FILE_REGEX = /import[\s]*(['"])(.*)\1;/;

export interface ImportRemapping {
  prefix: string;
  target: string;
}

interface RemapImport {
  path: string;
  remapping: ImportRemapping;
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

  const destination = fs.dappPath(".embark", file.path);
  if (file.type === Types.dappFile || file.type === Types.custom) {
    fs.copySync(fs.dappPath(file.path), destination);
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
    from = resolve(importPath);
    to = fs.dappPath(".embark", "node_modules", importPath);
    fs.copySync(from, to);
    return new File({ path: to, type: Types.dappFile, originalPath: from });
  }

  // started with node_modules then further imports local paths in it's own repo/directory
  if (isEmbarkNodeModule(file.path)) {
    from = path.join(path.dirname(file.path.replace(".embark", ".")), importPath);
    to = path.join(path.dirname(file.path), importPath);
    fs.copySync(from, to);
    return new File({ path: to, type: Types.dappFile, originalPath: from });
  }

  // local import, ie import "../path/to/contract" or "./path/to/contract"
  from = path.join(path.dirname(file.path.replace(".embark", ".")), importPath);
  to = path.join(path.dirname(file.path), importPath);

  fs.copySync(from, to);
  return new File({ path: to, type: Types.dappFile, originalPath: from });
};

const rescursivelyFindRemapImports = async (file: File, filesProcessed: string[] = []) => {
  let remapImports: RemapImport[] = [];
  const content = await file.content;
  const imports = getImports(content);

  if (filesProcessed.includes(file.path)) {
    return [];
  }
  filesProcessed.push(file.path);

  // if no imports, break recursion
  if (!imports.length) {
    return [];
  }

  for (const importPath of imports) {
    const newFile = buildNewFile(file, importPath);
    const remapping = { prefix: importPath, target: newFile.path };
    file.importRemappings.push(remapping);
    remapImports.push({ path: file.path, remapping });
    remapImports = remapImports.concat(
      await rescursivelyFindRemapImports(newFile, filesProcessed),
    );
  }

  return remapImports;
};

const isEmbarkNodeModule = (input: string) => {
  return path.normalize(input).includes(path.normalize(".embark/node_modules"));
};

const isNodeModule = (input: string) => {
  return !(input.startsWith(".") || input.startsWith("..")) && resolve(input);
};

const isHttp = (input: string) => {
  return input.startsWith("https://") || input.startsWith("http://");
};

const replaceImports = (remapImports: RemapImport[]) => {
  const byPath: { [path: string]: [{ remapping: ImportRemapping }] } = groupBy(remapImports, "path");
  Object.keys(byPath).forEach((p) => {
    let source = fs.readFileSync(p, "utf-8");
    byPath[p].forEach(({ remapping }) => {
      source = source.replace(`import "${remapping.prefix}"`, `import "${remapping.target}"`);
    });
    fs.writeFileSync(p, source);
  });
};

const addRemappingsToFile = (file: File, remapImports: RemapImport[]) => {
  const byPath: { [path: string]: [{ remapping: ImportRemapping }] } = groupBy(remapImports, "path");
  const paths = Object.keys(byPath);
  if (paths) {
    file.importRemappings = []; // clear as we already have the first remapping added
    paths.forEach((p) => {
      const [...remappings] = byPath[p].map((importRemapping) => importRemapping.remapping);
      file.importRemappings = file.importRemappings.concat(remappings);
    });
  }
};

const resolve = (input: string) => {
  try {
    const result = require.resolve(input, { paths: [fs.dappPath("node_modules"), fs.embarkPath("node_modules")] });
    return result;
  } catch (e) {
    return "";
  }
};

export const prepareForCompilation = async (file: File, isCoverage = false) => {
  if (!file.isPrepared) {
    await prepareInitialFile(file);
    const remapImports = await rescursivelyFindRemapImports(file);
    replaceImports(remapImports);
    // add all remappings to top-level file
    addRemappingsToFile(file, remapImports);

    // set flag to prevent copying, remapping, and changing of paths again
    file.isPrepared = true;
  }
  let content;
  if (file.type === Types.http) {
    content = (await fs.readFile(file.path)).toString();
  } else {
    content = await file.content;
  }

  if (!isCoverage) {
    return content;
  }

  removePureView(fs.dappPath(".embark"));
  return replacePureView(content);
};
