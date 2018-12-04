import * as path from "path";
import parser, { Location } from "solidity-parser-antlr";
import { EventLog } from "web3/types";

import { decrypt } from "./eventId";
import { Injector } from "./injector";
import { Instrumenter } from "./instrumenter";
import { InstrumentWalker } from "./instrumentWalker";
import { coverageContractsPath } from "./path";
import { Suppressor } from "./suppressor";
import { BranchType, Coverage } from "./types";

const fs = require("../../core/fs");

enum EventEnum {
  statement = "__StatementCoverage",
  branch = "__BranchCoverage",
  function = "__FunctionCoverage",
}

let id = 0;
function nextId() {
  id++;
  return id;
}

export class ContractEnhanced {
  public id: number;
  public coverage: Coverage;
  public originalSource: string;
  public source: string;
  private ast: parser.ASTNode;
  private coverageFilepath: string;

  constructor(public filepath: string) {
    this.id = nextId();
    this.source = fs.readFileSync(filepath, "utf-8");
    this.originalSource = this.source;

    this.coverageFilepath = path.join(coverageContractsPath(), this.filepath);

    this.coverage = {
      b: {},
      branchMap: {},
      code: this.originalSource,
      f: {},
      fnMap: {},
      l: {},
      path: filepath,
      s: {},
      statementMap: {},
    };
    this.ast = parser.parse(this.source, {loc: true, range: true});
  }

  public instrument() {
    new Suppressor(this).process();
    const instrumenter = new Instrumenter(this);
    const instrumentWalker = new InstrumentWalker(instrumenter);
    instrumentWalker.walk(this.ast);

    const injector = new Injector(this);
    instrumenter.getInjectionPoints().forEach(injector.process.bind(injector));
  }

  public save() {
    fs.ensureFileSync(this.coverageFilepath);
    fs.writeFileSync(this.coverageFilepath, this.source);
  }

  public updateCoverage(events: EventLog[]) {
    events.filter(this.filterCoverageEvent).forEach((event) => {
      const value = parseInt(event.returnValues[0], 10);
      const {contractId, injectionPointId, locationIdx} = decrypt(value);

      if (contractId !== this.id) {
        return;
      }

      switch (event.event) {
        case "__StatementCoverage": {
          this.coverage.s[injectionPointId] += 1;
          const statement = this.coverage.statementMap[injectionPointId];
          this.coverage.l[statement.start.line] += 1;
          break;
        }
        case "__FunctionCoverage": {
          this.coverage.f[injectionPointId] += 1;
          const fn = this.coverage.fnMap[injectionPointId];
          this.coverage.l[fn.line] += 1;
          break;
        }
        case "__BranchCoverage": {
          this.coverage.b[injectionPointId][locationIdx] += 1;
          break;
        }
      }
    });
  }

  public addStatement(location: Location) {
    const coverageId = this.getNewCoverageId(this.coverage.statementMap);
    this.coverage.statementMap[coverageId] = location;
    this.coverage.s[coverageId] = 0;
    this.coverage.l[location.start.line] = 0;
    return coverageId;
  }

  public addBranch(line: number, type: BranchType, locations: Location[]) {
    const coverageId = this.getNewCoverageId(this.coverage.branchMap);
    this.coverage.branchMap[coverageId] = {
      line,
      locations,
      type,
    };
    this.coverage.b[coverageId] = locations.map(() => 0);
    this.coverage.l[line] = 0;
    return coverageId;
  }

  public addFunction(location: Location, name: string) {
    const coverageId = this.getNewCoverageId(this.coverage.fnMap);
    const line = location.start.line;
    this.coverage.fnMap[coverageId] = {
      line,
      loc: location,
      name,
    };
    this.coverage.f[coverageId] = 0;
    this.coverage.l[line] = 0;
    return coverageId;
  }

  private getNewCoverageId(object: {[key: string]: any}) {
    const lastId = Object.keys(object).map(Number).sort((a, b) => b - a)[0] || 0;
    return lastId + 1;
  }

  private filterCoverageEvent(event: EventLog) {
    return [EventEnum.function, EventEnum.branch, EventEnum.statement].includes(event.event as EventEnum);
  }

}
