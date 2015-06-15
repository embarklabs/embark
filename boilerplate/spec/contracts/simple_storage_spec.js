EmbarkSpec = require('embark-framework').Tests;

describe("SimpleStorage", function() {
  beforeAll(function() {
    SimpleStorage = EmbarkSpec.request("SimpleStorage", [150]);
  });

  it("should set constructor value", function() {
    expect(SimpleStorage.foo()).toEqual('150');
  });

  it("set storage value", function() {
    SimpleStorage.set(100);
    expect(SimpleStorage.get()).toEqual('100');
  });

})
