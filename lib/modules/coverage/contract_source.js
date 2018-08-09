const SourceMap = require('./source_map');

class ContractSource {
  constructor(file, body) {
    this.file = file;
    this.body = body;

    this.lineLengths = body.split("\n").map((line) => { return line.length; });
    this.lineCount = this.lineLengths.length;

    this.lineOffsets = [];
    this.lineLengths.forEach((length, line) => {
      if(line == 0) {
        this.lineOffsets[0] = 0;
        return;
      }

      // +1 here factors in newline characters.
      this.lineOffsets[line] = this.lineOffsets[line-1] + this.lineLengths[line-1] + 1;
    });

    this.contracts = {};
  }

  sourceMapToLocations(sourceMap) {
    var [offset, length, ..._] = sourceMap.split(":").map((val) => {
      return parseInt(val, 10);
    });

    var locations = {};

    for(let i = 0; i < this.lineCount; i++) {
      if(this.lineOffsets[i+1] <= offset) continue;

      locations.start = {line: i, column: offset - this.lineOffsets[i]};
      break;
    }

    for(var i = locations.start.line; i < this.lineCount; i++) {
      if(this.lineOffsets[i+1] <= offset + length) continue;

      locations.end = {line: i, column: ((offset + length) - this.lineOffsets[i])};
      break;
    }

    // Ensure we return an "end" as a safeguard if the marker ends up to be
    // or surpass the offset for last character.
    if(!locations.end) {
      var lastLine = this.lineCount - 1;
      locations.end = {line: lastLine, column: this.lineLengths[lastLine]};
    }

    // Istanbul likes lines to be 1-indexed, so we'll increment here before returning.
    locations.start.line++;
    locations.end.line++;
    return locations;
  }

  parseSolcOutput(source, contracts) {
    this.id = source.id;
    this.ast = source.ast;
    this.contractBytecode = {};

    for(var contractName in contracts) {
      this.contractBytecode[contractName] = {};

      var contract = contracts[contractName];
      var bytecodeMapping = this.contractBytecode[contractName];
      var opcodes = contract.evm.deployedBytecode.opcodes.trim().split(' ');
      var sourceMaps = contract.evm.deployedBytecode.sourceMap.split(';');

      var bytecodeIdx = 0;
      var pc = 0;
      var instructions = 0;
      do {
        var instruction = opcodes[bytecodeIdx];
        var length = this._instructionLength(instruction);
        bytecodeMapping[pc] = {
          instruction: instruction,
          sourceMap: sourceMaps[instructions],
          seen: false
        };

        pc += length;
        instructions++;
        bytecodeIdx += (length > 1) ? 2 : 1;
      } while(bytecodeIdx < opcodes.length);
    }
  }

  /*eslint complexity: ["error", 27]*/
  generateCodeCoverage(trace) {
    if(!this.ast || !this.contractBytecode) throw new Error('Error generating coverage: solc output was not assigned');

    var coverage = {
      code: this.body.split("\n"),
      l: {},
      path: this.file,
      s: {},
      b: {},
      f: {},
      fnMap: {},
      statementMap: {},
      branchMap: {}
    };

    var nodesRequiringVisiting = [this.ast];
    var sourceMapToNodeType = {};

    do {
      var node = nodesRequiringVisiting.pop();
      if(!node) continue;

      var children = [];
      var markLocations = [];

      switch(node.nodeType) {
        case 'Identifier':
        case 'Literal':
        case 'VariableDeclaration':
          // We don't need to do anything with these. Just carry on.
          break;

        case 'IfStatement':
          coverage.b[node.id] = [0,0];

          var location = this.sourceMapToLocations(node.src);
          var trueBranchLocation = this.sourceMapToLocations(node.trueBody.src);

          var falseBranchLocation;
          if(node.falseBody) {
            falseBranchLocation = this.sourceMapToLocations(node.falseBody.src);
          } else {
            falseBranchLocation = trueBranchLocation;
          }

          coverage.branchMap[node.id] = {
            type: 'if',
            locations: [trueBranchLocation, falseBranchLocation],
            line: location.start.line
          };

          children = [node.condition]
            .concat(node.trueBody.statements);

          if(node.falseBody) children = children.concat(node.falseBody.statements);

          markLocations = [location, trueBranchLocation, falseBranchLocation];

          if(node.trueBody.statements[0]) {
            node.trueBody.statements[0]._parent = {type: 'b', id: node.id, idx: 0};
          }

          if(node.falseBody && node.falseBody.statements[0]) {
            node.falseBody.statements[0]._parent = {type: 'b', id: node.id, idx: 1};
          }

          sourceMapToNodeType[node.src] = [{type: 'b', id: node.id, body: {loc: location}}];
          break;

        case 'BinaryOperation':
          children = [node.leftExpression, node.rightExpression];
          break;

        case 'Return':
          // Return is a bit of a special case, because the statement src is the
          // return "body". We don't `break` here on purpose so it can share the
          // same logic below.
          node.src = node.expression.src;
          // falls through

        case 'Assignment':
        case 'ExpressionStatement':
          coverage.s[node.id] = 0;

          location = this.sourceMapToLocations(node.src);
          coverage.statementMap[node.id] = location;

          if(!sourceMapToNodeType[node.src]) sourceMapToNodeType[node.src] = [];
          sourceMapToNodeType[node.src].push({
            type: 's',
            id: node.id,
            body: {loc: coverage.statementMap[node.id]},
            parent: node._parent
          });


          children = node.expression ? [node.expression] : [];
          markLocations = [location];
          break;

        case 'ContractDefinition':
        case 'SourceUnit':
          children = node.nodes;
          break;

        case 'PragmaDirective':
          // These nodes do nothing, so we move on.
          break;

        case 'FunctionDefinition':
          // Istanbul only wants the function definition, not the body, so we're
          // going to do some fun math here.
          var functionSourceMap = new SourceMap(node.src);
          var functionParametersSourceMap = new SourceMap(node.parameters.src);

          var functionDefinitionSourceMap = new SourceMap(
            functionSourceMap.offset,
            (functionParametersSourceMap.offset + functionParametersSourceMap.length) - functionSourceMap.offset
          ).toString();

          var fnName = node.isConstructor ? "(constructor)" : node.name;
          location = this.sourceMapToLocations(functionDefinitionSourceMap);

          coverage.f[node.id] = 0;
          coverage.fnMap[node.id] = {
            name: fnName,
            line: location.start.line,
            loc: location
          };

          // Record function positions.
          sourceMapToNodeType[node.src] = [{type: 'f', id: node.id, body: coverage.fnMap[node.id]}];

          if(node.body) children = node.body.statements;
          markLocations = [location];
          break;

        default:
          // console.log(`Don't know how to handle node type ${node.nodeType}`);
          break;
      }

      nodesRequiringVisiting = nodesRequiringVisiting.concat(children);

      markLocations.forEach((location) => {
        for(var i = location.start.line; i <= location.end.line; i++) {
          coverage.l[i] = 0;
        }
      });

    } while(nodesRequiringVisiting.length > 0);

    var contractMatches = true;
    for(var contractName in this.contractBytecode) {
      var bytecode = this.contractBytecode[contractName];

      // Try to match the contract to the bytecode. If it doesn't,
      // then we bail.
      trace.structLogs.forEach((step) => {
        if(!contractMatches) return;

        if(!bytecode[step.pc]) {
          // This contract won't match so we bail
          contractMatches = false;
          return;
        }
      });

      if(!contractMatches) break;

      trace.structLogs.forEach((step) => {
        step = bytecode[step.pc];
        if(!step.sourceMap || step.sourceMap == '') return;

        var nodes = sourceMapToNodeType[step.sourceMap];

        if(!nodes) return;

        var recordedLineHit = false;

        nodes.forEach((node) => {
          if(node.body && node.body.loc && !recordedLineHit) {
            for(var line = node.body.loc.start.line; line <= node.body.loc.end.line; line++) {
              coverage.l[line]++;
            }

            recordedLineHit = true;
          }

          if(node.type != 'b') coverage[node.type][node.id]++;

          if(!node.parent) return;

          switch(node.parent.type) {
            case 'b':
              coverage.b[node.parent.id][node.parent.idx]++;
              break;

            default:
              // do nothing
          }
        });
      });
    }

    return coverage;
  }

  _instructionLength(instruction) {
    if(instruction.indexOf('PUSH') == -1) return 1;
    return parseInt(instruction.match(/PUSH(\d+)/m)[1], 10) + 1;
  }
}

module.exports = ContractSource;
