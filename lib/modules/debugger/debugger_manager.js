var RemixDebug = require('remix-debug-debugtest');
var CmdLine = RemixDebug.CmdLine;
const async = require('async');

class DebuggerManager {

  constructor(nodeUrl) {
    this.nodeUrl = nodeUrl
    this.outputJson = {}
    this.inputJson = {}
  }

  setInputJson(inputJson) {
    this.inputJson = inputJson
  }

  setOutputJson(outputJson) {
    this.outputJson = outputJson
  }

  createDebuggerSession(txHash, filename, cb) {
    return this.debug(txHash, filename, cb)
  }

  debug(txHash, filename, cb) {
    console.dir("debugging tx " + txHash)

    var cmd_line = new CmdLine()
    this.cmd_line = cmd_line
    cmd_line.connect("http", this.nodeUrl)
    cmd_line.loadCompilationData(this.inputJson, this.outputJson)

    cmd_line.initDebugger(() => {
      this.isDebugging = true

      cmd_line.startDebug(txHash, filename, () => {
        if (cb) {
          cmd_line.triggerSourceUpdate()
          cb()
        }
      })
    })
    return cmd_line
  }

  getLastLine(txHash, filename, outputCb) {
    const self = this;
    let cmd_line = new CmdLine()

    async.waterfall([
      function initDebugger(next) {
        cmd_line = new CmdLine()
        cmd_line.connect("http", self.nodeUrl)
        cmd_line.loadCompilationData(self.inputJson, self.outputJson)
        cmd_line.initDebugger(() => {
          // self.isDebugging = true
          next()
        })
      },
      function startDebug(next) {
        cmd_line.startDebug(txHash, filename, () => {
          cmd_line.events.on("source", () => {
            outputCb(cmd_line.getSource())
          })

          let total_size = cmd_line.getTraceLength()
          cmd_line.jumpTo(total_size - 1)
          cmd_line.unload()

          next()
        })
      }
    ], () => {
    })
  }
}

module.exports = DebuggerManager;
