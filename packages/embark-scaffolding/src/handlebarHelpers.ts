import Handlebars from "handlebars";
import { AbiItem } from "web3-utils";

Handlebars.registerHelper("capitalize", (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1);
});

Handlebars.registerHelper("lowercase", (word: string) => {
  return word.toLowerCase();
});

Handlebars.registerHelper("ifview", function(stateMutability: string, options: Handlebars.HelperOptions) {
  const isView = stateMutability === "view" || stateMutability === "pure" || stateMutability === "constant";
  if (isView) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper("ifstring", function(value: string, options: Handlebars.HelperOptions) {
  if (value === "string") {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper("ifeq", function(elem: string, value: string, options: Handlebars.HelperOptions) {
  if (elem === value) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper("ifarr", function(elem: string, options: Handlebars.HelperOptions) {
  if (elem.indexOf("[]") > -1) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper("iflengthgt", function(arr, val, options: Handlebars.HelperOptions) {
  if (arr.length > val) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper("emptyname", (name: string, index: string) => {
  return name ? name : "output" + index;
});

Handlebars.registerHelper("trim", (name: string) => {
  return name.replace("[]", "");
});

Handlebars.registerHelper("methodname", (abiDefinition: AbiItem[], functionName: string, inputs: any[]) => {
  const funCount = abiDefinition.filter((x) => x.name === functionName).length;
  if (funCount === 1) {
    return "." + functionName;
  }
  return new Handlebars.SafeString(`["${functionName}(${inputs !== null ? inputs.map((input) => input.type).join(",") : ""})"]`);
});
