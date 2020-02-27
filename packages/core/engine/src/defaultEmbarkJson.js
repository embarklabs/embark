module.exports = {
  contracts: ["contracts/**"],
  app: {},
  buildDir: "dist/",
  config: "config/",
  versions: {
    solc: "0.6.1"
  },
  plugins: {
  },
  options: {
    solc: {
      "optimize": true,
      "optimize-runs": 200
    }
  },
  generationDir: "embarkArtifacts"
};
