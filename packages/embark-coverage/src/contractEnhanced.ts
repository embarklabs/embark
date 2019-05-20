import { File } from "embark-utils";
import * as fs from "fs-extra";
import * as path from "path";
import parser, { LineColumn, Location } from "solidity-parser-antlr";
import { EventLog } from "web3/types";

import { decrypt } from "./eventId";
import { Injector } from "./injector";
import { Instrumenter } from "./instrumenter";
import { InstrumentWalker } from "./instrumentWalker";
import { coverageContractsPath } from "./path";
import { BranchType, Coverage } from "./types";

const STATEMENT_EVENT = "__StatementCoverage";
const POINT_FACTOR = 1000000000;

let id = 0;
function nextId() {
  id++;
  return id;
}

export class ContractEnhanced {
  public id: number;
  public coverage: Coverage;
  public coverageFilepath: string;
  public originalSource: string;
  public source: string;
  private ast!: parser.ASTNode;
  private functionsBodyLocation: {[id: number]: Location} = {};

  constructor(public filepath: string, public solcVersion: string) {
    this.id = nextId();

    // silence compiler warnings.
    this.source = this.originalSource = "";

    try {
      this.source = fs.readFileSync(filepath, "utf-8");
      this.originalSource = this.source;
      this.ast = parser.parse(this.source, {loc: true, range: true});
    } catch (error) {
      const {line, column, message} = error.errors[0];
      console.warn(`Error on ${this.filepath}:${line}:${column}: "${message}". Could not setup for coverage.`);
    }

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
  }

  public instrument() {
    if (!this.ast) {
      return;
    }
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
      const {contractId, injectionPointId} = decrypt(value);

      if (contractId !== this.id) {
        return;
      }

      this.coverage.s[injectionPointId] += 1;
      const location = this.coverage.statementMap[injectionPointId];
      this.coverage.l[location.start.line] += 1;

      const fnMapId = this.findFnMapId(location);
      if (fnMapId) {
        this.coverage.f[fnMapId] += 1;
      }

      const [fnBranchId, locationId] = this.findFnBranchIdAndLocationId(location);
      if (fnBranchId) {
        this.coverage.b[fnBranchId][locationId] += 1;
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

  public addFunction(location: Location, name: string, bodyLocation: Location) {
    const coverageId = this.getNewCoverageId(this.coverage.fnMap);
    const line = location.start.line;
    this.coverage.fnMap[coverageId] = {
      line,
      loc: location,
      name,
    };
    this.coverage.f[coverageId] = 0;
    this.functionsBodyLocation[coverageId] = bodyLocation;
    return coverageId;
  }

  private getNewCoverageId(object: {[key: string]: any}) {
    const lastId = Object.keys(object).map(Number).sort((a, b) => b - a)[0] || 0;
    return lastId + 1;
  }

  private filterCoverageEvent(event: EventLog) {
    return STATEMENT_EVENT === event.event;
  }

  private findFnMapId(location: Location) {
    const result = Object.keys(this.functionsBodyLocation).find((value: string) => {
      const bodyLocation = this.functionsBodyLocation[parseInt(value, 10)];

      return this.isWithin(location.start, bodyLocation);
    });

    if (result) {
      return parseInt(result, 10);
    }

    return 0;
  }

  private findFnBranchIdAndLocationId(location: Location) {
    let fnBranchId = 0;
    let locationId = 0;
    Object.keys(this.coverage.branchMap).forEach((value: string) => {
      if (fnBranchId && locationId) {
        return;
      }

      const branch = this.coverage.branchMap[parseInt(value, 10)];

      branch.locations.forEach((branchLocation, index) => {
        if (this.isWithin(location.start, branchLocation)) {
          fnBranchId = parseInt(value, 10);
          locationId = index;
        }
      });
    });

    return [fnBranchId, locationId];
  }

  private isWithin(point: LineColumn, location: Location) {
    const toCompare = this.getComparablePoint(point);
    return toCompare >= this.getComparablePoint(location.start) && toCompare <= this.getComparablePoint(location.end);
  }

  private getComparablePoint(point: LineColumn) {
    return point.line * POINT_FACTOR + point.column;
  }

}
