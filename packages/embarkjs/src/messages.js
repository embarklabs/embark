let Messages = {};

Messages.Providers = {};

Messages.registerProvider = function (providerName, obj) {
  this.Providers[providerName] = obj;
};

Messages.setProvider = function (providerName, options) {
  let provider = this.Providers[providerName];

  if (!provider) {
    throw new Error('Unknown messages provider');
  }

  this.currentProviderName = providerName;
  this.currentMessages = provider;

  return provider.setProvider(options);
};

Messages.isAvailable = function () {
  if (!this.currentMessages) {
    return false;
  }
  return this.currentMessages.isAvailable();
};

Messages.sendMessage = function (options) {
  if (!this.currentMessages) {
    throw new Error('Messages provider not set; e.g EmbarkJS.Messages.setProvider("whisper")');
  }
  return this.currentMessages.sendMessage(options);
};

Messages.listenTo = function (options, callback) {
  if (!this.currentMessages) {
    throw new Error('Messages provider not set; e.g EmbarkJS.Messages.setProvider("whisper")');
  }
  return this.currentMessages.listenTo(options, callback);
};

export default Messages;
