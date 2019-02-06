const parseJson = require("parse-json");
const os = require("os");
const path = require("path");
const fs = require("fs-extra");
import env from "./env";
const { red, green, underline } = require("colors");

function sha512(arg: any) {
  if (typeof arg !== "string") {
    throw new TypeError("argument must be a string");
  }
  const crypto = require("crypto");
  const hash = crypto.createHash("sha512");
  return hash.update(arg).digest("hex");
}

function restrictPath(receiver: any, binding: any, count: any, args: any) {
  const dapp = dappPath();
  const embark = embarkPath();
  const pkg = pkgPath();

  const allowedRoots = [
    dapp,
    embark,
    pkg,
    os.tmpdir(),
  ];

  let allInsideRestricted = true;

  for (let i = 0; i < count; i++) {
    const resolved = path.resolve(dapp, args[i]);
    allInsideRestricted = allowedRoots.some((p) => resolved.indexOf(p) === 0);
    if (!allInsideRestricted) {
      break;
    }
  }

  if (allInsideRestricted) {
    return receiver.apply(binding, args);
  }
  throw new Error("EPERM: Operation not permitted");
}

function mkdirpSync(...args: any) {
  return restrictPath(fs.mkdirpSync, fs.mkdirpSync, 1, args);
}

function mkdirp(...args: any) {
  return restrictPath(fs.mkdirp, fs.mkdirp, 1, args);
}

function readdir(...args: any) {
  return restrictPath(fs.readdir, fs.readdir, 1, args);
}

function stat(...args: any) {
  return restrictPath(fs.stat, fs.stat, 1, args);
}

function remove(...args: any) {
  return restrictPath(fs.remove, fs.remove, 1, args);
}

function copy(...args: any) {
  return restrictPath(fs.copy, fs.copy, 2, args);
}

function copySync(...args: any) {
  return restrictPath(fs.copySync, fs.copySync, 2, args);
}

function move(...args: any) {
  return restrictPath(fs.move, fs.move, 2, args);
}

function moveSync(...args: any) {
  return restrictPath(fs.moveSync, fs.moveSync, 2, args);
}

function appendFileSync(...args: any) {
  return restrictPath(fs.appendFileSync, fs.writeFileSync, 1, args);
}

function writeFile(...args: any) {
  return restrictPath(fs.writeFile, fs.writeFileSync, 1, args);
}

function writeFileSync(...args: any) {
  return restrictPath(fs.writeFileSync, fs.writeFileSync, 1, args);
}

function readFile(...args: any) {
  return restrictPath(fs.readFile, fs.readFile, 1, args);
}

function readFileSync(...args: any) {
  return restrictPath(fs.readFileSync, fs.readFileSync, 1, args);
}

function readdirSync(...args: any) {
  return restrictPath(fs.readdirSync, fs.readdirSync, 1, args);
}

function statSync(...args: any) {
  return restrictPath(fs.statSync, fs.statSync, 1, args);
}

function readJSONSync(...args: any) {
  const content: any = readFileSync.apply(readFileSync, args);
  try {
    return parseJson(content);
  } catch (e) {
    console.error(red("error: ") + underline(green(args[0])) + " " + green(e.message));
    process.exit(0);
  }
}

function writeJSONSync(...args: any) {
  return restrictPath(fs.writeJSONSync, fs.writeJSONSync, 1, args);
}

function outputJSONSync(...args: any) {
  return restrictPath(fs.outputJSONSync, fs.outputJSONSync, 1, args);
}

function writeJson(...args: any) {
  return restrictPath(fs.writeJson, fs.writeJson, 1, args);
}

function existsSync(...args: any) {
  return restrictPath(fs.existsSync, fs.existsSync, 1, args);
}

function ensureFileSync(...args: any) {
  return restrictPath(fs.ensureFileSync, fs.ensureFileSync, 1, args);
}

function ensureDirSync(...args: any) {
  return restrictPath(fs.ensureDirSync, fs.ensureDirSync, 1, args);
}

function access(...args: any) {
  return restrictPath(fs.access, fs.access, 1, args);
}

function removeSync(...args: any) {
  return restrictPath(fs.removeSync, fs.removeSync, 1, args);
}

function anchoredPath(anchor: any, ...args: any) {
  return path.join(env.anchoredValue(anchor), ...args);
}

function embarkPath(...args: any) {
  return anchoredPath(env.EMBARK_PATH, ...args);
}

function dappPath(...args: any) {
  return anchoredPath(env.DAPP_PATH, ...args);
}

function diagramPath(...args: any) {
  return anchoredPath(env.DIAGRAM_PATH, ...args);
}

function ipcPath(basename: any, usePipePathOnWindows = false) {
  if (!(basename && typeof basename === "string")) {
    throw new TypeError("first argument must be a non-empty string");
  }
  if (process.platform === "win32" && usePipePathOnWindows) {
    return `\\\\.\\pipe\\${basename}`;
  }
  return path.join(
    tmpDir(`embark-${sha512(dappPath()).slice(0, 8)}`),
    basename,
  );
}

function pkgPath(...args: any) {
  return anchoredPath(env.PKG_PATH, ...args);
}

function createWriteStream(...args: any) {
  return restrictPath(fs.createWriteStream, fs.createWriteStream, 1, args);
}

function tmpDir(...args: any) {
  return path.join(os.tmpdir(), ...args);
}

function copyPreserve(sourceFilePathArg: any, targetFilePathArg: any) {
  const implementation = (sourceFilePath: any, targetFilePath: any) => {
    let ext = 1;
    let preserved = targetFilePath;
    while (fs.existsSync(preserved)) {
      const extname = path.extname(targetFilePath);
      preserved = path.join(
        path.dirname(targetFilePath),
        `${path.basename(targetFilePath, extname)}.${ext}${extname}`,
      );
      ext++;
    }
    if (preserved !== targetFilePath) {
      fs.copySync(targetFilePath, preserved);
    }
    fs.copySync(sourceFilePath, targetFilePath);
  };

  return restrictPath(implementation, implementation, 2, [sourceFilePathArg, targetFilePathArg]);
}

function outputFileSync(...args: any) {
  return restrictPath(fs.outputFileSync, fs.outputFile, 1, args);
}

export default {
  access,
  appendFileSync,
  copy,
  copyPreserve,
  copySync,
  createWriteStream,
  dappPath,
  diagramPath,
  embarkPath,
  ensureDirSync,
  ensureFileSync,
  existsSync,
  ipcPath,
  mkdirp,
  mkdirpSync,
  move,
  moveSync,
  outputFileSync,
  outputJSONSync,
  pkgPath,
  readFile,
  readFileSync,
  readJSONSync,
  readdir,
  readdirSync,
  remove,
  removeSync,
  stat,
  statSync,
  tmpDir,
  writeFile,
  writeFileSync,
  writeJSONSync,
  writeJson,
};
