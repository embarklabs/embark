const stringify = require("json-stringify-safe");
const RxDB = require('rxdb');

RxDB.plugin(require('pouchdb-adapter-node-websql'))

function jsonFunctionReplacer(_key, value) {
  if (typeof value === 'function') {
    return value.toString();
  }
  return value;
}

const schemaWithIndexes = {
  version: 0,
  title: 'human schema no compression',
  keyCompression: false,
  type: 'object',
  properties: {
      uid: {
          type: 'string',
          primary: true       // <- an index for firstName will now be created
      },
      values: {
          type: 'string',
          final: false
      }
  }
};

function test() {
  RxDB.create({
    name: 'mydatabase',
    adapter: 'websql' // name of the adapter
  }).then((x) => {
    this.db = x;
    this.db.collection({
      name: 'embarklogs',
      schema: schemaWithIndexes
    }).then(() => {
      let _data = {id: "123", foo: 1, bar: 2}
      // this.db.embarklogs.insert({uid: _data.id, values: stringify(_data, jsonFunctionReplacer, 2)})

      console.dir("===============")
      this.db.embarklogs.upsert({uid: _data.id, values: stringify(_data, jsonFunctionReplacer, 2)})
      // this.db.embarklogs.upsert({uid: _data.id, values: "123"})

      setTimeout(() => {
        let getNode = this.db.embarklogs.find().where('uid').eq(_data.id).exec().then((n) => {
          // console.dir(n)
          n.update({$set: {values: "123"}});
        });
      }, 3 * 1000);

      // console.dir("===============")
      // let getNode = this.db.embarklogs.find().where('uid').eq(_data.id).exec().then((n) => {
        // n.update({$set: {values: "123"}});
      // });
      // getNode.update({$set: {values: "123"}});
      // console.dir("===============")
      setTimeout(() => {
        this.db.embarklogs.dump().then(console.dir)
      }, 10*1000);

      // this.db.embarklogs.findOne(_data.id).exec().then((doc) => {
        // console.dir("=== doc")
        // console.dir(doc)
      // })
      // addRecord({
      //   session: this.session,
      //   id: this.session,
      //   timestamp: Date.now(),
      //   value: "new_session",
      //   type: "new_session",
      //   name: "new_session"
      // }, this.db)
    })
  });
}

test();
