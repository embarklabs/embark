import async from "async";

function asyncEachObject(object: any, iterator: any, callback: any) {
  async.each(
    Object.keys(object || {}),
    (key, next) => {
      iterator(key, object[key], next);
    },
    callback,
  );
}

// @ts-ignore
async.eachObject = asyncEachObject;

export default async;
