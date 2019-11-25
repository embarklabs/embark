/* global module process require */
/* tslint:disable */
import { joinPath } from 'embark-utils';
import * as fs from 'fs-extra';
import parseJson from 'parse-json';
import * as path from 'path';
import 'colors';

export function mkdirpSync(args: any) { return fs.mkdirpSync(args); }

export function mkdirp(args: any, args2?: any) { return fs.mkdirp(args, args2); }

export function readdir(args: any, args2?: any) { return fs.readdir(args, args2); }

export function stat(args: any, args2?: any) { return fs.stat(args, args2); }

export function remove(args: any, args2: any) { return fs.remove(args, args2); }

export function copy(args: any, args2?: any, args3?: any, args4?: any) { return fs.copy(args, args2, args3, args4); }

export function copySync(args: any, args2?: any, args3?: any) { return fs.copySync(args, args2, args3); }

export function move(args: any, args2?: any, args3?: any, args4?: any) { return fs.move(args, args2, args3, args4); }

export function moveSync(args: any, args2?: any, args3?: any) { return fs.moveSync(args, args2, args3); }

export function symlink(args: any, args2?: any, args3?: any, args4?: any) { return fs.symlink(args, args2, args3, args4); }

export function appendFileSync(args: any, args2: any, args3?: any) { return fs.appendFileSync(args, args2, args3); }

export function writeFile(args: any, args2: any, args3?: any, args4?: any) { return fs.writeFile(args, args2, args3, args4); }

export function writeFileSync(args: any, args2: any, args3?: any) { return fs.writeFileSync(args, args2, args3); }

export function readFile(args: any, args2?: any, args3?: any) { return fs.readFile(args, args2, args3); }

export function readFileSync(args: any, args2?: any) { return fs.readFileSync(args, args2); }

export function readdirSync(args: any, args2?: any) { return fs.readdirSync(args, args2); }

export function statSync(args: any) { return fs.statSync(args); }

export function readJSONSync(args: any, args2?: any) {
  let json;
  try {
    json = parseJson(readFileSync(args, args2).toString());
  } catch (e) {
    console.error('error: '.red + args.green.underline + ' ' + e.message.green);
    process.exit(1);
  }
  return json;
}

export function writeJSONSync(args: any, args2: any, args3?: any) { return fs.writeJSONSync(args, args2, args3); }

export function outputJSONSync(args: any, args2: any, args3?: any) { return fs.outputJSONSync(args, args2, args3); }

export function writeJson(args: any, args2: any, args3?: any, args4?: any) { return fs.writeJson(args, args2, args3, args4); }

export function existsSync(args: any) { return fs.existsSync(args); }

export function ensureFileSync(args: any) { return fs.ensureFileSync(args); }

export function ensureDirSync(args: any, args2?: any) { return fs.ensureDirSync(args, args2); }

export function access(args: any, args2?: any, args3?: any) { return fs.access(args, args2, args3); }

export function removeSync(args: any) { return fs.removeSync(args); }

export function createWriteStream(args: any, args2?: any) { return fs.createWriteStream(args, args2); }

export function copyPreserve(sourceFilePath, targetFilePath) {
  const implementation = (sourceFilePath, targetFilePath) => {
    let ext = 1;
    let preserved = targetFilePath;
    while (fs.existsSync(preserved)) {
      const extname = path.extname(targetFilePath);
      preserved = joinPath(
        path.dirname(targetFilePath),
        `${path.basename(targetFilePath, extname)}.${ext}${extname}`
      );
      ext++;
    }
    if (preserved !== targetFilePath) {
      fs.copySync(targetFilePath, preserved);
    }
    fs.copySync(sourceFilePath, targetFilePath);
  };

  return implementation(sourceFilePath, targetFilePath);
}

export function outputFileSync(args: any, args2: any, args3?: any) { return fs.outputFileSync(args, args2, args3); }
