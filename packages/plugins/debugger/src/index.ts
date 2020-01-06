import 'colors';
import { __ } from 'embark-i18n';
import DebuggerManager from './debugger_manager';

const NO_DEBUG_SESSION = __('No debug session active. Activate one with `debug`');

interface Events {
  on: any;
  request: any;
  request2: any;
}

interface EmbarkApi {
  events: Events;
  registerAPICall: any;
  registerConsoleCommand: any;
  logger: any;
}

export default class TransactionDebugger {
  private embark: EmbarkApi;
  private lastTx: string;
  private debuggerManager: any;
  private txTracker: any;
  private isDebugging: boolean;
  private currentCmdTxHash: string;
  private apiDebugger: any;
  private cmdDebugger: any;
  private debuggerData: any;

  constructor(embark: EmbarkApi, options?: any) {
    this.embark = embark;

    this.debuggerManager = new DebuggerManager('http://localhost:8545');
    embark.events.on('contracts:compile:solc', this.debuggerManager.setInputJson.bind(this.debuggerManager));
    embark.events.on('contracts:compiled:solc', this.debuggerManager.setOutputJson.bind(this.debuggerManager));

    this.txTracker = {};
    this.lastTx = '';

    this.isDebugging = false;
    this.currentCmdTxHash = '';
    this.listenToEvents();
    this.listenToCommands();
    this.listentoAPI();
  }

  private listenToEvents() {
    this.embark.events.on('blockchain:tx', (tx: any) => {
      this.embark.events.request('contracts:contract', tx.name, (contract: any) => {
        if (!(contract && contract.filename)) { return; }
        this.txTracker[tx.transactionHash] = {tx, contract};
        this.lastTx = tx.transactionHash;
        if (tx.status !== '0x0') { return; }

        this.embark.logger.info('Transaction failed');

        this.debuggerManager.getLastLine(tx.transactionHash, contract.filename, (lines: string[], line: string, knownVars: any) => {
          lines.forEach((errorLine: string) => {
            this.embark.logger.error(errorLine);
          });
          this.findVarsInLine(tx.transactionHash, line, knownVars, (foundVars: any) => {
            if (!foundVars) { return; }
            this.embark.logger.info('vars:');
            foundVars.forEach((variable: any) => {
              this.embark.logger.info(`${variable.name}: ${variable.value}`);
            });
            this.embark.logger.info(`type "debug" to start debugging the last failing tx`);
          });
        });
      });
    });
  }

  private findVarsInLine(txHash: string, line: string, knownVars: any, cb: any) {
    const foundVars: any = [];
    this.getGlobals(txHash, (err: any, globals: any) => {
      if (err) { return cb([]); }
      for (const variable of Object.keys(globals || {})) {
        const value: any = globals[variable];
        if (line && line.indexOf(variable) >= 0) {
          foundVars.push({name: variable, value});
        }
      }

      for (const variable of Object.keys(knownVars.locals || {})) {
        const value: any = knownVars.locals[variable];
        const variableName: string = variable.split(' ')[0];
        if (line && line.indexOf(variableName) >= 0) {
          foundVars.push({name: variable, value});
        }
      }

      for (const variable of Object.keys(knownVars.contract || {})) {
        const value: any = knownVars.contract[variable];
        const variableName: string = variable.split(' ')[0];
        if (line && line.indexOf(variableName) >= 0) {
          foundVars.push({name: variable, value});
        }
      }

      cb(foundVars);
    });
  }

  private listentoAPI() {
    this.debuggerData = {};
    this.apiDebugger = false;

    this.embark.registerAPICall('post', '/embark-api/debugger/start', (req: any, res: any) => {
      const txHash: string = req.body.params.txHash;

      this.embark.events.request('contracts:contract:byTxHash', txHash, (err: any, contract: any) => {
        if (err) {
          this.embark.logger.error(err);
          return res.send({error: err});
        }

        const filename: string = contract.filename;

        this.apiDebugger = this.debuggerManager.createDebuggerSession(txHash, filename, () => {
          this.getGlobals(txHash, (errGlobals: any, globals: any) => {
            if (errGlobals) { return res.send({ok: false}); }
            this.debuggerData.globals = globals;
            this.debuggerData.possibleSteps = {
              canGoNext: this.apiDebugger.canGoNext(),
              canGoPrevious: this.apiDebugger.canGoPrevious(),
            };
            // TODO: currently still needed due to a bug with the debugger
            setTimeout(() => {
              this.apiDebugger.stepOverForward(true);
              this.apiDebugger.stepOverBack(true);
            }, 1000);
            res.send({ok: true});
          });
        });
      });
    });

    this.embark.registerAPICall('post', '/embark-api/debugger/stop', (req: any, res: any) => {
      this.apiDebugger.unload();
      this.apiDebugger.events.emit('stop');
      this.apiDebugger = false;
      res.send({ok: true});
    });

    this.embark.registerAPICall('post', '/embark-api/debugger/JumpBack', (req: any, res: any) => {
      this.apiDebugger.stepJumpNextBreakpoint();
      res.send({ok: true});
    });
    this.embark.registerAPICall('post', '/embark-api/debugger/JumpForward', (req: any, res: any) => {
      this.apiDebugger.stepJumpPreviousBreakpoint();
      res.send({ok: true});
    });
    this.embark.registerAPICall('post', '/embark-api/debugger/StepOverForward', (req: any, res: any) => {
      if (this.apiDebugger.canGoNext()) {
        this.apiDebugger.stepOverForward(true);
      }
      res.send({ok: true});
    });
    this.embark.registerAPICall('post', '/embark-api/debugger/StepOverBackward', (req: any, res: any) => {
      if (this.apiDebugger.canGoPrevious()) {
        this.apiDebugger.stepOverBack(true);
      }
      res.send({ok: true});
    });
    this.embark.registerAPICall('post', '/embark-api/debugger/StepIntoForward', (req: any, res: any) => {
      if (this.apiDebugger.canGoNext()) {
        this.apiDebugger.stepIntoForward(true);
      }
      res.send({ok: true});
    });
    this.embark.registerAPICall('post', '/embark-api/debugger/StepIntoBackward', (req: any, res: any) => {
      if (this.apiDebugger.canGoPrevious()) {
        this.apiDebugger.stepIntoBack(true);
      }
      res.send({ok: true});
    });
    this.embark.registerAPICall('post', '/embark-api/debugger/breakpoint', (req: any, res: any) => {
      res.send({ok: true});
    });

    this.embark.registerAPICall('ws', '/embark-api/debugger', (ws: any, req: any) => {
      if (!this.apiDebugger) { return; }

      this.apiDebugger.events.on('stop', () => { ws.close(1000); });

      this.apiDebugger.events.on('source', (lineColumnPos: any, rawLocation: any) => {
        this.debuggerData.sources = {lineColumnPos, rawLocation};
        this.debuggerData.possibleSteps = {
          canGoNext: this.apiDebugger.canGoNext(),
          canGoPrevious: this.apiDebugger.canGoPrevious(),
        };
        ws.send(JSON.stringify(this.debuggerData), () => {});
      });

      this.apiDebugger.events.on('locals', (data: any) => {
        this.debuggerData.locals = this.simplifyDebuggerVars(data);
        this.debuggerData.possibleSteps = {
          canGoNext: this.apiDebugger.canGoNext(),
          canGoPrevious: this.apiDebugger.canGoPrevious(),
        };
        ws.send(JSON.stringify(this.debuggerData), () => {});
      });

      this.apiDebugger.events.on('globals', (data: any) => {
        this.debuggerData.contract = this.simplifyDebuggerVars(data);
        this.debuggerData.possibleSteps = {
          canGoNext: this.apiDebugger.canGoNext(),
          canGoPrevious: this.apiDebugger.canGoPrevious(),
        };
        ws.send(JSON.stringify(this.debuggerData), () => {});
      });

    });
  }

  private simplifyDebuggerVars(data: any) {
    const newData: any = {};

    Object.keys(data).forEach((key) => {
      const field = data[key];
      newData[`${key} (${field.type})`] = field.value;
    });

    return newData;
  }

  private listenToCommands() {
    this.cmdDebugger = false;
    this.currentCmdTxHash = '';

    const self = this;
    function startDebug(txHash: string, filename: string, callback: (err?: string|object, output?: string) => void) {
      self.currentCmdTxHash = txHash;
      self.embark.logger.info('debugging tx ' + txHash);
      self.cmdDebugger = self.debuggerManager.createDebuggerSession(txHash, filename, () => {
        self.displayStepInfo(callback);
      });
    }

    this.embark.registerConsoleCommand({
      description: __('Start a debugging session using, the last transaction or the transaction specified by hash'),
      matches: (cmd: string) => {
        const [cmdName] = cmd.split(' ');
        return cmdName === 'debug';
      },
      process: (cmd: string, callback: (err?: string|object, output?: string) => void) => {
        const [_cmdName, txHash] = cmd.split(' ');
        if (txHash) {
          this.embark.events.request('contracts:contract:byTxHash', txHash, (err: any, contract: any) => {
            if (err) {
              this.embark.logger.error(err);
              return callback();
            }
            this.currentCmdTxHash = txHash;
            startDebug(txHash, contract.filename, callback);
          });
          return;
        }
        if (this.lastTx === '') {
          return callback(undefined, __('No transaction to debug'));
        }
        this.currentCmdTxHash = this.lastTx;
        const filename: string = this.txTracker[this.lastTx].contract.filename;
        startDebug(this.lastTx, filename, callback);
      },
      usage: 'debug [txHash]',
    });

    this.embark.registerConsoleCommand({
      description: __('Stops the active debugging session.'),
      matches: ['sd', 'stop debugger'],
      process: (cmd: string, callback: (err?: string|object, output?: string) => void) => {
        if (!this.cmdDebugger) {
          this.embark.logger.warn(NO_DEBUG_SESSION);
          return callback();
        }
        this.cmdDebugger.unload();
        this.cmdDebugger = null;
        callback(undefined, __('The debug session has been stopped'));
      },
      usage: '    stop debugger/sd',
    });

    this.embark.registerConsoleCommand({
      description: __('Step over forward on the current debugging session'),
      matches: ['next', 'n'],
      process: (cmd: string, callback: (err?: string|object, output?: string) => void) => {
        if (!this.cmdDebugger) {
          this.embark.logger.warn(NO_DEBUG_SESSION);
          return callback();
        }
        if (!this.cmdDebugger.canGoNext()) {
          return callback();
        }
        if (!this.cmdDebugger.currentStep()) {
          this.embark.logger.info('end of execution reached');
          this.cmdDebugger.unload();
          return callback();
        }
        this.cmdDebugger.stepOverForward(true);
        this.displayStepInfo(callback);
      },
      usage: '    next/n',
    });

    this.embark.registerConsoleCommand({
      description: __('Step over back on the current debugging session'),
      matches: ['previous', 'p'],
      process: (cmd: string, callback: (err?: string|object, output?: string) => void) => {
        if (!this.cmdDebugger) {
          this.embark.logger.warn(NO_DEBUG_SESSION);
          return callback();
        }
        if (!this.cmdDebugger.canGoPrevious()) {
          return callback();
        }
        if (!this.cmdDebugger.currentStep()) {
          this.embark.logger.info('end of execution reached');
          return this.cmdDebugger.unload();
        }
        this.cmdDebugger.stepOverBack(true);
        this.displayStepInfo(callback);
      },
      usage: '    previous/p',
    });

    this.embark.registerConsoleCommand({
      description: __('Display local variables of the current debugging session'),
      matches: ['var local', 'v l', 'vl'],
      process: (cmd: string, callback: (err?: string|object, output?: string) => void) => {
        if (!this.cmdDebugger) {
          this.embark.logger.warn(NO_DEBUG_SESSION);
          return callback();
        }
        this.embark.logger.info('Locals:');
        const debugVars = this.simplifyDebuggerVars(this.cmdDebugger.solidityLocals);
        for (const debugVar of Object.keys(debugVars)) {
          this.embark.logger.info(`${debugVar}: ` + `${debugVars[debugVar]}`.white);
        }
        callback();
      },
      usage: '    var local/v l/vl',
    });

    this.embark.registerConsoleCommand({
      description: __('Display global variables of the current debugging session'),
      matches: ['var global', 'v g', 'vg'],
      process: (cmd: string, callback: (err?: string|object, output?: string) => void) => {
        if (!this.cmdDebugger) {
          this.embark.logger.warn(NO_DEBUG_SESSION);
          return callback();
        }
        this.embark.logger.info('Globals:');
        const debugVars = this.simplifyDebuggerVars(this.cmdDebugger.solidityState);
        for (const debugVar of Object.keys(debugVars)) {
          this.embark.logger.info(`${debugVar}: ` + `${debugVars[debugVar]}`.white);
        }
        callback();
      },
      usage: '    var global/v g/vg',
    });

    this.embark.registerConsoleCommand({
      description: __('Display solidity global variables of the current debugging session'),
      matches: ['var all', 'v a', 'va'],
      process: (cmd: string, callback: (err?: string|object, output?: string) => void) => {
        if (!this.cmdDebugger) {
          this.embark.logger.warn(NO_DEBUG_SESSION);
          return callback();
        }
        this.getGlobals(this.currentCmdTxHash, (err: any, globals: any) => {
          if (err) {
            this.embark.logger.error(err);
            return callback();
          }
          this.embark.logger.info('Solidity Global Variables:');
          for (const debugVar of Object.keys(globals)) {
            this.embark.logger.info(`${debugVar}: ` + `${globals[debugVar]}`.white);
          }
          callback();
        });
      },
      usage: '    var all/v a/va',
    });
  }

  private getGlobals(txHash: string, cb: any) {
    const globals: any = {};
    this.embark.events.request('blockchain:getTransaction', txHash, (err: any, tx: any) => {
      if (err) { return cb(err); }

      this.embark.events.request('blockchain:block:byHash', tx.blockHash, (errHash: any, block: any) => {
        if (errHash) { return cb(errHash); }

        /* tslint:disable:no-string-literal */
        globals['block.blockHash'] = tx.blockHash;
        globals['block.number'] = tx.blockNumber;
        globals['block.coinbase'] = block.miner;
        globals['block.difficulty'] = block.difficulty;
        globals['block.gaslimit'] = block.gasLimit;
        globals['block.timestamp'] = block.timestamp;
        globals['msg.sender'] = tx.from;
        globals['msg.gas'] = tx.gas;
        globals['msg.gasPrice'] = tx.gasPrice;
        globals['msg.value'] = tx.value;
        globals['now'] = block.timestamp;
        /* tslint:enable:no-string-literal */

        cb(null, globals);
      });
    });
  }

  private displayPossibleActions() {
    const actions: string[] = [];
    actions.push('actions: ');

    if (this.cmdDebugger.canGoPrevious()) {
      actions.push('(p)revious');
    }
    if (this.cmdDebugger.canGoNext()) {
      actions.push('(n)ext');
    }

    actions.push('(vl) var local');
    actions.push('(vg) var global');
    actions.push('(va) var all');
    actions.push('(sd) stop debugger');

    if (actions.length === 1) { return; }

    this.embark.logger.info('');
    this.embark.logger.info(actions.join(' | '));
  }

  private displayVarsInLine(cb?: any) {
    const txHash: string = this.cmdDebugger.txHash;
    const line: string = this.cmdDebugger.getCurrentLine();
    const knownVars: any = this.cmdDebugger.getVars();

    if (knownVars.locals) {
      knownVars.locals = this.simplifyDebuggerVars(knownVars.locals);
    }
    if (knownVars.contract) {
      knownVars.contract = this.simplifyDebuggerVars(knownVars.contract);
    }

    this.findVarsInLine(txHash, line, knownVars, (foundVars: any) => {
      if (!foundVars) {
        return cb ? cb() : null;
      }
      this.embark.logger.info('vars:');
      foundVars.forEach((variable: any) => {
        this.embark.logger.info(`${variable.name}: ` + `${variable.value}`.white);
      });
      if (cb) { cb(); }
    });
  }

  private displayStepInfo(cb?: any) {
    this.cmdDebugger.getSource().forEach((line: string) => {
      this.embark.logger.info(line);
    });
    this.displayVarsInLine(() => {
      this.displayPossibleActions();
      if (cb) { cb(); }
    });
  }
}
