const fuzzySearch = require("../../utils/utils").fuzzySearch;

import { Embark, Events } from "../../../typings/embark";

interface ContractsManager {
  [key: string]: any;
}

interface Suggestion {
  value: string;
  command_type: string;
  description: string;
}

type SuggestionsList = Suggestion[];

export default class Suggestions {
  private embark: Embark;
  private events: Events;
  private contracts: ContractsManager;

  constructor(embark: Embark, options?: object) {
    this.embark = embark;
    this.events = embark.events;
    this.contracts = {};

    this.registerApi();
    this.listenToEvents();
  }

  private registerApi() {
    this.embark.registerAPICall("post", "/embark-api/suggestions", (req: any, res: any) => {
      const cmd: string = req.body.command || "";
      this.getSuggestions(cmd, (suggestions: SuggestionsList) => {
        res.send({result: this.sortSuggestions(cmd, suggestions)});
      });
    });
  }

  private listenToEvents() {
    this.events.on("deploy:contract:deployed", (contract: any) => {
      this.contracts[contract.className] = contract;
    });
  }

  public sortSuggestions(cmd: string, suggestions: SuggestionsList) {
    // sort first the ones that match the command at the beginning of the string, then prefer smaller commands first
    return suggestions.sort((x: Suggestion, y: Suggestion) => {
      const diff = x.value.indexOf(cmd) - y.value.indexOf(cmd);
      if (diff !== 0) { return diff; }
      return x.value.length - y.value.length;
    });
  }

  public getSuggestions(cmd: string, cb: (results: SuggestionsList) => any) {
    if (cmd === "") { return cb([]); }
    cmd = cmd.toLowerCase();
    const suggestions: SuggestionsList = [];

    suggestions.push({value: "web3.eth", command_type: "web3 object", description: "module for interacting with the Ethereum network"});
    suggestions.push({value: "web3.net", command_type: "web3 object", description: "module for interacting with network properties"});
    suggestions.push({value: "web3.shh", command_type: "web3 object", description: "module for interacting with the whisper protocol"});
    suggestions.push({value: "web3.bzz", command_type: "web3 object", description: "module for interacting with the swarm network"});
    suggestions.push({value: "web3.eth.getAccounts()", command_type: "web3 object", description: "get list of accounts"});

    Object.values(this.contracts).forEach((contract: any) => {
      suggestions.push({value: contract.className, command_type: "web3 object", description: "contract deployed at " + contract.deployedAddress});
      suggestions.push({value: "profile " + contract.className, command_type: "embark command", description: "profile " + contract.className + " contract"});
    });

    suggestions.push({value: "help", command_type: "embark command", description: "displays quick list of some of the available embark commands"});
    suggestions.push({value: "versions", command_type: "embark command", description: "display versions in use for libraries and tools like web3 and solc"});
    suggestions.push({value: "ipfs", command_type: "javascript object", description: "instantiated js-ipfs object configured to the current environment (available if ipfs is enabled)"});
    suggestions.push({value: "swarm", command_type: "javascript object", description: "instantiated swarm-api object configured to the current environment (available if swarm is enabled)"});
    suggestions.push({value: "web3", command_type: "javascript object", description: "instantiated web3.js object configured to the current environment"});
    suggestions.push({value: "EmbarkJS", command_type: "javascript object", description: "EmbarkJS static functions for Storage, Messages, Names, etc."});

    if (cmd.indexOf(".") <= 0) {
      return cb(fuzzySearch(cmd, suggestions, (suggestion: Suggestion) => suggestion.value + " " + suggestion.description).map((x: any) => x.original));
    }

    try {
      const toRemove: string = "." + cmd.split(".").reverse()[0];
      const cmdToSearch: string = cmd.replace((new RegExp(toRemove + "$")), "");
      return this.events.request("runcode:eval", "Object.keys(" + cmdToSearch + ")", (err: any, result: any) => {
        try {
          if (Array.isArray(result)) {
            result.forEach((match: string) => {
              suggestions.push({value: cmdToSearch + "." + match, command_type: "javascript object", description: ""});
            });
          }
        } catch (e) {
        }

        return cb(fuzzySearch(cmd, suggestions, (suggestion: Suggestion) => suggestion.value + " " + suggestion.description).map((x: any) => x.original));
      }, false, true);
    } catch (e) {
    }

    return cb(fuzzySearch(cmd, suggestions, (suggestion: Suggestion) => suggestion.value + " " + suggestion.description).map((x: any) => x.original));
  }
}
