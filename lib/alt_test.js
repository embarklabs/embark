module.exports = (function(web3) {
    // 1 get all files that end with "_test.sol"
    // 2 get all contracts that inherit from Test - these have the
    //   IS_TEST function in its abi. Another option for the convention
    //   is contracts ending in "Test".
    // 3 deploy an instance for each function that starts with "test"
    // 4 watch for events "fail" and "err_*" on all instances
    // 5 for each instance, call its particular test* function

})
