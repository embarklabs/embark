var Tests = require('embark-framework').Tests;

SimpleStorage = Tests.request("SimpleStorage");

SimpleStorage.set(100);

a = SimpleStorage.get()
console.log(a)

