const SourceMap = require('./source_map');

class ContractSource {
  constructor(file, path, body) {
    let self = this;

    this.file = file;
    this.path = path;
    this.body = body;

    this.lineLengths = body.split("\n").map((line) => { return line.length; });
    this.lineCount = this.lineLengths.length;

    this.lineOffsets = this.lineLengths.reduce((sum, _elt, i) => {
      sum[i] = (i == 0) ? 0 : self.lineLengths[i-1] + sum[i-1] + 1;
      return sum;
    }, []);

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
      var previousSourceMap = null;

      do {
        let sourceMap;

        if(previousSourceMap === null) {
          sourceMap = new SourceMap(sourceMaps[instructions]);
        } else {
          sourceMap = previousSourceMap.createRelativeTo(sourceMaps[instructions]);
        }

        var instruction = opcodes[bytecodeIdx];
        var length = this._instructionLength(instruction);
        bytecodeMapping[pc] = {
          instruction: instruction,
          sourceMap: sourceMap,
          jump: sourceMap.jump,
          seen: false
        };

        pc += length;
        instructions++;
        bytecodeIdx += (length > 1) ? 2 : 1;
        previousSourceMap = sourceMap;
      } while(bytecodeIdx < opcodes.length);
    }
  }

  /*eslint complexity: ["error", 34]*/
  generateCodeCoverage(trace) {
    if(!this.ast || !this.contractBytecode) throw new Error('Error generating coverage: solc output was not assigned');

    let coverage = {
      code: this.body.trim().split("\n"),
      l: {},
      path: this.path,
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
      let node = nodesRequiringVisiting.pop();
      if(!node) continue;

      let children = [];
      let markLocations = [];
      let location;

      switch(node.nodeType) {
        case 'Assignment':
        case 'EventDefinition':
        case 'Literal':
        case 'PragmaDirective':
        case 'VariableDeclaration':
          // We don't need to do anything with these. Just carry on.
          break;

        case 'IfStatement': {
          location = this.sourceMapToLocations(node.src);
          let trueBranchLocation = this.sourceMapToLocations(node.trueBody.src);

          let declarationSourceMap = new SourceMap(node.src).subtract(new SourceMap(node.trueBody.src));
          let declarationLocation = this.sourceMapToLocations(declarationSourceMap.toString());

          var falseBranchLocation;
          if(node.falseBody) {
            falseBranchLocation = this.sourceMapToLocations(node.falseBody.src);
          } else {
            falseBranchLocation = trueBranchLocation;
          }

          coverage.b[node.id] = [0,0];
          coverage.branchMap[node.id] = {
            type: 'if',
            locations: [trueBranchLocation, falseBranchLocation],
            line: location.start.line
          };

          children = [node.condition]
            .concat(node.trueBody.statements);

          if(node.falseBody) children = children.concat(node.falseBody.statements);

          markLocations = [declarationLocation];

          if(node.trueBody.statements[0]) {
            node.trueBody.statements[0]._parent = {type: 'b', id: node.id, idx: 0};
          }

          if(node.falseBody && node.falseBody.statements[0]) {
            node.falseBody.statements[0]._parent = {type: 'b', id: node.id, idx: 1};
          }

          sourceMapToNodeType[node.src] = [{type: 'b', id: node.id, body: {loc: location}}];
          break;
        }

        case 'EmitStatement': {
          children = [node.eventCall];
          break;
        }

        case 'BinaryOperation':
        case 'ExpressionStatement':
        case 'FunctionCall':
        case 'Identifier':
        case 'Return':
        case 'UnaryOperation':
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


          //children = node.expression ? [node.expression] : [];
          markLocations = [location];
          break;

        case 'ContractDefinition':
        case 'SourceUnit':
          children = node.nodes;
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

        case 'ForStatement': {
          // For statements will be a bit of a special case. We want to count the body
          // iterations but we only want to count the for loop being hit once. Because
          // of this, we cover the initialization on the node.
          let sourceMap = new SourceMap(node.src);
          let bodySourceMap = new SourceMap(node.body.src);
          let forLoopDeclaration = sourceMap.subtract(bodySourceMap).toString();
          let initializationLocation = this.sourceMapToLocations(node.initializationExpression.src);

          location = this.sourceMapToLocations(forLoopDeclaration);

          coverage.s[node.id] = 0;
          coverage.statementMap[node.id] = location;

          if(!sourceMapToNodeType[node.initializationExpression.src]) sourceMapToNodeType[node.initializationExpression.src] = [];
          sourceMapToNodeType[node.initializationExpression.src].push({type: 's', id: node.id, body: {loc: location}});

          children = node.body.statements;
          markLocations = [initializationLocation];
          break;
        }

        case 'VariableDeclarationStatement': {
          location = this.sourceMapToLocations(node.src);

          coverage.s[node.id] = 0;
          coverage.statementMap[node.id] = location;
          markLocations = [location];

          if(!sourceMapToNodeType[node.src]) sourceMapToNodeType[node.src] = [];
          sourceMapToNodeType[node.src].push({type: 's', id: node.id, body: {loc: location}, foo: 'bar'});

          break;
        }

        default:
          console.log(`Don't know how to handle node type ${node.nodeType}`);
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
      contractMatches = trace.structLogs.every((step) => { return bytecode[step.pc]; });
      if(!contractMatches) break;

      trace.structLogs.forEach((step) => {
        step = bytecode[step.pc];
        if(!step.sourceMap || step.sourceMap == '' || step.sourceMap == SourceMap.empty()) return;
        let sourceMapString = step.sourceMap.toString(this.id);
        var nodes = sourceMapToNodeType[sourceMapString];

        if(!nodes) return;

        nodes.forEach((node) => {
          // Skip duplicate function reports by only reporting when there is a jump.
          if(node.type == 'f' && step.jump) return;

          if(node.type != 'b' && node.body && node.body.loc) {
            for(var line = node.body.loc.start.line; line <= node.body.loc.end.line; line++) {
              coverage.l[line]++;
            }
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
