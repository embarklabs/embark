const compat = require("../compat");
jest.mock("../compat");
const { log } = compat;

const index = require("..");
const { logInfo, logSuccess, logWarn, exitWithSuccess } = index;

const {
  infoMark,
  logLogger,
  successMark,
  warnMark,
  warnLogger
} = require("../constants");

beforeAll(() => {
  jest.spyOn(global.process, "exit").mockImplementation(() => {});
});

beforeEach(() => {
  compat.log.mockClear();
  process.exit.mockClear();
});

afterAll(() => {
  jest.unmock("../compat");
  process.exit.mockRestore();
});

const message = "test";
const message2 = "test2";

describe("logInfo", () => {
  test("should log zero or more strings", () => {
    logInfo();
    expect(log).toHaveBeenCalledWith(infoMark, [], logLogger);

    logInfo(message);
    expect(log).toHaveBeenLastCalledWith(infoMark, [message], logLogger);

    logInfo(message, message2);
    expect(log).toHaveBeenLastCalledWith(
      infoMark,
      [message, message2],
      logLogger
    );
  });
});

describe("logSuccess", () => {
  test("should log zero or more strings", () => {
    logSuccess();
    expect(log).toHaveBeenCalledWith(successMark, [], logLogger);

    logSuccess(message);
    expect(log).toHaveBeenLastCalledWith(successMark, [message], logLogger);

    logSuccess(message, message2);
    expect(log).toHaveBeenLastCalledWith(
      successMark,
      [message, message2],
      logLogger
    );
  });
});

describe("logWarn", () => {
  test("should log zero or more strings", () => {
    logWarn();
    expect(log).toHaveBeenCalledWith(warnMark, [], warnLogger);

    logWarn(message);
    expect(log).toHaveBeenLastCalledWith(warnMark, [message], warnLogger);

    logWarn(message, message2);
    expect(log).toHaveBeenLastCalledWith(
      warnMark,
      [message, message2],
      warnLogger
    );
  });
});

describe("exitWithSuccess", () => {
  beforeAll(() => {
    jest.spyOn(index, "logSuccess").mockImplementation(() => {});
  });

  beforeEach(() => {
    index.logSuccess.mockClear();
  });

  afterAll(() => {
    index.logSuccess.mockRestore();
  });

  test("should log a message and exit without error", () => {
    exitWithSuccess(message);
    expect(index.logSuccess).toHaveBeenCalledWith(message);
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  test("shouldn't log a message when none is supplied", () => {
    exitWithSuccess();
    expect(index.logSuccess).not.toHaveBeenCalledWith(message);
    expect(process.exit).toHaveBeenCalledWith(0);
  });
});
