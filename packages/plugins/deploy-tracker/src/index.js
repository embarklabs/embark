import DeploymentChecks from "./deploymentChecks";
import TrackingFunctions from "./trackingFunctions";

class DeployTracker {

  constructor(embark, {trackContracts, plugins}) {
    const {logger, events, fs, config} = embark;
    this.embark = embark;

    const trackingFunctions = new TrackingFunctions({config, fs, logger, events, trackContracts});
    const deploymentChecks = new DeploymentChecks({trackingFunctions, logger, events, plugins, contractsConfig: config.contractsConfig});

    this.embark.registerActionForEvent("deployment:contract:deployed", trackingFunctions.trackAndSaveContract.bind(trackingFunctions));
    this.embark.registerActionForEvent("deployment:contract:shouldDeploy", deploymentChecks.checkContractConfig.bind(deploymentChecks));
    this.embark.registerActionForEvent("deployment:contract:shouldDeploy", deploymentChecks.checkIfAlreadyDeployed.bind(deploymentChecks));
  }
}

module.exports = DeployTracker;
