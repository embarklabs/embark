$(document).ready(function() {

  window.ipfsConnection = window.IpfsApi('localhost', '5001');
  //ipfs.object.put
  //ipfs.add((new ipfs.Buffer("heydudehowareyou")), function(err, result) { console.log(result[0].path) })
  // see https://github.com/ConsenSys/ipfs.js for conversion to hex

  // id = "QmdAvyxUkvJFYeHmBFVkfDdYZvyummU32Q2MNDKbwrCMvP"
  //SimpleStorage.setHash(id)
  //web3.toAscii(SimpleStorage.foo())

  window.saveFileToIpfs =  function(file, cb) {
    var reader = new FileReader();
    reader.onloadend = function() { 
      var fileContent = reader.result;

      var buffer = ipfsConnection.Buffer.from(fileContent);
      ipfsConnection.add(buffer, function(err, result) {
        cb(err, result[0].path);
      });

    };
    reader.readAsArrayBuffer(file);
  };

  window.saveTextToIpfs =  function(content, cb) {
      ipfsConnection.add((new ipfsConnection.Buffer(content)), function(err, result) {
        cb(err, result[0].path);
      });
  };

});
