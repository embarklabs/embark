require("colors");
const { exitWithSuccess, logInfo, logSuccess, logWarn } = require("..");

beforeAll(() => {
  jest.spyOn(global.console, "log").mockImplementation(() => {});
  jest.spyOn(global.console, "warn").mockImplementation(() => {});
  jest.spyOn(global.process, "exit").mockImplementation(() => {});
});

beforeEach(() => {
  console.log.mockClear();
  console.warn.mockClear();
  process.exit.mockClear();
});

afterAll(() => {
  console.log.mockRestore();
  console.warn.mockRestore();
  process.exit.mockRestore();
});

const greenCheck = "✔".green;
const message = "test";
const message2 = "test2";
const comboMsg = `${message} ${message2}`;

describe("exitWithSuccess", () => {
  test("should log a message and exit without error", () => {
    exitWithSuccess(message);
    expect(console.log).toHaveBeenCalledWith(greenCheck, message);
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  test("shouldn't log a message when none is supplied", () => {
    exitWithSuccess();
    expect(console.log).not.toHaveBeenCalledWith(greenCheck, message);
    expect(process.exit).toHaveBeenCalledWith(0);
  });
});

describe("logInfo", () => {
  test("should log one or more strings prepended with a blue 'ℹ'", () => {
    const blueI = "ℹ".blue;

    logInfo(message);
    expect(console.log).toHaveBeenCalledWith(blueI, message);

    console.log.mockClear();

    logInfo(message, message2);
    expect(console.log).toHaveBeenCalledWith(blueI, comboMsg);

    console.log.mockClear();

    logInfo();
    expect(console.log).toHaveBeenCalledWith(blueI, "");
  });
});

describe("logSuccess", () => {
  test("should log one or more strings prepended with a green '✔'", () => {
    logSuccess(message);
    expect(console.log).toHaveBeenCalledWith(greenCheck, message);

    console.log.mockClear();

    logSuccess(message, message2);
    expect(console.log).toHaveBeenCalledWith(greenCheck, comboMsg);

    console.log.mockClear();

    logSuccess();
    expect(console.log).toHaveBeenCalledWith(greenCheck, "");
  });
});

describe("logWarn", () => {
  test("should log one or more strings prepended with a yellow '‼︎'", () => {
    const yellowBang = "‼︎".yellow;

    logWarn(message);
    expect(console.warn).toHaveBeenCalledWith(yellowBang, message);

    console.warn.mockClear();

    logWarn(message, message2);
    expect(console.warn).toHaveBeenCalledWith(yellowBang, comboMsg);

    console.warn.mockClear();

    logWarn();
    expect(console.warn).toHaveBeenCalledWith(yellowBang, "");
  });
});
