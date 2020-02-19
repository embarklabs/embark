/* global process */

import { spawn } from 'child_process';
import { Command } from 'commander';
import { __, setOrDetectLocale } from 'embark-i18n';
import minimist from 'minimist';

import { creatorDefaults } from './defaults';
import { handleCliOptions as initHandleCliOptions } from './index';
import { makeCreatorCommanderOptions, replaceTokens, runCommand } from './util';

export { creatorDefaults };

const procArgv = process.argv.slice();

export function makeCreatorMain(creator = creatorDefaults) {
  async function handleCliOptions(
    cliOptions,
    { argv, program, promise, reject, resolve } = {}
  ) {
    setOrDetectLocale(cliOptions.locale);

    const npxCmd = process.platform === 'win32' ? 'npx.cmd': 'npx';

    console.log();
    console.log('hi from handleCliOptions in creator.js');
    console.log();

    if (resolve) return resolve(11);
    return 11;

    // should display command/s that will be run, similar to what the release
    // script does, so it's easier to figure out what's happening and how
    // options are combining

    // are there prompts?

    // if so, and --yes was NOT spec'd then run the prompts and upate options
    // with answers

    // --yes should apply to creator and init, but not to subcreator; if
    // subcreator has a --yes option then it should be sepc'd with `-- --yes`
    // ...could support --<subshortname>-yes

    // support a --cra-version options

    // support all options embark-init supports and forward them to embark-init
    // if a project name isn't specified then pass '.' to create-react-app the
    // embark-init options should be an export from embark-init, that way the
    // creator doesn't have to "know about" specifics of embark-init

    // if `--` was spec'd then ignore subcreator.options, consider it an
    // implicit --yes to prompts and supply options that followed `--`

    // ^ should probably have an --init-prompts for the creator that can
    // combine with `--yes` and `--`

    // if (!Array.isArray(creator.subcreator.command)) {
    //   creator.subcreator.command = [creator.subcreator.command];
    // }

    // let subp = spawn(npxCmd, [
    //   ...creator.subcreator.command,
    //   ...creator.subcreator.options
    // ], {
    //   stdio: 'inherit'
    // });

    // let _reject, _resolve;
    // let promise = new Promise((res, rej) => { _resolve = res; _reject = rej; });

    // subp.on('error', error => { _reject(error); });
    // subp.on('exit', code => { _resolve(code); });

    // try {
    //   const code = await promise;
    //   if (code) {
    //     if (resolve) return resolve(code);
    //     return code;
    //   }
    // } catch (error) {
    //   if (reject) return reject(error);
    //   throw error;
    // }

    // process init.options and build an array that combines/overrides re:
    // matching options spec'd in the creator's cli
    const initCliOptions = [];

    // report what final options get forwarded to embark-init
    initHandleCliOptions(
      initCliOptions,
      { argv, init: creator.init, program, promise, reject, resolve }
    );
  }

  function cli(
    program,
    {
      argv = [],
      promise,
      reject,
      resolve
    } = {}
  ) {
    if (!program) {
      program = new Command();
      program.version(creator.version);
    }
    program.description(`Creates a new Embark dapp using ${creator.subcreator.name}`);
    program.usage(`[options] [-- [${creator.subcreator.abbrev}-options]]`);
    creator = replaceTokens(creator);
    makeCreatorCommanderOptions(creator).forEach(opt => { program.option(...opt); });
    program.action((...args) => handleCliOptions(args, { argv, program, promise, reject, resolve }));
    program.on('--help', () => { if (creator.extraHelp) console.log('\n' + creator.extraHelp); });
    return program;
  }

  return function creatorMain(
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
  };
}
