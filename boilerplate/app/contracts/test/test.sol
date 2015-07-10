contract Test {
    // easy/reliable way to detect if its a test from the abi
    function IS_TEST() returns (bool) { return true; }

    event log_bytes32(bytes32 key, bytes32 val);
    event log_uint(bytes32 key, uint val);
    event log_addr(bytes32 key, address val);

    /* These are events to watch for to detect failure
     */
    event fail();
    event err_bytes32(bytes32 key, bytes32 val);
    event err_uint(bytes32 key, uint val);
    event err_addr(bytes32 key, address val);

    function assert(bool what, bytes32 key, bytes32 value) {
        err_bytes32(!what, desc);
    }
    function assert(bool what, bytes32 key, uint value) {
        err_bytes32(!what, desc);
    }
    function assert(bool what, bytes32 key, addr value) {
        err_uint(!what, desc);
    }

    address[4096] public debug_targets;
    uint public target_count;
    function watch(address d) {
        debug_targets[target_count] = d;
        target_count++;
    }
    address public debug_target;
    function watch(address d) {
        debug_target = d;
    }
}
