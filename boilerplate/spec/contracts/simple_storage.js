EmbarkSpec = require("embark-framework").specs();

SimpleStorage = EmbarkSpec.SimpleStorage;

SimpleStorage.set(100);

a = SimpleStorage.get()
console.log(a)

