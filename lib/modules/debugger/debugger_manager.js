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
		    let debuggerData = {}
				cmd_line.events.on("locals", (data) => {
					debuggerData.locals = self.simplifyDebuggerVars(data)
				});

				cmd_line.events.on("globals", (data) => {
					debuggerData.contract = self.simplifyDebuggerVars(data)
				})

        cmd_line.startDebug(txHash, filename, () => {
          cmd_line.events.on("source", () => {
						let lines = cmd_line.getSource()
						// TODO: this is a bit of a hack
						let line = lines.filter((x) => x.indexOf("=>") === 0)[0];
            outputCb(lines, line, debuggerData)
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

	// TODO: this is duplicated in debugger/index.js
	simplifyDebuggerVars(data) {
		let new_data = {};

		for (let key in data) {
			let field = data[key];
			new_data[`${key} (${field.type})`] = field.value
		}

		return new_data
	}

}

module.exports = DebuggerManager;
