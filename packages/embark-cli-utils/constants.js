/* this script is written to be runnable with node >=0.10.0 */

require("colors");

exports.errorLogger = "error";
exports.logLogger = "log";
exports.warnLogger = "warn";

exports.errorMark = "✘".red;
exports.infoMark = "ℹ".blue;
exports.successMark = "✔".green;
exports.warnMark = "‼︎".yellow;

exports.encountered = "encountered an error";
