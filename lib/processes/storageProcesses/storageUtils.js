const IPFS = 'ipfs';
const SWARM = 'swarm';

class StorageUtils {
  static getCommand(storageName, config) {
    if (storageName === IPFS) {
      return IPFS;
    }
    if (storageName === SWARM) {
      return config.swarmPath || SWARM;
    }
    return null;
  }

  static getStorageInstallationSite(storageName) {
    if (storageName === IPFS) {
      return 'https://ipfs.io/docs/install/';
    }
    if (storageName === SWARM) {
      return 'http://swarm-guide.readthedocs.io/en/latest/installation.html';
    }
  }
}

module.exports = StorageUtils;
