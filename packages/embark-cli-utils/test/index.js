require("colors");
const { exitWithSuccess, logInfo, logSuccess, logWarn } = require("..");

jest.spyOn(global.console, "log").mockImplementation(() => {});
jest.spyOn(global.console, "warn").mockImplementation(() => {});
jest.spyOn(global.process, "exit").mockImplementation(() => {});

describe("exitWithSuccess", () => {
  beforeEach(() => {
    console.log.mockClear();
    process.exit.mockClear();
  });

  test("logs a message and exits without error", () => {
    const message = "test";
    exitWithSuccess(message);
    expect(console.log).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  test("doesn't log a message when none is supplied", () => {
    exitWithSuccess();
    expect(console.log).not.toHaveBeenCalled();
  });
});

describe("logInfo", () => {
  beforeEach(() => {
    console.log.mockClear();
  });

  test("logs a string prepended with a blue 'ℹ'", () => {
    logInfo("test");
    expect(console.log).toHaveBeenCalledWith("ℹ".blue, "test");
  });
});

describe("logSuccess", () => {
  beforeEach(() => {
    console.log.mockClear();
  });

  test("logs a string prepended with a green '✔'", () => {
    logSuccess("test");
    expect(console.log).toHaveBeenCalledWith("✔".green, "test");
  });
});

describe("logWarn", () => {
  beforeEach(() => {
    console.warn.mockClear();
  });

  test("logs a string prepended with a yellow '‼︎'", () => {
    logWarn("test");
    expect(console.warn).toHaveBeenCalledWith("‼︎".yellow, "test");
  });
});
