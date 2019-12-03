import EmbarkJS from "embarkjs";
import EmbarkJSWhisper from "embarkjs-whisper";

export const PARITY_WHISPER_ERROR = "Parity's implementation of Whisper is not compatible with Whisper v6 (and therefore web3.js). Try changing the communication config to use '{client: \"geth\"}' instead.";

export class Api {

  constructor(embark) {
    this.embark = embark;
    this.communicationConfig = embark.config.communicationConfig;
  }

  async initEmbarkJSWhisper() {
    if (Object.keys(EmbarkJS.Messages.Providers).includes("whisper")) return;

    EmbarkJS.Messages.registerProvider("whisper", EmbarkJSWhisper);
    EmbarkJS.Messages.setProvider("whisper", this.communicationConfig.connection);
  }

  async registerAPICalls() {
    this.initEmbarkJSWhisper();
    this.registerSendMessageCall();
    this.registerListenToCall();
  }

  async registerSendMessageCall() {
    this.embark.registerAPICall(
      "post",
      "/embark-api/communication/sendMessage",
      (_req, res) => {
        res.status(500).send({ error: PARITY_WHISPER_ERROR });
      });
  }

  async registerListenToCall() {
    this.embark.registerAPICall(
      "ws",
      "/embark-api/communication/listenTo/:topic",
      (ws, _req) => {
        ws.send(JSON.stringify({ error: PARITY_WHISPER_ERROR }));
      });
  }
}
