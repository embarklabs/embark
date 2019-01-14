import * as path from "path";

const fs = require("../../core/fs");

export const coverageContractsPath = () => path.join("coverage", "instrumentedContracts");
