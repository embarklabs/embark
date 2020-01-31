const { __ } = require('embark-i18n');

class VMClient {

  constructor(embark, _options) {
    this.embark = embark;
    this.events = embark.events;
    this.config = embark.config;

    this.vms = [];
    this.events.setCommandHandler("blockchain:vm:register", (name, handler) => {
      this.vms.push({name, handler: handler()});
    });

    this.events.setCommandHandler("blockchain:client:vmProvider", async (vmName, cb) => {
      if (typeof vmName === 'function') {
        cb = vmName;
        vmName = '';
      }
      if (!this.vms.length) {
        return cb(`Failed to get the VM provider. Please register one using 'blockchain:vm:register', or by ensuring the 'embark-ganache' package is registered.`);
      }
      if (vmName) {
        const vm = this.getVmClient(vmName);
        if (!vm) {
          return cb(__("No VM of name %s registered. Please register it using using 'blockchain:vm:register'", vmName));
        }
        return cb(null, vm.handler);
      }
      return cb(null, this.vms[this.vms.length - 1].handler);
    });
  }

  getVmClient(vmName) {
    return this.vms.find(vm => vm.name === vmName);
  }
}

module.exports = VMClient;
