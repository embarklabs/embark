class CoreProcess {
  constructor(embark) {
    this.embark = embark;
    this.events = embark.events;

    this.registerProcess();
  }

  // Register 'embark' as a process
  registerProcess() {
    this.events.request('processes:register', 'embark', (setRunning) => {
      // on 'outputDone', set 'embark' process to 'running'
      this.events.on('outputDone', setRunning);
    });
    // set 'embark' process to 'starting'
    this.events.request('processes:launch', 'embark', () => {});
  }
}

module.exports = CoreProcess;
