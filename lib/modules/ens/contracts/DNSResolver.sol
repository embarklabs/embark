pragma solidity ^0.4.18;

contract DNSResolver {
    address public owner;
    mapping (bytes32 => bytes) zones;

    modifier owner_only {
        require(msg.sender == owner);
        _;
    }
    
    function DNSResolver() public {
        owner = msg.sender;
    }

    function setDnsrr(bytes32 node, bytes data) public owner_only {
        zones[node] = data;
    }

    function dnsrr(bytes32 node) public view returns (bytes) {
        return zones[node];
    }

    function supportsInterface(bytes4 interfaceID) public pure returns (bool) {
        return interfaceID == 0x126a710e;
    }
}
