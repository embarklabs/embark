import * as fs from "fs-extra";
import * as path from "path";
import { groupBy } from "../collections";
import { File, Types } from "../file";
import { dappPath, embarkPath, urlJoin } from "../pathUtils";

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

const prepareInitialFile = async (file: File | any) => {
  if (file.type === Types.http) {
    return await file.content;
  }

  let to: string;
  if (file.path.includes(dappPath(".embark"))) {
    to = path.normalize(file.path);
  } else if (path.isAbsolute(file.path)) {
    // don't want 'C:\' in calculated path on Windows
    const relativeFrom = path.normalize('/');
    const relativePath = path.relative(relativeFrom, file.path);
    to = dappPath(".embark", relativePath);
  } else {
    to = dappPath(".embark", file.path);
  }

  if (file.type === Types.dappFile || file.type === Types.custom) {
    if (file.resolver) {
      fs.mkdirpSync(path.dirname(to));
      fs.writeFileSync(to, await file.content);
    } else {
      const from = file.path.includes(dappPath()) ? file.path : dappPath(file.path);
      if (from !== to) {
        fs.copySync(from, to);
      }
    }
  }

  file.path = to;
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

  importPath = path.normalize(importPath);

  // imported from node_modules, ie import "@aragon/os/contracts/acl/ACL.sol"
  if (isUnresolvedNodeModule(importPath)) {
    from = resolve(importPath);
    to = importPath.includes(dappPath(".embark")) ? importPath : dappPath(".embark", "node_modules", importPath);
    if (from !== to) {
      fs.copySync(from, to);
    }
    return new File({ path: to, type: Types.dappFile });
  }

  // started with node_modules then further imports local paths in it's own repo/directory
  if (isEmbarkNodeModule(file.path)) {
    if (path.isAbsolute(importPath)) {
      from = path.normalize(importPath.replace(".embark", "."));
      to = importPath;
    } else {
      from = path.join(path.dirname(file.path.replace(".embark", ".")), importPath);
      to = path.join(path.dirname(file.path), importPath);
      fs.copySync(from, to);
    }
    return new File({ path: to, type: Types.dappFile, originalPath: from });
  }

  // local import, ie import "../path/to/contract" or "./path/to/contract"
  if (path.isAbsolute(importPath)) {
    from = path.normalize(importPath.replace(".embark", "."));
    to = importPath;
  } else {
    from = path.join(path.dirname(file.path.replace(".embark", ".")), importPath);
    if (importPath === "remix_tests.sol") {
      to = dappPath(".embark", "remix_tests.sol");
    } else {
      to = path.join(path.dirname(file.path), importPath);
      fs.copySync(from, to);
    }
  }
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

const isUnresolvedNodeModule = (input: string) => {
  if (path.isAbsolute(input)) {
    return false;
  }
  return !(input.startsWith(".") || input.startsWith("..")) && !!resolve(input);
};

const isHttp = (input: string) => {
  return input.startsWith("https://") || input.startsWith("http://");
};

const replaceImports = (remapImports: RemapImport[]) => {
  const byPath: { [path: string]: [{ remapping: ImportRemapping }] } = groupBy(remapImports, "path");
  Object.keys(byPath).forEach((p) => {
    let source = fs.readFileSync(p, "utf-8");
    byPath[p].forEach(({ remapping }) => {
      source = source.replace(`import "${remapping.prefix}"`, `import "${remapping.target.replace(/\\/g, "/")}"`);
    });
    fs.writeFileSync(p, source);
  });
};

const addRemappingsToFile = (file: File, remapImports: RemapImport[]) => {
  const byPath: { [path: string]: [{ remapping: ImportRemapping }] } = groupBy(remapImports, "path");
  const paths = Object.keys(byPath);
  if (paths.length) {
    file.importRemappings = []; // clear as we already have the first remapping added
    paths.forEach((p) => {
      const remappings = byPath[p].map((importRemapping) => importRemapping.remapping);
      file.importRemappings = file.importRemappings.concat(remappings);
    });
  }
};

const resolve = (input: string) => {
  try {
    return require.resolve(input, { paths: [dappPath("node_modules"), embarkPath("node_modules")] });
  } catch (e) {
    return "";
  }
};

export const prepareForCompilation = async (file: File, isCoverage = false) => {
  await prepareInitialFile(file);
  const remapImports = await rescursivelyFindRemapImports(file);
  replaceImports(remapImports);
  // add all remappings to top-level file
  addRemappingsToFile(file, remapImports);

  let content;
  if (file.type === Types.http || file.type === Types.custom) {
    content = (await fs.readFile(file.path)).toString();
  } else {
    content = await file.content;
  }

  return content;
};
