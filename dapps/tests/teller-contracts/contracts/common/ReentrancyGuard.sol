pragma solidity >=0.5.0 <0.6.0;


contract ReentrancyGuard {

    bool public locked = false;

    /**
     * @dev Use this modifier on functions susceptible to reentrancy attacks
     */
    modifier reentrancyGuard() {
        require(!locked, "Reentrant call detected!");
        locked = true;
        _;
        locked = false;
    }
}
