// const Logger = require('embark-logger');
const uuid = require('uuid');
const fs = require('fs-extra');
import stringify from "json-stringify-safe";

function jsonFunctionReplacer(_key, value) {
  if (typeof value === 'function') {
    return value.toString();
  }
  return value;
}

// var DB = {
// }

// class SuperLog extends Logger {
class SuperLog {

  constructor(processIdentifier) {
    this.logfile = "./structlog-" + (processIdentifier || "log") + ".json";
  }

  // TODO: make this a flag depending on ENV var or constructor
  isEnabled() {
    //return process && process.env && process.env.DEBUGLOGS;
    return true;
  }

  addRecord(data) {
    // DB[data.id] = data
    fs.appendFileSync(this.logfile, "\n" + stringify(data, jsonFunctionReplacer, 0));
  }

  // findRecord(id) {
  //   return DB[id];
  // }

  updateRecord(id, data) {
    // DB[id] = { ...DB[id], ...data }
    fs.appendFileSync(this.logfile, "\n" + stringify(data, jsonFunctionReplacer, 0));
  }

  startSession() {
    if (!this.isEnabled()) return;
    this.session = uuid.v4();

    this.modules = {}

    this.addRecord({
      session: this.session,
      id: this.session,
      timestamp: Date.now(),
      value: "new_session",
      type: "new_session",
      name: "new_session"
    })
  }

  moduleInit(name) {
    if (!this.isEnabled()) return;
    let id = uuid.v4();

    this.addRecord({
      session: this.session,
      id: id,
      timestamp: Date.now(),
      parent_id: this.session,
      type: 'module_init',
      value: name,
      name: name,
      stack: this.getStackTrace()
    })

    this.modules[name] = id

    return id;
  }

  getStackTrace() {
    if (!this.isEnabled()) return;
    return (new Error().stack).split('\n');
  }

  log(values) {
    if (!this.isEnabled()) return;

    if (values.id) {
      this.updateRecord(values.id, values)
      return values.id;
    }

    let id = uuid.v4();

    if (values.module) {
      values.parent_id = this.modules[values.module] || this.session
    } else if (!values.parent_id) {
      values.parent_id = this.session
    }

    if (!values.stack) {
      values.stack = this.getStackTrace();
    }

    this.addRecord({
      session: this.session,
      timestamp: Date.now(),
      id: id,
      ...values
    }, this.db)

    return id;
  }

  info() {
    if (!this.isEnabled()) return;
    let id = uuid.v4();
    this.log({
      session: this.session,
      timestamp: Date.now(),
      parent_id: this.session,
      id: id,
      type: "log_info",
      name: "info: " + arguments[0]
    })
    // super.info(...arguments);
  }

}

module.exports = SuperLog;
