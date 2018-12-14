const {execSync} = require("child_process");
const {anchoredValue, DAPP_PATH} = require("../core/env");
const {hostname} = require("os");

const dappPath = anchoredValue(DAPP_PATH);

function subdir(pdir_, dir_) {
  let pdir = path.resolve(path.normalize(pdir_)) + (path.sep || "/");
  const dir = path.resolve(pdir, path.normalize(dir_));
  if (pdir === "//") { pdir = "/"; }
  if (pdir === dir) { return false; }
  return dir.slice(0, pdir.length) === pdir;
}

const isDocker = (() => {
  // assumption: an Embark container is always a Linux Docker container, though
  // the Docker host may be Linux, macOS, or Windows
  if (process.platform !== "linux") { return false; }
  try {
    return (
      new RegExp(`[0-9]+\:[a-z_-]+\:\/docker\/${hostname()}[0-9a-z]+`, "i")
    ).test(
      execSync(
        "cat /proc/self/cgroup",
        {stdio: ["ignore", "pipe", "ignore"]},
      ).toString(),
    );
  } catch (e) {
    return false;
  }
})();

const isDappMountedFromWindowsDockerHost = (() => {
  if (!isDocker) { return false; }
  try {
    return execSync(
      "mount",
      {stdio: ["ignore", "pipe", "ignore"]},
    )
      .toString()
      .split("\n")
      .filter((line) => /nounix/.test(line))
      .some((line) => {
        const mount = line.match(/on (\/.*) type/)[1];
        return mount === dappPath || subdir(mount, dappPath);
      });
  } catch (e) {
    return false;
  }
})();

const defaultHost = isDocker ? "0.0.0.0" : "localhost";

// when we're runing in Docker, we can expect (generally, in a development
// scenario) that the user would like to connect to the service in the
// container via the **host's** loopback address, so this helper can be used to
// swap 0.0.0.0 for localhost in code/messages that pertain to client-side
function canonicalHost(host: string): string {
  return isDocker && host === "0.0.0.0" ? "localhost" : host;
}

function dockerHostSwap(host: string): string {
  return (isDocker && (host === "localhost" || host === "127.0.0.1")) ? defaultHost : host;
}

const defaultCorsHost = canonicalHost(defaultHost);

export {
  canonicalHost,
  defaultCorsHost,
  defaultHost,
  dockerHostSwap,
  isDappMountedFromWindowsDockerHost,
  isDocker,
};
