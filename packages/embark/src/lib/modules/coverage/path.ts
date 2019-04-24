import * as path from "path";

const fs = require("embark-fs");

export const coverageContractsPath = () => path.join("coverage", "instrumentedContracts");
