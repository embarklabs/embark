import { Contract, Embark, EmbarkEvents } from "embark-core";
import { fuzzySearch } from "embark-utils";
import { readJsonSync } from "fs-extra";
import { join } from "path";

const { suggestions: defaultSuggestions } = readJsonSync(join(__dirname, "../suggestions.json"));

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
  private events: EmbarkEvents;
  private contracts: ContractsManager;
  private static readonly DEFAULT_SUGGESTIONS = defaultSuggestions;
  private _suggestions: SuggestionsList = [];

  constructor(embark: Embark, options?: object) {
    this.embark = embark;
    this.events = embark.events;
    this.contracts = {};
    this.registerApi();
    this.listenToEvents();
  }

  private get suggestions(): SuggestionsList {
    if (this._suggestions.length) {
      return this._suggestions;
    }

    this._suggestions = [...Suggestions.DEFAULT_SUGGESTIONS];

    Object.values(this.contracts).forEach((contract: Contract) => {
      this._suggestions.push({value: contract.className, command_type: "web3 object", description: "contract deployed at " + contract.deployedAddress});
      this._suggestions.push({value: "profile " + contract.className, command_type: "embark command", description: "profile " + contract.className + " contract"});
    });

    const plugins = this.embark.config.plugins.getPluginsProperty("console", "console");
    for (const plugin of plugins) {
      this._suggestions.push({
        command_type: "plugin command",
        description: plugin.description,
        value: this.formatMatches((JSON.stringify(plugin.usage) || "").replace(/\"/g, "").trim()) || this.formatMatches(plugin.matches),
      });
    }

    return this._suggestions;
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
    this.embark.events.once("deployment:deployContracts:afterAll", () => {
      this.events.on("deployment:contract:deployed", ({contract}: {contract: Contract}) => {
        this.contracts[contract.className] = contract;
        // reset backing variable so contracts suggestions can be re-built for next request
        this._suggestions = [];
      });

      this.embark.events.request("contracts:list", (_: any, contracts: Contract[]) => {
        contracts.forEach((contract) => { this.contracts[contract.className] = contract; });
        this._suggestions = [];
      });
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

  private formatMatches(matches: any): string {
    if (Array.isArray(matches)) {
      return matches.join(", ");
    }
    if (typeof matches === "function") {
      return "";
    }
    if (!matches) {
      return "";
    }
    return matches.split("/")[0];
  }

  public getSuggestions(cmd: string, cb: (results: SuggestionsList) => any) {
    // Don't bother returning suggestions for empty commands or for
    // commands that already have `(` or `)` to avoid executing code
    if (cmd === "") { return cb([]); }
    if (cmd.indexOf("(") !== -1 || cmd.indexOf(")") !== -1) { return cb([]); }

    const suggestions = this.suggestions;

    if (cmd.indexOf(".") <= 0) {
      return cb(this.searchSuggestions(cmd.toLowerCase(), suggestions));
    }

    try {
      const toRemove: string = "." + cmd.split(".").reverse()[0];
      const cmdToSearch: string = cmd.replace((new RegExp(toRemove + "$")), "");

      if (!cmdToSearch) {
        return cb(this.searchSuggestions(cmd, suggestions));
      }
      return this.events.request("runcode:eval", `${cmdToSearch} && Object.getOwnPropertyNames(${cmdToSearch})`, (err: any, result: any) => {
        try {
          if (Array.isArray(result)) {
            result.forEach((match: string) => {
              suggestions.push({value: cmdToSearch + "." + match, command_type: "javascript object", description: ""});
            });
          }
        } catch (e) {
        }

        return cb(this.searchSuggestions(cmd, suggestions));
      }, true);
    } catch (e) {
    }

    return cb(this.searchSuggestions(cmd, suggestions));
  }

  private searchSuggestions(cmd: string, suggestions: SuggestionsList) {
    return fuzzySearch(cmd, suggestions, (suggestion: Suggestion) => suggestion.value + " " + suggestion.description).map((x: any) => x.original);
  }
}
