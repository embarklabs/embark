let http = require('follow-redirects').http;
let https = require('follow-redirects').https;

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

module.exports = {
  downloadFile
};
