const at = require("lodash.at");
const { dirname, join, resolve } = require("path");
const findUp = require("find-up");
const { isAbsolute } = require("path");
const merge = require("lodash.merge");
const subdir = require("subdir");

const ABSOLUTE = Symbol("absolute");
const EMBARK_JSON = "embark.json";
const OUTSIDE = Symbol("outside");
const TRUE = Symbol("true");

class OptionTypeError extends TypeError {
  constructor({ message, name }) {
    super(`${name} ${message}`);
    this.optionName = name;
  }
}

class PathTypeError extends OptionTypeError {
  constructor({ kind, message, name, path }) {
    super({ message, name });
    this.kind = kind;
    this.path = path;
  }
}

class WorkingDirTypeError extends OptionTypeError {
  constructor({ message, name, path }) {
    super({ message, name });
    this.path = path;
  }
}

const DEFAULT_PATHS = [
  ".embark",
  "chains.json",
  "coverage",
  "node_modules/.cache"
];

const defaultOptions = {
  config: TRUE,
  defaultPaths: TRUE,
  paths: [],
  workingDir: process.env.INIT_CWD || process.cwd()
};

const defaultConfigOptions = {
  commands: {
    reset: {
      config: true,
      defaultPaths: true,
      paths: []
    }
  }
};

const configOptionsSupplyingDefaultPaths = ["buildDir", "generationDir"];

function check(optionName, impl, ErrorClass = OptionTypeError) {
  return function(value, ...args) {
    let result = impl(value, ...args);
    if (result) throw new ErrorClass({ name: optionName, ...result });
  };
}

const checkPath = check(
  "path",
  (path, projectDir) => {
    let kind, message;
    if (isAbsolute(path)) {
      kind = ABSOLUTE;
      message = "must be relative";
    } else if (!subdir(projectDir, path)) {
      kind = OUTSIDE;
      message = "must be within the DApp project directory";
    }
    if (message) return { kind, message, path };
  },
  PathTypeError
);

const checkPaths = check("paths", (paths, workingDir) => {
  if (!paths[Symbol.iterator]) return { message: "option must be iterable" };
  const projectDir = getProjectDir(workingDir);
  paths.forEach(path => checkPath(path, projectDir));
});

const checkWorkingDir = check(
  "workingDir",
  path => {
    if (!isInsideProjectDir(path)) {
      return {
        message: "option must be within a DApp project directory",
        path
      };
    }
  },
  WorkingDirTypeError
);

function getConfigOptions(projectDir) {
  return merge(
    {},
    defaultConfigOptions,
    require(join(projectDir, EMBARK_JSON))
  );
}

function getProjectDir(workingDir) {
  let projectDir;
  try {
    const embarkJsonPath = findUp.sync(EMBARK_JSON, {
      cwd: resolve(workingDir)
    });
    if (embarkJsonPath) projectDir = dirname(embarkJsonPath);
  } catch (e) {
    projectDir = false;
  }
  if (!projectDir) {
    throw new Error("could not determine the DApp project directory");
  }
  return projectDir;
}

function handleOptions(options) {
  // caller supplied options will take precedence over config options
  // except for config paths, which will be merged with user supplied paths if `config:true`
  options = validate(options);
  let { config, defaultPaths, paths, projectDir, workingDir } = options;
  const DEFAULT_PATHS_plus = DEFAULT_PATHS.slice();

  let configOptions;
  if (config) configOptions = getConfigOptions(projectDir);
  if (config && config === defaultOptions.config) {
    config = configOptions.commands.reset.config;
  }
  if (config) {
    const {
      commands: {
        reset: { defaultPaths: configDefaultPaths, paths: configPaths }
      }
    } = configOptions;
    paths = new Set([...paths, ...configPaths]);
    DEFAULT_PATHS_plus.push(
      ...at(configOptions, configOptionsSupplyingDefaultPaths).filter(v => v)
    );
    if (defaultPaths === defaultOptions.defaultPaths) {
      defaultPaths = configDefaultPaths;
    }
  }

  paths = new Set([...paths, ...(defaultPaths ? DEFAULT_PATHS_plus : [])]);

  return {
    DEFAULT_PATHS_plus,
    config,
    defaultPaths,
    paths,
    projectDir,
    workingDir
  };
}

function isInsideProjectDir(path) {
  try {
    const projectDir = getProjectDir(path);
    path = resolve(path);
    if (projectDir === path) return true;
    return subdir(projectDir, path);
  } catch (e) {
    return false;
  }
}

function validate(options) {
  if (!options || typeof options !== "object") {
    throw new TypeError("options must be an object");
  }
  if (options !== defaultOptions) {
    options = Object.assign({}, defaultOptions, options);
  }
  const { paths, workingDir } = options;
  checkWorkingDir(workingDir);
  checkPaths(paths, workingDir);
  return { projectDir: getProjectDir(workingDir), ...options };
}

module.exports = {
  DEFAULT_PATHS,
  defaultConfigOptions,
  defaultOptions: Object.assign({}, defaultOptions, {
    config: true,
    defaultPaths: true
  }),
  defaults: defaultOptions,
  errorClasses: {
    OptionTypeError,
    PathTypeError,
    WorkingDirTypeError
  },
  getConfigOptions,
  getProjectDir,
  handleOptions,
  isInsideProjectDir,
  pathErrorKinds: {
    ABSOLUTE,
    OUTSIDE
  },
  validate,
  validators: {
    path: checkPath,
    paths: checkPaths,
    workingDir: checkWorkingDir
  }
};
