let http = require('follow-redirects').http;
let https = require('follow-redirects').https;

const HTTP_CONTRACTS_DIRECTORY = ".embark/contracts/";

function downloadFile(url, dest, cb) {
  const o_fs = require('fs-extra');
  var file = o_fs.createWriteStream(dest);
  (url.substring(0, 5) === 'https' ? https : http).get(url, function (response) {
    if (response.statusCode !== 200) {
      cb(`Download failed, response code ${response.statusCode}`);
      return;
    }
    response.pipe(file);
    file.on('finish', function () {
      file.close(cb);
    });
  }).on('error', function (err) {
    o_fs.unlink(dest);
    cb(err.message);
  });
}

function getExternalContractUrl(file,providerUrl) {
  let url;
  const RAW_URL = 'https://raw.githubusercontent.com/';
  const DEFAULT_SWARM_GATEWAY = 'https://swarm-gateways.net/';
  const MALFORMED_SWARM_ERROR = 'Malformed Swarm gateway URL for ';
  const MALFORMED_ERROR = 'Malformed Github URL for ';
  const MALFORMED_IPFS_ERROR = 'Malformed IPFS URL for ';
  const IPFS_GETURL_NOTAVAILABLE = 'IPFS getUrl is not available. Please set it in your storage config. For more info: https://embark.status.im/docs/storage_configuration.html';
  if (file.startsWith('https://github')) {
    const match = file.match(/https:\/\/github\.[a-z]+\/(.*)/);
    if (!match) {
      console.error(MALFORMED_ERROR + file);
      return null;
    }
    url = `${RAW_URL}${match[1].replace('blob/', '')}`;
  } else if (file.startsWith('ipfs')) {
    if(!providerUrl) {
      console.error(IPFS_GETURL_NOTAVAILABLE);
      return null;
    }
    let match = file.match(/ipfs:\/\/([-a-zA-Z0-9]+)\/(.*)/);
    if(!match) {
      match = file.match(/ipfs:\/\/([-a-zA-Z0-9]+)/);
      if(!match) {
        console.error(MALFORMED_IPFS_ERROR + file);
        return null;
      }
    }
    let matchResult = match[1];
    if(match[2]) {
      matchResult += '/' + match[2];
    }
    url = `${providerUrl}${matchResult}`;
    return {
      url,
      filePath: HTTP_CONTRACTS_DIRECTORY + matchResult
    };
  } else if (file.startsWith('git')) {
    // Match values
    // [0] entire input
    // [1] git://
    // [2] user
    // [3] repository
    // [4] path
    // [5] branch
    const match = file.match(
      /(git:\/\/)?github\.[a-z]+\/([-a-zA-Z0-9@:%_+.~#?&=]+)\/([-a-zA-Z0-9@:%_+.~#?&=]+)\/([-a-zA-Z0-9@:%_+.~?\/&=]+)#?([a-zA-Z0-9\/_.-]*)?/
    );
    if (!match) {
      console.error(MALFORMED_ERROR + file);
      return null;
    }
    let branch = match[5];
    if (!branch) {
      branch = 'master';
    }
    url = `${RAW_URL}${match[2]}/${match[3]}/${branch}/${match[4]}`;
  } else if (file.startsWith('http')) {
    url = file;
  } else if(file.startsWith('bzz')){
    if(!providerUrl) {
      url = DEFAULT_SWARM_GATEWAY + file;
    } else {
      let match = file.match(/bzz:\/([-a-zA-Z0-9]+)\/(.*)/);
      if(!match){
        match = file.match(/bzz:\/([-a-zA-Z0-9]+)/);
        if(!match){
          console.log(MALFORMED_SWARM_ERROR + file);
          return null;
        }
      }
      url = providerUrl + '/' + file;
    }
  } else {
    return null;
  }
  const match = url.match(
    /\.[a-z]+\/([-a-zA-Z0-9@:%_+.~#?&\/=]+)/
  );
  return {
    url,
    filePath: HTTP_CONTRACTS_DIRECTORY + match[1]
  };
}

module.exports = {
  downloadFile,
  getExternalContractUrl
};
