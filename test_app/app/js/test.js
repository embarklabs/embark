
$(document).ready(function() {

  async.waterfall([
    function test1(callback) {
      AnotherStorage.simpleStorageAddress().then(function(simpleStorageAddress) {
        $("#tests").append("<br>test 1: " + (simpleStorageAddress === SimpleStorage.address));
        callback();
      });
    },
    function test2(callback) {
      SimpleStorage.storedData().then(function(result) {
        $("#tests").append("<br>test 2 (true first time): " + (result.toNumber() === 100));
        $("#tests").append("<br>test 2 (true after): " + (result.toNumber() === 150));
        callback();
      });
    },
    function test3(callback) {
      SimpleStorage.set(150).then(function() {
        SimpleStorage.get().then(function(result) {
          $("#tests").append("<br>test 3: " + (result.toNumber() === 150));
          callback();
        });
      });
    },
    function test4(callback) {
      $("#tests").append("<br>test 4: " + (Token.address === "undefined"));
      $("#tests").append("<br>test 4: " + (MyToken.address !== undefined));
      $("#tests").append("<br>test 4: " + (MyToken2.address !== undefined));
      callback();
    },
    function test5(callback) {
      MyToken._supply().then(function(result) {
        $("#tests").append("<br>test 5: " + (result.toNumber() === 1000));
        callback();
      });
    },
    function test6(callback) {
      MyToken2._supply().then(function(result) {
        $("#tests").append("<br>test 6: " + (result.toNumber() === 2000));
        callback();
      });
    },
    function test7(callback) {
      $("#tests").append("<br>test 7: " + (AlreadyDeployedToken.address === "0x123"));
      callback();
    }
  ], function (err, result) {
      $("#tests").append("<br>done");
  });

});

