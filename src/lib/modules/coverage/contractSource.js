const SourceMap = require('./sourceMap');

class ContractSource {
  constructor(file, path, body) {
    this.file = file;
    this.path = path;
    this.body = body;

    this.lineLengths = body.split("\n").map(line => line.length);
    this.lineCount = this.lineLengths.length;

    this.lineOffsets = this.lineLengths.reduce((sum, _elt, i) => {
      sum[i] = (i === 0) ? 0 : this.lineLengths[i-1] + sum[i-1] + 1;
      return sum;
    }, []);

    this.contracts = {};
  }

  sourceMapToLocations(sourceMap) {
    const [offset, length, ..._] = sourceMap.split(":").map((val) => {
      return parseInt(val, 10);
    });

    const locations = {};

    for(let i = 0; i < this.lineCount; i++) {
      if(this.lineOffsets[i+1] <= offset) continue;

      locations.start = {line: i, column: offset - this.lineOffsets[i]};
      break;
    }

    for(let i = locations.start.line; i < this.lineCount; i++) {
      if(this.lineOffsets[i+1] <= offset + length) continue;

      locations.end = {line: i, column: ((offset + length) - this.lineOffsets[i])};
      break;
    }

    // Ensure we return an "end" as a safeguard if the marker ends up to be
    // or surpass the offset for last character.
    if(!locations.end) {
      const lastLine = this.lineCount - 1;
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
    this.contractDeployedBytecode = {};

    for(const contractName in contracts) {
      this.contractBytecode[contractName] = {};
      this.contractDeployedBytecode[contractName] = {};

      var contract = contracts[contractName];
      var opcodes = contract.evm.bytecode.opcodes.trim().split(' ');
      var deployedOpcodes = contract.evm.deployedBytecode.opcodes.trim().split(' ');
      var sourceMaps = contract.evm.bytecode.sourceMap.split(';');
      var deployedSourceMaps = contract.evm.deployedBytecode.sourceMap.split(';');

      this._buildContractBytecode(contractName, this.contractBytecode, opcodes, sourceMaps);
      this._buildContractBytecode(contractName, this.contractDeployedBytecode, deployedOpcodes, deployedSourceMaps);
    }
  }

  isInterface() {
    return this.contractBytecode !== undefined &&
      Object.values(this.contractBytecode).every((contractBytecode) => { return (Object.values(contractBytecode).length <= 1); });
  }

  /*eslint complexity: ["error", 42]*/
  generateCodeCoverage(trace) {
    if(!this.ast || !this.contractBytecode) throw new Error('Error generating coverage: solc output was not assigned');

    const coverage = {
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

    let nodesRequiringVisiting = [this.ast];
    const sourceMapToNodeType = {};

    do {
      const node = nodesRequiringVisiting.pop();
      if(!node) continue;

      let children = [];
      let markLocations = [];
      let location;
      switch(node.nodeType) {
        case 'Assignment':
        case 'EventDefinition':
        case 'ImportDirective':
        case 'Literal':
        case 'PlaceholderStatement':
        case 'PragmaDirective':
        case 'StructDefinition':
        case 'VariableDeclaration':
          // We don't need to do anything with these. Just carry on.
          break;

        case 'IfStatement': {
          location = this.sourceMapToLocations(node.src);
          const trueBranchLocation = this.sourceMapToLocations(node.trueBody.src);

          const declarationSourceMap = new SourceMap(node.src).subtract(new SourceMap(node.trueBody.src));
          const declarationLocation = this.sourceMapToLocations(declarationSourceMap.toString());

          let falseBranchLocation;
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

          markLocations = [declarationLocation];
          children = [node.condition];

          const trueExpression = (node.trueBody && node.trueBody.statements && node.trueBody.statements[0]) || node.trueBody;
          if(trueExpression) {
            children = children.concat(trueExpression);
            trueExpression._parent = {type: 'b', id: node.id, idx: 0};
          }

          const falseExpression = (node.falseBody && node.falseBody.statements && node.falseBody.statements[0]) || node.falseBody;
          if(falseExpression) {
            children = children.concat(falseExpression);
            falseExpression._parent = {type: 'b', id: node.id, idx: 1};
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

          markLocations = [location];
          break;

        case 'ContractDefinition':
        case 'SourceUnit':
          children = node.nodes;
          break;

        case 'ModifierDefinition':
        case 'FunctionDefinition': {
          // Istanbul only wants the function definition, not the body, so we're
          // going to do some fun math here.
          const functionSourceMap = new SourceMap(node.src);
          const functionParametersSourceMap = new SourceMap(node.parameters.src);

          const functionDefinitionSourceMap = new SourceMap(
            functionSourceMap.offset,
            (functionParametersSourceMap.offset + functionParametersSourceMap.length) - functionSourceMap.offset
          ).toString();

          const fnName = node.isConstructor ? "(constructor)" : node.name;
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
        }
        case 'ForStatement': {
          // For statements will be a bit of a special case. We want to count the body
          // iterations but we only want to count the for loop being hit once. Because
          // of this, we cover the initialization on the node.
          const sourceMap = new SourceMap(node.src);
          const bodySourceMap = new SourceMap(node.body.src);
          const forLoopDeclaration = sourceMap.subtract(bodySourceMap).toString();

          location = this.sourceMapToLocations(forLoopDeclaration);

          const markExpression = node.initializationExpression || node.loopExpression;
          const expressionLocation = this.sourceMapToLocations(markExpression.src);

          if(!sourceMapToNodeType[markExpression.src]) sourceMapToNodeType[markExpression.src] = [];
          sourceMapToNodeType[markExpression.src].push({type: 's', id: node.id, body: {loc: location}});
          markLocations = [expressionLocation];

          coverage.s[node.id] = 0;
          coverage.statementMap[node.id] = location;

          children = node.body.statements;
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
          break;
      }

      nodesRequiringVisiting = nodesRequiringVisiting.concat(children);

      markLocations.forEach((location) => {
        for(var i = location.start.line; i <= location.end.line; i++) {
          coverage.l[i] = 0;
        }
      });

    } while(nodesRequiringVisiting.length > 0);

    this._generateCodeCoverageForBytecode(trace, coverage, sourceMapToNodeType, this.contractBytecode);
    this._generateCodeCoverageForBytecode(trace, coverage, sourceMapToNodeType, this.contractDeployedBytecode);

    return coverage;
  }

  _generateCodeCoverageForBytecode(trace, coverage, sourceMapToNodeType, contractBytecode) {
    let contractMatches = true;
    for(const contractName in contractBytecode) {
      const bytecode = contractBytecode[contractName];

      // Try to match the contract to the bytecode. If it doesn't,
      // then we bail.

      contractMatches = trace.structLogs.every((step) => bytecode[step.pc]);
      if(!contractMatches) continue;

      trace.structLogs.forEach((step) => {
        step = bytecode[step.pc];
        if(!step.sourceMap || step.sourceMap === '' || step.sourceMap === SourceMap.empty()) return;
        const sourceMapString = step.sourceMap.toString(this.id);
        const nodes = sourceMapToNodeType[sourceMapString];

        if(!nodes) return;

        nodes.forEach((node) => {
          // Skip duplicate function reports by only reporting when there is a jump.
          if(node.type === 'f' && step.jump) return;

          if(node.type !== 'b' && node.body && node.body.loc) {
            for(let line = node.body.loc.start.line; line <= node.body.loc.end.line; line++) {
              coverage.l[line]++;
            }
          }

          if(node.type !== 'b') coverage[node.type][node.id]++;

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
  }

  _buildContractBytecode(contractName, contractBytecode, opcodes, sourceMaps) {
    const bytecodeMapping = contractBytecode[contractName];
    let bytecodeIdx = 0;
    let pc = 0;
    let instructions = 0;
    let previousSourceMap = null;

    do {
      let sourceMap;
      const sourceMapArgs = sourceMaps[instructions];
      if(previousSourceMap === null) {
        sourceMap = new SourceMap(sourceMapArgs);
      } else {
        sourceMap = previousSourceMap.createRelativeTo(sourceMapArgs);
      }

      const instruction = opcodes[bytecodeIdx];
      const length = this._instructionLength(instruction);
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

  _instructionLength(instruction) {
    if(instruction.indexOf('PUSH') === -1) return 1;
    return parseInt(instruction.match(/PUSH(\d+)/m)[1], 10) + 1;
  }
}

module.exports = ContractSource;
