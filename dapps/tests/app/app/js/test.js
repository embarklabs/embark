/// import $ from 'jquery';
///
/// import {AlreadyDeployedToken, AnotherStorage, MyToken, MyToken2, SimpleStorage, Token} from '../../embarkArtifacts/contracts';
/// import async from 'async';
///
/// $(document).ready(function() {
///
///   document.getElementById("runTests").onclick = function() {
///     async.waterfall([
///       function test1(callback) {
///         AnotherStorage.methods.simpleStorageAddress().call().then(function(simpleStorageAddress) {
///           $("#tests").append("<br>test 1: " + (simpleStorageAddress === SimpleStorage._address));
///           callback();
///         });
///       },
///       function test2(callback) {
///         SimpleStorage.methods.storedData().call().then(function(result) {
///           $("#tests").append("<br>test 2 (true first time): " + (result === "100"));
///           $("#tests").append("<br>test 2 (true after): " + (result === "150"));
///           callback();
///         });
///       },
///       function test3(callback) {
///         SimpleStorage.methods.set(150).send({from: web3.eth.defaultAccount}).then(function() {
///           SimpleStorage.methods.get().call().then(function(result) {
///             $("#tests").append("<br>test 3: " + (result === "150"));
///             callback();
///           });
///         });
///       },
///       function test4(callback) {
///         $("#tests").append("<br>test 4: " + (Token._address === null));
///         $("#tests").append("<br>test 4: " + (MyToken._address !== undefined));
///         $("#tests").append("<br>test 4: " + (MyToken2._address !== undefined));
///         callback();
///       },
///       function test5(callback) {
///         MyToken.methods._supply().call().then(function(result) {
///           $("#tests").append("<br>test 5: " + (result === "1000"));
///           callback();
///         });
///       },
///       function test6(callback) {
///         MyToken2.methods._supply().call().then(function(result) {
///           $("#tests").append("<br>test 6: " + (result === "2000"));
///           callback();
///         });
///       },
///       function test7(callback) {
///         $("#tests").append("<br>test 7: " + (AlreadyDeployedToken._address === "0xeCE374063fE5Cc7EFbACA0a498477CaDA94E5AD6"));
///         callback();
///       }
///     ], function (err, result) {
///       $("#tests").append("<br>done");
///     });
///
///   };
///
/// });
///
///
