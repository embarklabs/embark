var Tests = require('embark-framework').Tests;

SimpleStorage = Tests.request("SimpleStorage", 150);

SimpleStorage.set(100);

a = SimpleStorage.get()
console.log(a)

a = SimpleStorage.foo()
console.log(a)

