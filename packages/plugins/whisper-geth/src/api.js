import EmbarkJS from "embarkjs";
import EmbarkJSWhisper from "embarkjs-whisper";

class API {

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
      (req, res) => {
        EmbarkJS.Messages.sendMessage({ topic: req.body.topic, data: req.body.message }, (err, result) => {
          if (err) {
            return res.status(500).send({ error: err });
          }
          res.send(result);
        });
      });
  }

  async registerListenToCall() {
    this.embark.registerAPICall(
      "ws",
      "/embark-api/communication/listenTo/:topic",
      (ws, req) => {
        EmbarkJS.Messages.listenTo({ topic: req.params.topic }).subscribe(data => {
          ws.send(JSON.stringify(data));
        });
      });
  }

}

module.exports = API;
