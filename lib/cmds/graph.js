const fs = require("fs");
const klaw = require('klaw');
const path = require('path');
const SolidityParser = require("solidity-parser");
const Viz = require('viz.js');

class GraphGenerator {
    constructor(config) {
        this.config = config;
    }

    generate() {
        console.log("TODO");
    }
}

module.exports = GraphGenerator;
