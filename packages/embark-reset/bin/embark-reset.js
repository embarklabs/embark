#!/usr/bin/env node
/* this script is written to be runnable with node >=0.10.0 */

require("embark-cli-utils/compat").enforceRuntimeNodeVersion(
  require("path").join(__dirname, "../package.json")
);
require("../cli").main();
