const semver = require("semver");
jest.mock("semver");

const {
  defaultRange,
  enforceRuntimeNodeVersion,
  exitWithError,
  getPkgJson,
  getNodeVerRange,
  log,
  logError,
  pkgNameCyan
} = require("../compat");
const path = require("path");

const goodPkgJsonPath = path.join(__dirname, "../package.json");
const badPkgJsonPath = "package.json";

describe("defaultRange", () => {
  test("should return the node range from embark-cli-utils' own package.json", () => {
    expect(defaultRange()).toBe(require(goodPkgJsonPath).runtime.engines.node);
  });
});

describe("getPkgJson", () => {
  test("should return the object form of the JSON contents of the file at supplied path", () => {
    expect(getPkgJson(goodPkgJsonPath)).toEqual(require(goodPkgJsonPath));
  });

  test("should return an empty object in the case of a bad path", () => {
    expect(getPkgJson(badPkgJsonPath)).toEqual({});
    expect(getPkgJson()).toEqual({});
  });
});

describe("getNodeVerRange", () => {
  test("should return the runtime range if supplied in package.json", () => {
    expect(
      getNodeVerRange({ runtime: { engines: { node: ">=12.0.0" } } })
    ).toBe(">=12.0.0");
  });

  test("should return the default range if a runtime range is not supplied in package.json", () => {
    expect(getNodeVerRange({})).toBe(defaultRange());
  });
});

describe("side effects with console and process", () => {
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

  const message = "test";
  const message2 = "test2";
  const comboMsg = `${message} ${message2}`;
  const pkgJson = { name: "some-package" };
  const error = new Error(test);
  const redX = "✘".red;

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
        redX,
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
        redX,
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
        redX,
        `node version ${badNodeVer.red} is not supported, version ${
          defaultRange().green
        } is required`
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe("exitWitError", () => {
    test("should exit with error code", () => {
      exitWithError();
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    test("should log a generic message when no arguments are supplied", () => {
      exitWithError();
      expect(console.error).toHaveBeenCalledWith(
        redX,
        expect.stringMatching(/^encountered/)
      );
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    test("should log a generic message with the package name when only pkgJson is supplied", () => {
      exitWithError(pkgJson);
      expect(console.error).toHaveBeenCalledWith(
        redX,
        expect.stringContaining(`${"some-package".cyan} encountered`)
      );
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    test("should log supplied message", () => {
      exitWithError(pkgJson, message);
      expect(console.error).toHaveBeenNthCalledWith(
        1,
        redX,
        expect.stringContaining(`${"some-package".cyan} encountered`)
      );
      expect(console.error).toHaveBeenNthCalledWith(2, redX, message);
      expect(console.error).toHaveBeenCalledTimes(2);
      expect(process.exit).toHaveBeenCalledWith(1);

      console.error.mockClear();
      process.exit.mockClear();

      exitWithError(false, message);
      expect(console.error).toHaveBeenNthCalledWith(1, redX, message);
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    test("should log supplied error", () => {
      exitWithError(pkgJson, message, error);
      expect(console.error).toHaveBeenNthCalledWith(
        1,
        redX,
        expect.stringContaining(`${"some-package".cyan} encountered`)
      );
      expect(console.error).toHaveBeenNthCalledWith(2, redX, message);
      expect(console.error).toHaveBeenNthCalledWith(3, error);
      expect(console.error).toHaveBeenCalledTimes(3);
      expect(process.exit).toHaveBeenCalledWith(1);

      console.error.mockClear();
      process.exit.mockClear();

      exitWithError(false, message, error);
      expect(console.error).toHaveBeenNthCalledWith(1, redX, message);
      expect(console.error).toHaveBeenNthCalledWith(2, error);
      expect(console.error).toHaveBeenCalledTimes(2);
      expect(process.exit).toHaveBeenCalledWith(1);

      console.error.mockClear();
      process.exit.mockClear();

      exitWithError(pkgJson, false, error);
      expect(console.error).toHaveBeenNthCalledWith(
        1,
        redX,
        expect.stringContaining(`${"some-package".cyan} encountered`)
      );
      expect(console.error).toHaveBeenNthCalledWith(2, error);
      expect(console.error).toHaveBeenCalledTimes(2);
      expect(process.exit).toHaveBeenCalledWith(1);

      console.error.mockClear();
      process.exit.mockClear();

      exitWithError(false, false, error);
      expect(console.error).toHaveBeenNthCalledWith(1, error);
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe("log", () => {
    test("should default to logging with console.log when no console property is supplied", () => {
      const magentaO = "o".magenta;

      log(magentaO, ["a", "b"]);
      expect(console.log).toHaveBeenCalledWith(magentaO, "a b");

      console.log.mockClear();

      log(magentaO, []);
      expect(console.log).toHaveBeenCalledWith(magentaO, "");
    });
  });

  describe("logError", () => {
    test("should log one or more strings prepended with a red '✘'", () => {
      logError(message);
      expect(console.error).toHaveBeenCalledWith(redX, message);

      console.error.mockClear();

      logError(message, message2);
      expect(console.error).toHaveBeenCalledWith(redX, comboMsg);

      console.error.mockClear();

      logError();
      expect(console.error).toHaveBeenCalledWith(redX, "");
    });
  });
});

describe("pkgNameCyan", () => {
  const pkgJson = { name: "some-package" };

  test("should return the cyan-colored package name string", () => {
    expect(pkgNameCyan(pkgJson)).toBe(`${pkgJson.name.cyan} `);
  });

  test("should return an empty string when there is no name property", () => {
    expect(pkgNameCyan({})).toBe("");
  });
});
