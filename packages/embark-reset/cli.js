// don't forget to deal with internationalization

const commander = require("commander");
const {
  defaultOptions,
  defaults,
  errorClasses: { OptionTypeError, PathTypeError, WorkingDirTypeError },
  getProjectDir,
  handleOptions,
  pathErrorKinds: { ABSOLUTE, OUTSIDE }
} = require("./options");
const {
  exitWithError: _exitWithError,
  exitWithSuccess
} = require("embark-cli-utils");
const { __, setOrDetectLocale } = require('embark-i18n');
const isEqual = require("lodash.isequal");
const { join, relative, resolve } = require("path");
const { reset } = require(".");

const pkgJsonPath = join(__dirname, "package.json");
const pkgJson = require(pkgJsonPath);

function exitWithError(e) {
  _exitWithError(pkgJson, null, e);
}

function exitWithErrorMsg(message) {
  _exitWithError(null, message);
}

async function handleCliOptions(args) {
  try {
    const program = args.pop();
    setOrDetectLocale(program.locale);

    const config = program.config;
    const defaultPaths = program.defaultPaths;
    const workingDir = defaultOptions.workingDir;
    const projectDir = getProjectDir(workingDir);
    const paths = args.map(path => {
      path = resolve(workingDir, path);
      return relative(projectDir, path);
    });

    let options = { config, defaultPaths, paths, workingDir };
    if (isEqual(options, defaultOptions)) options = defaults;

    const display = path => {
      path = resolve(projectDir, path);
      if (!program.absolute) {
        path = relative(workingDir, path);
      }
      console.log(path);
    };

    if (program.list) {
      const { paths } = handleOptions(options);
      [...paths].forEach(path => display(path));
      return;
    }

    if (program.listDefaults) {
      const { DEFAULT_PATHS_plus } = handleOptions(options);
      [...new Set(DEFAULT_PATHS_plus)].forEach(path => display(path));
      return;
    }

    await reset(options);
    exitWithSuccess(__("reset done!"));
  } catch (e) {
    exitWithError(e);
  }
}

async function main(program = spec()) {
  try {
    program.parse(process.argv);
  } catch (err) {
    exitWithError(err);
  }
}

function spec(program) {
  if (!program) {
    program = commander;
    program.version(pkgJson.version);
  }
  program.description(
    [
      __("resets state of DApp project directory"),
      " " + __("[paths...]") + " " + _("must be relative to the current working directory and within the project directory")
    ].join("\n\n")
  );
  program.usage("[options] [paths...]");
  program.option(
    "-l --list",
    __("list all paths that would be removed but do not remove them")
  );
  program.option(
    "-d --list-defaults",
    __("list only default removal paths")
  );
  program.option(
    "-a --absolute",
    __("when listing show aboslute paths instead of paths relative to current working directory")
  );
  program.option(
    "-C --no-config",
    __("do not load command options and default paths from embark.json")
  );
  program.option(
    "-D --no-default-paths",
    _("do not include default removal paths with paths supplied from cli and/or embark.json")
  );
  program.option(
    "--locale [locale]",
    __("language to use (default: en)")
  );
  program.action((...args) => handleCliOptions(args));
  return program;
}

// clean up cliUtils to use this exports style (but supporting old node)
module.exports = {
  handleCliOptions,
  main,
  spec
};
