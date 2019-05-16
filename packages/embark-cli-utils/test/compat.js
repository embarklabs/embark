const semver = require("semver");
jest.mock("semver");

const path = require("path");
const { encountered, errorMark, errorLogger } = require("../constants");

const compat = require("../compat");
const {
  getPkgJson,
  defaultRange,
  getNodeVerRange,
  log,
  logError,
  pkgNameCyan,
  exitWithError,
  enforceRuntimeNodeVersion
} = compat;

const goodPkgJsonPath = path.join(__dirname, "../package.json");
const badPkgJsonPath = "package.json";
const message = "test";
const message2 = "test2";
const error = new Error(message);
const pkgJson = { name: "some-package" };

describe("getPkgJson", () => {
  test("should return the object form of the JSON contents of the file at supplied path", () => {
    expect(getPkgJson(goodPkgJsonPath)).toEqual(require(goodPkgJsonPath));
  });

  test("should return an empty object in the case of a bad path", () => {
    expect(getPkgJson(badPkgJsonPath)).toEqual({});
    expect(getPkgJson()).toEqual({});
  });
});

describe("defaultRange", () => {
  test("should return the node range from embark-cli-utils' own package.json", () => {
    expect(defaultRange()).toBe(require(goodPkgJsonPath).runtime.engines.node);
  });
});

describe("getNodeVerRange", () => {
  const mockRange1 = "1.2.3";
  const mockRange2 = ">=12.0.0";
  beforeAll(() => {
    jest.spyOn(compat, "defaultRange").mockImplementation(() => mockRange1);
  });

  beforeEach(() => {
    compat.defaultRange.mockClear();
  });

  afterAll(() => {
    compat.defaultRange.mockRestore();
  });

  test("should return the runtime range if supplied in package.json", () => {
    expect(
      getNodeVerRange({ runtime: { engines: { node: mockRange2 } } })
    ).toBe(mockRange2);
  });

  test("should return the default range if a runtime range is not supplied in package.json", () => {
    expect(getNodeVerRange({})).toBe(mockRange1);
  });
});

describe("log", () => {
  beforeAll(() => {
    jest.spyOn(global.console, "log").mockImplementation(() => {});
    jest.spyOn(global.console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    console.log.mockClear();
    console.error.mockClear();
  });

  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  test("should log the mark and strings using the supplied logger", () => {
    log(errorMark, [], errorLogger);
    expect(console.error).toHaveBeenCalledWith(errorMark, "");

    log(errorMark, ["a"], errorLogger);
    expect(console.error).toHaveBeenLastCalledWith(errorMark, "a");

    log(errorMark, ["a", "b"], errorLogger);
    expect(console.error).toHaveBeenLastCalledWith(errorMark, "a b");
  });

  test("should default to logging with console.log when no console property is supplied", () => {
    log(errorMark, []);
    expect(console.log).toHaveBeenCalledWith(errorMark, "");

    log(errorMark, ["a"]);
    expect(console.log).toHaveBeenLastCalledWith(errorMark, "a");

    log(errorMark, ["a", "b"]);
    expect(console.log).toHaveBeenLastCalledWith(errorMark, "a b");
  });
});

describe("logError", () => {
  beforeAll(() => {
    jest.spyOn(compat, "log").mockImplementation(() => {});
  });

  beforeEach(() => {
    compat.log.mockClear();
  });

  afterAll(() => {
    compat.log.mockRestore();
  });

  test("should log zero or more strings", () => {
    logError();
    expect(compat.log).toHaveBeenCalledWith(errorMark, [], errorLogger);

    logError(message);
    expect(compat.log).toHaveBeenLastCalledWith(
      errorMark,
      [message],
      errorLogger
    );

    logError(message, message2);
    expect(compat.log).toHaveBeenLastCalledWith(
      errorMark,
      [message, message2],
      errorLogger
    );
  });
});

describe("pkgNameCyan", () => {
  test("should return the cyan-colored package name string", () => {
    expect(pkgNameCyan(pkgJson)).toBe(pkgJson.name.cyan);
  });

  test("should return an empty string when there is no name property", () => {
    expect(pkgNameCyan({})).toBe("");
  });
});

describe("exitWitError", () => {
  beforeAll(() => {
    jest.spyOn(compat, "logError").mockImplementation(() => {});
    jest.spyOn(global.console, "error").mockImplementation(() => {});
    jest.spyOn(global.process, "exit").mockImplementation(() => {});
  });

  beforeEach(() => {
    compat.logError.mockClear();
    console.error.mockClear();
    process.exit.mockClear();
  });

  afterAll(() => {
    compat.logError.mockRestore();
    console.error.mockReset();
    process.exit.mockRestore();
  });

  test("should exit with error code", () => {
    exitWithError();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test("should log a generic message when no arguments are supplied", () => {
    exitWithError();
    expect(compat.logError).toHaveBeenCalledWith(encountered);
    expect(compat.logError).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(0);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test("should log a generic message with the package name when only pkgJson is supplied", () => {
    exitWithError(pkgJson);
    expect(compat.logError).toHaveBeenCalledWith(
      `${"some-package".cyan} ${encountered}`
    );
    expect(compat.logError).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(0);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test("should log supplied message", () => {
    exitWithError(pkgJson, message);
    expect(compat.logError).toHaveBeenNthCalledWith(
      1,
      `${"some-package".cyan} ${encountered}`
    );
    expect(compat.logError).toHaveBeenNthCalledWith(2, message);
    expect(compat.logError).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledTimes(0);
    expect(process.exit).toHaveBeenCalledWith(1);

    compat.logError.mockClear();
    console.error.mockClear();
    process.exit.mockClear();

    exitWithError(false, message);
    expect(compat.logError).toHaveBeenNthCalledWith(1, message);
    expect(compat.logError).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(0);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test("should log supplied error", () => {
    exitWithError(pkgJson, message, error);
    expect(compat.logError).toHaveBeenNthCalledWith(
      1,
      `${"some-package".cyan} ${encountered}`
    );
    expect(compat.logError).toHaveBeenNthCalledWith(2, message);
    expect(compat.logError).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenNthCalledWith(1, error);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(1);

    compat.logError.mockClear();
    console.error.mockClear();
    process.exit.mockClear();

    exitWithError(false, message, error);
    expect(compat.logError).toHaveBeenNthCalledWith(1, message);
    expect(compat.logError).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenNthCalledWith(1, error);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(1);

    compat.logError.mockClear();
    console.error.mockClear();
    process.exit.mockClear();

    exitWithError(pkgJson, false, error);
    expect(compat.logError).toHaveBeenNthCalledWith(
      1,
      `${"some-package".cyan} ${encountered}`
    );
    expect(compat.logError).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenNthCalledWith(1, error);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(1);

    compat.logError.mockClear();
    console.error.mockClear();
    process.exit.mockClear();

    exitWithError(false, false, error);
    expect(compat.logError).toHaveBeenCalledTimes(0);
    expect(console.error).toHaveBeenNthCalledWith(1, error);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

describe.skip("side effects with console and process", () => {
  beforeAll(() => {
    jest.spyOn(global.console, "log").mockImplementation(() => {});
    jest.spyOn(global.console, "error").mockImplementation(() => {});
    jest.spyOn(global.process, "exit").mockImplementation(() => {});
  });

  beforeEach(() => {
    console.log.mockClear();
    console.error.mockClear();
    process.exit.mockClear();
  });

  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
    process.exit.mockRestore();
  });

  describe("enforceRuntimeNodeVersion", () => {
    beforeEach(() => {
      semver.clean.mockReset();
      semver.satisfies.mockReset();
    });

    afterAll(() => {
      jest.unmock("semver");
    });

    test("should have no effects when version satisfies range", () => {
      const goodNodeVer = "10.0.0";
      semver.clean.mockReturnValue(goodNodeVer);
      semver.satisfies.mockReturnValue(true);
      enforceRuntimeNodeVersion(goodPkgJsonPath);
      expect(console.error).not.toHaveBeenCalled();
      expect(process.exit).not.toHaveBeenCalled();
    });

    test("should exit with error message when version does not satisfy range", () => {
      const badNodeVer = "6.0.0";
      semver.clean.mockReturnValue(badNodeVer);
      semver.satisfies.mockReturnValue(false);
      enforceRuntimeNodeVersion(goodPkgJsonPath);
      expect(console.error).toHaveBeenNthCalledWith(
        1,
        errorMark,
        `node version ${badNodeVer.red} is not supported, version ${
          defaultRange().green
        } is required by ${require(goodPkgJsonPath).name.cyan}`
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    test("should exit with error when it encounters an exception", () => {
      const cleanError = new Error();
      semver.clean.mockImplementation(() => {
        throw cleanError;
      });
      enforceRuntimeNodeVersion(goodPkgJsonPath);
      expect(console.error).toHaveBeenNthCalledWith(
        1,
        errorMark,
        expect.stringContaining(
          `${require(goodPkgJsonPath).name.cyan} encountered`
        )
      );
      expect(console.error).toHaveBeenNthCalledWith(2, cleanError);
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    test("should exit with an error message that lacks a package name when the name is missing", () => {
      const badNodeVer = "6.0.0";
      semver.clean.mockReturnValue(badNodeVer);
      semver.satisfies.mockReturnValue(false);
      enforceRuntimeNodeVersion(badPkgJsonPath);
      expect(console.error).toHaveBeenNthCalledWith(
        1,
        errorMark,
        `node version ${badNodeVer.red} is not supported, version ${
          defaultRange().green
        } is required`
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});
