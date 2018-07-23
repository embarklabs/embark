pragma solidity ^0.4.18;

import './ENS.sol';
import './Resolver.sol';

/**
 * A registrar that allocates subdomains to the first person to claim them.
 */
contract FIFSRegistrar {
    ENS ens;
    bytes32 rootNode;
    Resolver resolver;

    modifier only_owner(bytes32 subnode) {
        bytes32 node = sha3(rootNode, subnode);
        address currentOwner = ens.owner(node);
        require(currentOwner == 0 || currentOwner == msg.sender);
        _;
    }

    /**
     * Constructor.
     * @param ensAddr The address of the ENS registry.
     * @param node The node that this registrar administers.
     */
    function FIFSRegistrar(ENS ensAddr, bytes32 node, Resolver resolverAddr) public {
        ens = ensAddr;
        rootNode = node;
        resolver = resolverAddr;
    }

    /**
     * Register a name, or change the owner of an existing registration.
     * @param subnode The hash of the label to register.
     * @param owner The address of the new owner.
     */
    function register(bytes32 subnode, address owner, address nodeAddress) public only_owner(subnode) {
        bytes32 subdomainHash = sha3(rootNode, subnode);
        ens.setSubnodeOwner(rootNode, subnode, owner);
        ens.setResolver(subdomainHash, resolver); //default resolver
        bool resolveAccount = nodeAddress != address(0);
        if (resolveAccount) {
            resolver.setAddr(subdomainHash, nodeAddress);
        }
    }
}
