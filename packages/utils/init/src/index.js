/* global __dirname process require */

import { spawn } from 'child_process';
import { Command } from 'commander';
import { __, setOrDetectLocale } from 'embark-i18n';
import minimist from 'minimist';
import { join } from 'path';

import { initDefaults } from './defaults';
import { makeInitCommanderOptions, replaceTokens, runCommand } from './util';

export { initDefaults };
export * from './creator';

const pkgJsonPath = join(__dirname, "..", "package.json");
const pkgJson = require(pkgJsonPath);
const version = pkgJson.version;

async function handleCliOptions(
  cliOptions,
  { argv, init, promise, reject, resolve } = {}
) {
  setOrDetectLocale(cliOptions.locale);

  const npxCmd = process.platform === 'win32' ? 'npx.cmd': 'npx';

  console.log('hi from handleCliOptions in embark-init');

  // let error = new Error('bad stuff happened in embark-init');
  // if (reject) return reject(error);
  // throw error;
  // if (resolve) return resolve(19);
  // return 19;

  // should display command/s that will be run, similar to what the release
  // script does, so it's easier to figure out what's happening and how options
  // are combining

  // was a packge-command given as a positional?

  // if so, ignore LHS options and:
  // `npx [package-command] [--RHS-opts] -- [--CREATOR-opts]`
  // BUT first resolve [package-command]:
  // first choice: embark-create-[package-command]
  // fallback: create-[package-command]

  // ^ embark-init should check if it is in the monorepo and attempt to find
  // the creator package inside the monorepo and invoke its bin directly
  // instead of using npx, though npx can be a fallback

  // if not...
  // are there prompts?

  // if so, and --yes was NOT spec'd then run the prompts and upate options
  // with answers

  // presets should (somehow) be able to contain metadata that will affect
  // creator and subcreator options, e.g. `--cra-version` and `-- --typescript`

  // hydrate the preset, which may involve additional prompts
  // ?? maybe all init prompts should be in presets w/ no preliminary prompts
  // spec'able to main ??

  // the idea is to attempt to reuse Vue's presets system as much as possible,
  // if necessary repurposing the source code as sources in embark-init, but
  // hopefully it's flexible enough to be leveraged with copying/modifying the
  // source code
}

export function cli(
  program,
  {
    argv = [],
    init = initDefaults,
    promise,
    reject,
    resolve
  } = {}
) {
  if (!program) {
    program = new Command();
    program.version(version);
  }
  program.description('Initializes a project as an Embark dapp');
  program.usage('[options] [creator] [creator-options] [-- [extra-options]]');
  ({init} = replaceTokens({init}));
  makeInitCommanderOptions(init).forEach(opt => { program.option(...opt); });
  program.action((...args) => handleCliOptions(
    args, { argv, init, promise, reject, resolve }
  ));
  program.on('--help', () => {
    let embarkInit = 'embark-init';
    if (program.parent) embarkInit = 'embark init';

    console.log('');
    console.log('SIMPLE USAGE:');
    console.log('');
    console.log('    ', `${embarkInit} [options]`);
    console.log('');
    console.log(
      'Initialization is performed in the current working directory;',
      'will first run \`npm init\` if no package.json is present.'
    );

    console.log('');
    console.log('WITH CREATOR:');
    console.log('');
    console.log('    ', `${embarkInit} [creator] [options] [-- [extra-options]]`);
    console.log('');
    console.log(
      'A creator is a name such as "react-dapp".',
      'Options to the left of the creator are ignored.',
      'Any options to the right of "--" are passed to the underlying tool,',
      'e.g. create-react-app, and will override conflicting options computed by the creator.'
    );
    console.log('');
    console.log(
      'Creator names are resolved to packages by prepending "@embarklabs/create-", then trying with "embark-", and finally using the bare name.'
    );
    console.log('');
    console.log(
      'Example: "react-dapp" resolves to "@embarklabs/create-react-dapp", and the following are equivalent:'
    );
    console.log('');
    console.log('    ', `${embarkInit} react-dapp mydapp [options] [-- [extra-options]]`);
    console.log('');
    console.log('    ', `npx @embarklabs/crete-react-dapp mydapp [options] [-- [extra-options]]`);
    console.log('');
    console.log('To see the help output of a creator do:');
    console.log('');
    console.log('    ', `${embarkInit} [creator] --help`);
    console.log('');
    console.log('To see the help output of a creator\'s underlying tool do:');
    console.log('');
    console.log('    ', `${embarkInit} [creator] -- --help`);
  });
  return program;
}

const procArgv = process.argv.slice();

export function main(
  program,
  argv = procArgv,
  { promise, reject, resolve } = {}
) {
  if (!(promise && reject && resolve)) {
    promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  }
  program = cli(program, { argv: argv.slice(), promise, reject, resolve });
  program.parse(argv);
  return promise;
}
