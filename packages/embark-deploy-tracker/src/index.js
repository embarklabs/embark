import DeploymentChecks from "./deploymentChecks";
import TrackingFunctions from "./trackingFunctions";

class DeployTracker {

  constructor(embark, {trackContracts, env, plugins}) {
    const {logger, events, fs, config} = embark;
    this.embark = embark;

    // TODO: unclear where env comes from
    // TODO: we should be getting the env from a request to the config

    const trackingFunctions = new TrackingFunctions({config, fs, logger, events, env, trackContracts});
    const deploymentChecks = new DeploymentChecks({trackingFunctions, logger, events, plugins});

    this.embark.events.on("blockchain:started", trackingFunctions.ensureChainTrackerFile.bind(trackingFunctions));
    this.embark.registerActionForEvent("deployment:contract:deployed", trackingFunctions.trackAndSaveContract.bind(trackingFunctions));
    this.embark.registerActionForEvent("deployment:contract:shouldDeploy", deploymentChecks.checkContractConfig.bind(deploymentChecks));
    this.embark.registerActionForEvent("deployment:contract:shouldDeploy", deploymentChecks.checkIfAlreadyDeployed.bind(deploymentChecks));
  }
}

module.exports = DeployTracker;
