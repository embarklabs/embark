const Logger = require('embark-logger');
const uuid = require('uuid');
const fs = require('fs-extra');
import stringify from "json-stringify-safe";

function jsonFunctionReplacer(_key, value) {
  if (typeof value === 'function') {
    return value.toString();
  }
  return value;
}

var DB = {
}

const LOGFILE = "./log.json"

function addRecord(data) {
  DB[data.id] = data
  fs.appendFileSync(LOGFILE, "\n" + stringify(data, jsonFunctionReplacer, 0));
}

function findRecord(id) {
  return DB[id];
}

function updateRecord(id, data) {
  DB[id] = {...DB[id], ...data}
  fs.appendFileSync(LOGFILE, "\n" + stringify(data, jsonFunctionReplacer, 0));
}

class SuperLog extends Logger {

  startSession() {
    this.session = uuid.v4();

    this.modules = {}

    addRecord({
      session: this.session,
      id: this.session,
      timestamp: Date.now(),
      value: "new_session",
      type: "new_session",
      name: "new_session"
    })
  }

  moduleInit(name) {
    let id = uuid.v4();

    addRecord({
      session: this.session,
      id: id,
      timestamp: Date.now(),
      parent_id: this.session,
      type: 'module_init',
      value: name,
      name: name
    })

    this.modules[name] = id

    return id;
  }

  log(values) {
    if (values.id) {
      updateRecord(values.id, values)
      return values.id;
    }

    let id = uuid.v4();

    if (values.module) {
      values.parent_id = this.modules[values.module] || this.session
    } else if (!values.parent_id) {
      values.parent_id = this.session
    }

    addRecord({
      session: this.session,
      timestamp: Date.now(),
      id: id,
      ...values
    }, this.db)

    return id;
  }

  info() {
    let id = uuid.v4();
    this.log({
      session: this.session,
      timestamp: Date.now(),
      parent_id: this.session,
      id: id,
      type: "log_info",
      name: "info: " + arguments[0]
    })
    super.info(...arguments);
  }

}

module.exports = SuperLog;

