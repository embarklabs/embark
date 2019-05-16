const { join } = require("path");
const { defaults, handleOptions } = require("./options");
// const rimraf = require("util").promisify(require("rimraf"));
const rimraf = async p => console.log(p);

async function reset(options = defaults) {
  const { paths, projectDir } = handleOptions(options);
  await Promise.all(
    [...paths].map(relative => rimraf(join(projectDir, relative)))
  );
}

module.exports = {
  reset
};
